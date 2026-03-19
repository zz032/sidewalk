'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Scene, ConversationMessage } from '../types'
import MicrophoneButton from './MicrophoneButton'
import { speakForCharacter } from '../lib/audio'
import { startWaitingForUser, cancelWaiting } from '../lib/conversation/turnEngine'
import { ensureFirstLineForDisplay } from '../lib/scene/firstLineValidator'

export default function ChatPanel({ scene }: { scene?: Scene }) {
  const [history, setHistory] = useState<ConversationMessage[]>([])
  const historyRef = useRef<ConversationMessage[]>([])
  const [input, setInput] = useState('')
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    historyRef.current = history
  }, [history])

  const canSend = useMemo(() => !!scene && input.trim().length > 0, [scene, input])

  const scrollToBottom = () => {
    const el = scrollerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  const handleSend = async () => {
    if (!scene) return
    const text = input.trim()
    if (!text) return
    setInput('')
    cancelWaiting()
    
    // Optimistic update
    const userMsg: ConversationMessage = { speaker: 'User', message: text, timestamp: new Date().toISOString() }
    const currentHist = [...historyRef.current, userMsg]
    setHistory(currentHist)
    setTimeout(scrollToBottom, 0)

    const res = await fetch('/api/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene, history: currentHist, text }),
    })
    if (!res.ok) {
      console.error('[ChatPanel] API Error:', res.status, res.statusText)
      return
    }
    const data = (await res.json()) as {
      history: ConversationMessage[]
      aiTurns: Array<{ speaker: 'A' | 'B'; message: string }>
      sceneEnded?: boolean
      closingTurn?: { speaker: 'A' | 'B'; message: string }
    }
    setHistory(data.history)
    if (scene) {
      for (const t of data.aiTurns) {
        try {
          await speakForCharacter(scene, t.speaker, t.message)
        } catch {}
      }
      if (data.sceneEnded && data.closingTurn) {
        try {
          await speakForCharacter(scene, data.closingTurn.speaker, data.closingTurn.message)
        } catch {}
      }
    }
    setTimeout(scrollToBottom, 0)
    if (data.aiTurns?.length) {
      startWaitingForUser({
        onPrompt: async () => {
          if (!scene) return
          const cue = '(system: user silent; encourage briefly)'
          // Use ref to get latest history
          const latestHist = historyRef.current
          const r = await fetch('/api/turn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scene, history: [...latestHist, { speaker: 'User', message: cue, timestamp: new Date().toISOString() }], text: cue }),
          })
          if (r.ok) {
            const d = (await r.json()) as { history: ConversationMessage[]; aiTurns: Array<{ speaker: 'A' | 'B'; message: string }> }
            setHistory(d.history)
            try {
              const last = d.aiTurns?.[d.aiTurns.length - 1]
              if (last) await speakForCharacter(scene, last.speaker, last.message)
            } catch {}
            setTimeout(scrollToBottom, 0)
          }
        },
        onContinue: async () => {
          if (!scene) return
          const cue = '(system: user still silent; continue briefly)'
          const latestHist = historyRef.current
          const r = await fetch('/api/turn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scene, history: [...latestHist, { speaker: 'User', message: cue, timestamp: new Date().toISOString() }], text: cue }),
          })
          if (r.ok) {
            const d = (await r.json()) as { history: ConversationMessage[]; aiTurns: Array<{ speaker: 'A' | 'B'; message: string }> }
            setHistory(d.history)
            try {
              const last = d.aiTurns?.[d.aiTurns.length - 1]
              if (last) await speakForCharacter(scene, last.speaker, last.message)
            } catch {}
            setTimeout(scrollToBottom, 0)
          }
        },
      })
    }
  }

  const handleMicText = (t: string) => {
    setInput((prev) => (prev ? prev + ' ' + t : t))
  }

  useEffect(() => {
    return () => {
      cancelWaiting()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function seedOpening() {
      if (!scene) return
      if (history.length > 0) return
      const line = await ensureFirstLineForDisplay(scene)
      if (cancelled) return
      const aName = scene.characters[0]?.name || 'A'
      const bName = scene.characters[1]?.name || 'B'
      const raw = (line || '').trim()
      let speaker = aName
      let text = raw
      const m = raw.match(/^([^:]{1,40}):\s*(.+)$/)
      if (m) {
        const name = m[1].trim()
        const content = m[2].trim()
        if (name.toLowerCase() === 'user') {
          speaker = aName
          text = content
        } else if (name === aName || name === bName) {
          speaker = name
          text = content
        } else {
          text = raw
        }
      }
      const now = new Date().toISOString()
      setHistory([{ speaker, message: text, timestamp: now }])
      // Also expose the normalized opening line for potential UI use
      if (scene) {
        ;(scene as any).openingLine = `${speaker}: ${text}`
      }
    }
    seedOpening()
    return () => {
      cancelled = true
    }
  }, [scene])

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="text-sm text-gray-400">Chat</div>
      <div
        ref={scrollerRef}
        className="mt-2 h-[50vh] lg:h-[70vh] overflow-y-auto rounded-md bg-gray-800 p-4 text-gray-300"
      >
        {history.length === 0 ? (
          <div className="text-gray-500">Conversation goes here</div>
        ) : (
          <ul className="space-y-2">
            {history
              .filter((m) => !(m.speaker === 'User' && /^\(system:/i.test(m.message)))
              .map((m, i) => (
              <li key={i}>
                <span className="text-indigo-300">{m.speaker}:</span> <span>{m.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Type a message"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
      <div className="mt-2">
        <MicrophoneButton onText={handleMicText} />
      </div>
    </div>
  )
}
