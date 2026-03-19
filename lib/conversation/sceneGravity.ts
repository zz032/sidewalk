import type { Scene, ConversationMessage } from '../../types'

const STOPWORDS = new Set([
  'the','a','an','and','or','but','if','then','else','of','in','on','at','to','for','with','about','as','is','are','be','being','been','this','that','it','its','by','from','into','out','up','down','over','under','very','so','just','really','you','your','yours','we','our','ours','they','their','theirs','i','me','my','mine'
])

function tokenize(s: string): string[] {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && w.length > 2 && !STOPWORDS.has(w))
}

function isRelated(text: string, focus: string): boolean {
  if (!focus) return true
  const f = new Set(tokenize(focus))
  if (f.size === 0) return true
  const t = tokenize(text)
  let hits = 0
  for (const w of t) {
    if (f.has(w)) hits++
  }
  const ratio = hits / Math.max(1, t.length)
  return hits >= 1 || ratio >= 0.2
}

export function computeDriftScore(scene: Scene, history: ConversationMessage[]): number {
  const focus = scene.conversationFocus || ''
  if (!focus) return 0
  // Look back up to 6 recent turns, count consecutive unrelated from the end
  const recent = history.slice(-6)
  let score = 0
  for (let i = recent.length - 1; i >= 0; i--) {
    const m = recent[i]
    if (isRelated(m.message, focus)) {
      break
    } else {
      score++
      if (score >= 3) break
    }
  }
  return Math.min(3, score)
}

export function driftLevel(score: number): 'fully' | 'mild' | 'moderate' | 'strong' {
  if (score <= 0) return 'fully'
  if (score === 1) return 'mild'
  if (score === 2) return 'moderate'
  return 'strong'
}

export function gravityGuideline(score: number): string {
  if (score <= 0) return 'Stay natural; no need to redirect.'
  if (score === 1) return 'Allow normal conversation; no forced redirection.'
  if (score === 2) return 'Optionally reference the scenario focus when it fits naturally (e.g., "That reminds me…").'
  return 'Gently reconnect to the scenario focus without rejecting the user’s topic (e.g., "By the way, we were trying to…").'
}

