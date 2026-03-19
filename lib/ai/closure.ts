import type { Scene, ConversationMessage } from '../../types'

function now(): string {
  return new Date().toISOString()
}

function normalize(s: string): string {
  return s.toLowerCase()
}

function findProposalIndex(history: ConversationMessage[]): number {
  const proposalPatterns = [
    /\blet'?s\b/i,
    /\bwe should\b/i,
    /\bwe'?ll\b/i,
    /\bi will\b/i,
    /\bhow about we\b/i,
    /\bgo (talk|speak) to\b/i,
    /\bhead (over|to)\b/i,
    /\bfile (a )?claim\b/i,
    /\bask (the )?staff\b/i,
  ]
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i]
    if (proposalPatterns.some((re) => re.test(m.message))) return i
  }
  return -1
}

function speakerKind(scene: Scene, name: string): 'A' | 'B' | 'User' {
  const aName = scene.characters[0]?.name
  const bName = scene.characters[1]?.name
  if (name === aName) return 'A'
  if (name === bName) return 'B'
  return 'User'
}

function consensusAfter(scene: Scene, history: ConversationMessage[], startIdx: number): {
  ok: boolean
  closer: 'A' | 'B' | 'User'
} {
  if (startIdx < 0) return { ok: false, closer: 'User' }
  const affirmPatterns = [
    /\bok(ay)?\b/i,
    /\byes\b/i,
    /\bsure\b/i,
    /\bsounds good\b/i,
    /\bagree(d)?\b/i,
    /\blet'?s do it\b/i,
    /\bworks\b/i,
    /\bfine\b/i,
    /\balright\b/i,
    /\bdeal\b/i,
  ]
  const proposer = speakerKind(scene, history[startIdx].speaker)
  const others = new Set<'A' | 'B' | 'User'>(['A', 'B', 'User'])
  others.delete(proposer)
  const seen = new Set<'A' | 'B' | 'User'>()
  for (let i = startIdx + 1; i < history.length; i++) {
    const m = history[i]
    const k = speakerKind(scene, m.speaker)
    if (others.has(k) && affirmPatterns.some((re) => re.test(m.message))) {
      seen.add(k)
    }
  }
  if (seen.size >= 2) {
    // Let the proposer produce the closing line
    return { ok: true, closer: proposer === 'User' ? 'A' : proposer }
  }
  return { ok: false, closer: 'User' }
}

function buildClosureLine(scene: Scene): string {
  const c = normalize(String(scene.closureCondition || ''))
  if (c.includes('class')) return 'Alright, let’s do that now.'
  if (c.includes('bus') || c.includes('train') || c.includes('boarding')) return 'Alright, let’s do that before we go.'
  if (c.includes('meeting') || c.includes('work')) return 'Alright, let’s do that and then head back.'
  if (c.includes('table') || c.includes('reservation')) return 'Alright, let’s do that and head over.'
  if (c.includes('security')) return 'Alright, let’s do that before the check.'
  if (c.includes('closing')) return 'Alright, let’s do that before they close.'
  return 'Alright, let’s do that.'
}

export function shouldEndScene(scene: Scene, history: ConversationMessage[]): boolean {
  const idx = findProposalIndex(history)
  const c = consensusAfter(scene, history, idx)
  return c.ok
}

export function checkConversationClosure(
  scene: Scene,
  history: ConversationMessage[]
): {
  sceneEnded: boolean
  history?: ConversationMessage[]
  closingTurn?: { speaker: 'A' | 'B'; message: string }
} {
  const idx = findProposalIndex(history)
  const c = consensusAfter(scene, history, idx)
  if (!c.ok) {
    return { sceneEnded: false }
  }
  const name = c.closer === 'A' ? scene.characters[0].name : c.closer === 'B' ? scene.characters[1].name : 'User'
  const message = buildClosureLine(scene)
  const updated = history.slice()
  updated.push({ speaker: name, message, timestamp: now() })
  return { sceneEnded: true, history: updated, closingTurn: { speaker: c.closer === 'User' ? 'A' : c.closer, message } }
}

export const checkClosure = checkConversationClosure

export default checkConversationClosure
