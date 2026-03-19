export type ConversationMemory = {
  userStatements: string[]
  userPreferences: string[]
  keyFacts: string[]
}

const MAX_ITEMS = 20

function cap<T>(arr: T[], max = MAX_ITEMS): T[] {
  return arr.slice(-max)
}

export function createMemory(): ConversationMemory {
  return { userStatements: [], userPreferences: [], keyFacts: [] }
}

export function storeUserMessage(mem: ConversationMemory, message: string): ConversationMemory {
  const m = message.trim()
  if (!m) return mem
  const next = { ...mem }
  next.userStatements = cap([...next.userStatements, summarizeStatement(m)])
  const pref = extractSimpleMemory(m)
  if (pref) next.userPreferences = cap([...next.userPreferences, pref])
  const fact = extractKeyFact(m)
  if (fact) next.keyFacts = cap([...next.keyFacts, fact])
  return next
}

export function summarizeStatement(message: string): string {
  const s = message.replace(/\s+/g, ' ').trim()
  return s.length > 120 ? s.slice(0, 117) + '...' : s
}

export function extractSimpleMemory(message: string): string | null {
  const m = message.toLowerCase()
  if (m.includes('prefer') || m.includes('like') || m.includes('i love')) {
    return m.replace(/^.*?(prefer|like|love)\s+/i, 'prefers ').replace(/[.?!]+$/, '').trim()
  }
  if (m.includes('i usually') || m.includes("i'm used to")) {
    return m.replace(/^.*?(i usually|i'm used to)\s+/i, 'usually ').replace(/[.?!]+$/, '').trim()
  }
  return null
}

export function extractKeyFact(message: string): string | null {
  const m = message.toLowerCase()
  if (m.includes('my name is')) {
    const name = message.split(/my name is/i)[1]?.split(/[.,!]/)[0]?.trim() || ''
    if (name) return `user name: ${name}`
  }
  if (m.includes('from ') && !m.includes('away from')) {
    const part = message.split(/from\s+/i)[1]?.split(/[.,!]/)[0]?.trim() || ''
    if (part) return `from ${part}`
  }
  return null
}

