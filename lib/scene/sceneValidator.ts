import type { Scene } from '../../types'
import { callDeepSeek } from '../ai/deepseek'
import { lineHasVocabulary, avoidAdminPhrases } from './environmentVocabulary'

type ValidationResult = {
  valid: boolean
  invalidKeywords: string[]
  reasons: string[]
}

const RULES: Record<string, string[]> = {
  dentist: ['baggage', 'luggage', 'airport', 'security', 'boarding', 'gate', 'check-in', 'baggage check'],
  restaurant: ['surgery', 'dental', 'scalpel', 'anesthesia', 'drill', 'operating room'],
  airport: ['homework', 'classroom', 'teacher', 'assignment', 'submission'],
}

function envCategory(env: string): 'dentist' | 'restaurant' | 'airport' | 'generic' {
  const e = env.toLowerCase()
  if (/(dentist|dental|clinic)/.test(e)) return 'dentist'
  if (/(restaurant|cafe|coffee|diner|bar)/.test(e)) return 'restaurant'
  if (/(airport|terminal|gate|boarding)/.test(e)) return 'airport'
  return 'generic'
}

function findInvalid(text: string, env: string): string[] {
  const cat = envCategory(env)
  const ban = RULES[cat] || []
  const hits: string[] = []
  const lower = (text || '').toLowerCase()
  for (const k of ban) {
    const re = new RegExp(`\\b${k.replace(/\s+/g, '\\s+')}\\b`, 'i')
    if (re.test(lower)) hits.push(k)
  }
  return hits
}

export function validateScenario(scene: Pick<Scene, 'environment' | 'characters' | 'conversationFocus' | 'situation'>): ValidationResult {
  const invalid: string[] = []
  const reasons: string[] = []
  const env = scene.environment || ''
  const focus = scene.conversationFocus || ''
  const sit = scene.situation || ''
  const in1 = findInvalid(focus, env)
  const in2 = findInvalid(sit, env)
  invalid.push(...in1, ...in2)
  if (invalid.length) {
    reasons.push(`Environment "${env}" conflicts with: ${Array.from(new Set(invalid)).join(', ')}`)
  }
  const valid = invalid.length === 0
  if (!valid) {
    // Debug log
    // eslint-disable-next-line no-console
    console.warn('SCENE VALIDATION WARNING', {
      environment: env,
      invalidKeyword: Array.from(new Set(invalid))[0],
    })
  }
  return { valid, invalidKeywords: Array.from(new Set(invalid)), reasons }
}

export async function repairScenario(scene: Scene, invalidKeywords: string[]): Promise<Pick<Scene, 'situation' | 'firstLine'>> {
  const prompt = [
    'You are repairing a scenario to fit its environment.',
    '',
    `Environment: ${scene.environment}`,
    `Current situation: ${scene.situation}`,
    `Conversation focus: ${scene.conversationFocus || ''}`,
    '',
    `Invalid phrases: ${invalidKeywords.join(', ')}`,
    '',
    'Rules:',
    '* Keep the original elements (environment, characters, user role) the same.',
    '* Rewrite the situation and opening line to make sense in the environment.',
    '* Keep it short and natural.',
    '',
    'Return JSON only:',
    '{ "situation": "", "firstLine": "" }',
  ].join('\n')
  try {
    const txt = await callDeepSeek(prompt, { temperature: 0.3, max_tokens: 160 })
    const start = txt.indexOf('{')
    const end = txt.lastIndexOf('}')
    const raw = start >= 0 && end > start ? txt.slice(start, end + 1) : txt
    const j = JSON.parse(raw)
    if (typeof j?.situation === 'string' && typeof j?.firstLine === 'string') {
      return { situation: j.situation, firstLine: j.firstLine }
    }
  } catch {}
  // Fallback: minimal edit
  return {
    situation: scene.situation.replace(/baggage|luggage|airport|security|boarding/gi, 'check-in'),
    firstLine: 'Hi, are you checked in yet?',
  }
}

export async function ensureOpeningLine(scene: Scene): Promise<string> {
  const hits = findInvalid(scene.firstLine || '', scene.environment || '')
  const okVocab = lineHasVocabulary(scene.firstLine || '', scene.environment || '')
  const okAdmin = avoidAdminPhrases(scene.firstLine || '')
  if (hits.length === 0 && okVocab && okAdmin) return scene.firstLine
  const prompt = [
    'Generate a realistic opening sentence for this environment.',
    `Environment: ${scene.environment}`,
    `Conversation focus: ${scene.conversationFocus || ''}`,
    'The line must reference a realistic object or action from this environment.',
    'Avoid generic administrative phrases like "ID check requested" or "verification requested".',
    'Return JSON only:',
    '{ "firstLine": "" }',
  ].join('\n')
  try {
    const txt = await callDeepSeek(prompt, { temperature: 0.4, max_tokens: 64 })
    const start = txt.indexOf('{')
    const end = txt.lastIndexOf('}')
    const raw = start >= 0 && end > start ? txt.slice(start, end + 1) : txt
    const j = JSON.parse(raw)
    if (typeof j?.firstLine === 'string') return j.firstLine
  } catch {}
  return 'Hi, is this the counter for pickup?'
}

// ---- Scenario Logic Validator (domain-level) ----

type Domain = {
  allowedFocus: string[]
  keywords: string[]
}

const DOMAINS: Record<string, Domain> = {
  book_club: {
    allowedFocus: ['small talk', 'discussion', 'opinion sharing', 'recommendation'],
    keywords: ['book', 'read', 'author', 'story', 'novel', 'chapter'],
  },
  pharmacy: {
    allowedFocus: ['quick practical talk', 'asking for help', 'short clarification'],
    keywords: ['medicine', 'prescription', 'pharmacist', 'counter', 'pickup', 'refill', 'receipt'],
  },
  dentist_clinic: {
    allowedFocus: ['appointment', 'quick practical talk', 'waiting room conversation'],
    keywords: ['dentist', 'tooth', 'teeth', 'checkup', 'appointment', 'waiting room', 'x-ray', 'cleaning'],
  },
  airport: {
    allowedFocus: ['quick practical talk', 'asking for help', 'short clarification', 'coordination'],
    keywords: ['boarding', 'gate', 'luggage', 'passport', 'security', 'check-in', 'terminal'],
  },
}

function envDomainKey(env: string): keyof typeof DOMAINS | null {
  const e = (env || '').toLowerCase()
  if (/book club/.test(e)) return 'book_club'
  if (/(pharmacy|drugstore|chemist)/.test(e)) return 'pharmacy'
  if (/(dentist|dental|clinic)/.test(e)) return 'dentist_clinic'
  if (/(airport|terminal|gate|boarding|security)/.test(e)) return 'airport'
  return null
}

export function validateSceneDomain(scene: Pick<Scene, 'environment' | 'situation' | 'conversationFocus' | 'firstLine'>): {
  valid: boolean
  reasons: string[]
} {
  const reasons: string[] = []
  const key = envDomainKey(scene.environment)
  if (!key) {
    return { valid: true, reasons }
  }
  const d = DOMAINS[key]
  const focusOk = !!d.allowedFocus.find((f) => (scene.conversationFocus || '').toLowerCase().includes(f))
  if (!focusOk) reasons.push('conversationFocus not allowed for environment')
  const firstOk = d.keywords.some((k) => new RegExp(`\\b${k.replace(/\s+/g, '\\s+')}\\b`, 'i').test(scene.firstLine || ''))
  if (!firstOk) reasons.push('firstLine lacks environment vocabulary')
  const sitOk =
    (scene.situation || '').toLowerCase().includes((scene.environment || '').toLowerCase()) ||
    d.keywords.some((k) => new RegExp(`\\b${k.replace(/\s+/g, '\\s+')}\\b`, 'i').test(scene.situation || ''))
  if (!sitOk) reasons.push('situation does not reference environment context')
  return { valid: reasons.length === 0, reasons }
}

export async function regenerateCoherentScene(input: {
  environment: string
  characterA?: string
  characterB?: string
}): Promise<{ situation: string; conversationFocus: string; firstLine: string }> {
  const prompt = [
    'Generate a coherent scene.',
    `Environment: ${input.environment}`,
    'The situation, focus, and opening line must logically belong to this environment.',
    'Return JSON only with keys: situation, conversationFocus, firstLine.',
  ].join('\n')
  try {
    const txt = await callDeepSeek(prompt, { temperature: 0.35, max_tokens: 160 })
    const start = txt.indexOf('{')
    const end = txt.lastIndexOf('}')
    const raw = start >= 0 && end > start ? txt.slice(start, end + 1) : txt
    const j = JSON.parse(raw)
    if (typeof j?.situation === 'string' && typeof j?.conversationFocus === 'string' && typeof j?.firstLine === 'string') {
      return j
    }
  } catch {}
  return {
    situation: `You are at ${input.environment}. Two people are talking nearby.`,
    conversationFocus: 'quick practical talk',
    firstLine: 'Hi—could I ask about this here at the counter?',
  }
}

export async function validateAndFixSceneDomain(scene: Scene): Promise<Scene> {
  const res = validateSceneDomain({
    environment: scene.environment,
    situation: scene.situation,
    conversationFocus: scene.conversationFocus || '',
    firstLine: scene.firstLine || '',
  })
  if (res.valid) return scene
  // eslint-disable-next-line no-console
  console.warn('SCENE DOMAIN VALIDATION WARNING', { environment: scene.environment, reasons: res.reasons })
  const fixed = await regenerateCoherentScene({
    environment: scene.environment,
    characterA: scene.characters[0]?.name,
    characterB: scene.characters[1]?.name,
  })
  return {
    ...scene,
    situation: fixed.situation,
    conversationFocus: fixed.conversationFocus,
    firstLine: fixed.firstLine,
  }
}
