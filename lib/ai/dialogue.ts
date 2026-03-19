import type { Scene, ConversationMessage } from '../../types'
import { buildRoleplayPrompt } from './prompt'
import { callDeepSeek } from './deepseek'

function chooseSpeaker(scene: Scene, history: ConversationMessage[]): 'A' | 'B' {
  const aName = scene.characters[0]?.name
  const bName = scene.characters[1]?.name
  for (let i = history.length - 1; i >= 0; i--) {
    const s = history[i].speaker
    if (s === aName) return 'B'
    if (s === bName) return 'A'
  }
  return history.length % 2 === 0 ? 'A' : 'B'
}

function stripSpeakerPrefixes(text: string, aName: string, bName: string): string {
  const t = text.trim()
  const patterns = [
    new RegExp(`^${aName}\\s*:\\s*`, 'i'),
    new RegExp(`^${bName}\\s*:\\s*`, 'i'),
    /^Character A\s*:\s*/i,
    /^Character B\s*:\s*/i,
    /^[AB]\s*:\s*/,
  ]
  return patterns.reduce((acc, re) => acc.replace(re, ''), t).trim()
}

export async function generateAIResponse(
  scene: Scene,
  history: ConversationMessage[]
): Promise<{ speaker: 'A' | 'B'; message: string }> {
  const speaker = chooseSpeaker(scene, history)
  const basePrompt = buildRoleplayPrompt(scene, history)
  const nameForSpeaker = speaker === 'A' ? scene.characters[0].name : scene.characters[1].name
  const finalPrompt =
    `${basePrompt}\n\nRespond as ${nameForSpeaker} (Character ${speaker}). Do not include your name prefix. Keep it brief (1-2 sentences).`

  try {
    const raw = await callDeepSeek(finalPrompt, { temperature: 0.7, max_tokens: 64 })
    const clean = stripSpeakerPrefixes(raw, scene.characters[0].name, scene.characters[1].name)
    return { speaker, message: clean }
  } catch {
    const fallback =
      speaker === 'A'
        ? "Alright, let's sort this out quickly. What do you think?"
        : "I get your point. Could we try this instead?"
    return { speaker, message: fallback }
  }
}

export default generateAIResponse
