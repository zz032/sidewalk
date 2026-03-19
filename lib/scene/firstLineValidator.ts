import type { Scene } from '../../types'
import { callDeepSeek } from '../ai/deepseek'

const KEYWORDS: Record<string, string[]> = {
  book_club: ['book', 'reading', 'author', 'discussion', 'novel', 'chapter'],
  pharmacy: ['prescription', 'medicine', 'pharmacist', 'counter', 'pickup', 'refill', 'receipt'],
  dentist_clinic: ['appointment', 'dentist', 'tooth', 'teeth', 'checkup', 'waiting room', 'x-ray', 'cleaning'],
  airport: ['boarding', 'gate', 'luggage', 'passport', 'security', 'check-in', 'terminal'],
}

function envKey(env: string): keyof typeof KEYWORDS | 'generic' {
  const e = (env || '').toLowerCase()
  if (/book club/.test(e)) return 'book_club'
  if (/(pharmacy|drugstore|chemist)/.test(e)) return 'pharmacy'
  if (/(dentist|dental|clinic)/.test(e)) return 'dentist_clinic'
  if (/(airport|terminal|gate|boarding|security)/.test(e)) return 'airport'
  return 'generic'
}

export function isFirstLineValidForEnv(line: string, environment: string): boolean {
  const key = envKey(environment)
  if (key === 'generic') return true
  const kws = KEYWORDS[key] || []
  const lower = (line || '').toLowerCase()
  return kws.some((k) => {
    const re = new RegExp(`\\b${k.replace(/\s+/g, '\\s+')}\\b`, 'i')
    return re.test(lower)
  })
}

export async function ensureFirstLineForDisplay(scene: Scene): Promise<string> {
  const line = scene.firstLine || ''
  if (isFirstLineValidForEnv(line, scene.environment)) return line
  const a = scene.characters[0]?.name || 'Alex'
  const b = scene.characters[1]?.name || 'Jordan'
  const prompt = [
    'Generate a natural opening line for this environment.',
    `Environment: ${scene.environment}`,
    `Conversation focus: ${scene.conversationFocus || ''}`,
    `Characters: ${a}, ${b}`,
    'Return only the line of dialogue.',
  ].join('\n')
  try {
    const txt = await callDeepSeek(prompt, { temperature: 0.4, max_tokens: 64 })
    const clean = (txt || '').trim().replace(/^[\s"'`]+|[\s"'`]+$/g, '')
    return clean || line
  } catch {
    return line
  }
}

