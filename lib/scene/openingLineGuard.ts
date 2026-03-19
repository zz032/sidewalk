const bannedStarts = [
  'hey, quick question',
  'quick question',
  'i have a question',
  'can i ask you something',
]

const bannedPhrases = [
  'what do you think',
  'can i ask',
  'i was wondering',
]

export function isOpeningLineValid(line: string): boolean {
  const text = (line || '').toLowerCase().trim()
  for (const start of bannedStarts) {
    if (text.startsWith(start)) return false
  }
  for (const phrase of bannedPhrases) {
    if (text.includes(phrase)) return false
  }
  return true
}

