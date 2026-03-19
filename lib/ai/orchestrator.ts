import type { Scene, ConversationMessage } from '../../types'
import { callDeepSeek } from './deepseek'
import { buildShortContextPrompt } from '../prompts/dialogueContextBuilder'
import { createMemory, storeUserMessage } from '../conversation/memoryEngine'
import { computeScenarioId, buildCacheKey, getCachedResponse, setCachedResponse } from '../conversation/responseCache'
import { decideNextTurn } from '../conversation/turnEngine'

function now(): string {
  return new Date().toISOString()
}

function stripPrefixes(text: string, aName: string, bName: string): string {
  const patterns = [
    new RegExp(`^${aName}\\s*:\\s*`, 'i'),
    new RegExp(`^${bName}\\s*:\\s*`, 'i'),
    /^Character A\s*:\s*/i,
    /^Character B\s*:\s*/i,
    /^[AB]\s*:\s*/,
  ]
  return patterns.reduce((acc, re) => acc.replace(re, ''), text.trim()).trim()
}

function extractJson(text: string): any {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1))
    } catch {
      return null
    }
  }
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function orchestrateTurn(
  scene: Scene,
  history: ConversationMessage[],
  userText: string
): Promise<{
  history: ConversationMessage[]
  aiTurns: Array<{ speaker: 'A' | 'B'; message: string }>
}> {
  const aName = scene.characters[0]?.name ?? 'A'
  const bName = scene.characters[1]?.name ?? 'B'

  // Frontend already optimistically updates history, so we don't need to push userText again if it's already there.
  // However, to be safe and stateless, we trust 'history' passed in.
  // BUT: The current implementation of ChatPanel sends history INCLUDING the new user message.
  // So if we push it again here, we get duplicates.
  
  // FIX: Check if the last message in history is already the userText.
  const updated: ConversationMessage[] = history.slice()
  const lastMsg = updated.length > 0 ? updated[updated.length - 1] : null
  if (!lastMsg || lastMsg.message !== userText || lastMsg.speaker !== 'User') {
     updated.push({ speaker: 'User', message: userText, timestamp: now() })
  }

  const aiTurns: Array<{ speaker: 'A' | 'B'; message: string }> = []

  // Memory: store user message locally (short summaries and preferences)
  const memory = createMemory()
  const memAfter = storeUserMessage(memory, userText)

  // Response Cache
  const scenarioId = computeScenarioId({ environment: scene.environment, a: aName, b: bName, situation: scene.situation })
  // Add history hash to cache key to prevent repetitive responses in different contexts
  const lastAiMsg = updated.slice().reverse().find(m => m.speaker !== 'User')?.message || ''
  const historyHash = Buffer.from(lastAiMsg).toString('base64').slice(0, 20)
  const cacheKey = buildCacheKey(scenarioId, userText + '|' + historyHash, scene.conversationFocus)

  const cached = getCachedResponse(cacheKey)
  if (cached) {
    try {
      const j = JSON.parse(cached) as { speaker: 'characterA' | 'characterB'; target: 'user' | 'characterA' | 'characterB'; text: string }
      const who: 'A' | 'B' = j.speaker === 'characterA' ? 'A' : 'B'
      aiTurns.push({ speaker: who, message: j.text })
      updated.push({ speaker: who === 'A' ? aName : bName, message: j.text, timestamp: now() })
      return { history: updated, aiTurns }
    } catch {
      // ignore cache parse error
    }
  }

  // Turn engine decide speaker/target/length
  const decision = decideNextTurn({ ...scene, conversationMemory: memAfter }, updated, userText)
  if (decision.speaker === 'user') {
    // Wait for user; no AI turn generated
    return { history: updated, aiTurns }
  }
  const enforcedSpeaker: 'characterA' | 'characterB' = decision.speaker
  const enforcedTarget: 'user' | 'characterA' | 'characterB' = decision.target

  const prompt = buildShortContextPrompt({
    scene: { ...scene, conversationMemory: memAfter },
    history: updated,
    userMessage: userText,
    responseLength: decision.responseLength,
    enforcedSpeaker,
    enforcedTarget,
  })
  const raw = await callDeepSeek(prompt, { temperature: 0.7, max_tokens: 96 })
  const j = extractJson(raw) as { speaker?: string; target?: string; text?: string } | null
  const text = (j && typeof j.text === 'string') ? j.text : (raw || '').trim()
  const whoLabel = j?.speaker === 'characterA' ? 'A' : j?.speaker === 'characterB' ? 'B' : (enforcedSpeaker === 'characterA' ? 'A' : 'B')
  aiTurns.push({ speaker: whoLabel as 'A' | 'B', message: text })
  updated.push({ speaker: whoLabel === 'A' ? aName : bName, message: text, timestamp: now() })
  // Cache response
  try {
    const store = j && j.text ? JSON.stringify(j) : JSON.stringify({ speaker: enforcedSpeaker, target: enforcedTarget, text })
    setCachedResponse(cacheKey, store)
  } catch {}

  return { history: updated, aiTurns }
}

export const orchestrateConversation = orchestrateTurn

export default orchestrateTurn
