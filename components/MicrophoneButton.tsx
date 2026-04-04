'use client'
import { useRef, useState } from 'react'
import { createSTTRecorder, transcribeAudio, ensureMediaUnlocked } from '../lib/audio'

export default function MicrophoneButton({
  onText,
}: {
  onText?: (text: string) => void
}) {
  const recRef = useRef<ReturnType<typeof createSTTRecorder> | null>(null)
  const [recording, setRecording] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [lastSize, setLastSize] = useState<number | null>(null)

  const handleClick = async () => {
    if (!recording) {
      if (!recRef.current) recRef.current = createSTTRecorder(16000)
      try { await ensureMediaUnlocked() } catch {}
      await recRef.current.start()
      setRecording(true)
    } else {
      const blob = await recRef.current!.stop()
      setRecording(false)
      setLastSize(blob.size || 0)
      try {
        const text = await transcribeAudio(blob)
        onText?.(text)
      } catch (e) {
        // Surface minimal feedback in console to aid debugging on mobile
        console.error('[Microphone] STT failed:', e)
        setErr('Speech recognition failed. Check permissions or server settings.')
        setTimeout(() => setErr(null), 3000)
      }
    }
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleClick}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-800 bg-gray-900 px-4 py-3 text-sm font-medium text-gray-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        <span>🎤</span>
        <span>{recording ? 'Recording… click to stop' : 'Microphone'}</span>
      </button>
      {err && <div className="text-xs text-red-300">{err}</div>}
      {lastSize != null && (
        <div className="text-[11px] text-gray-400">
          Last audio size: {lastSize} bytes @ 16kHz mono
        </div>
      )}
    </div>
  )
}
