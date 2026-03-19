export type EnvVocab = {
  name: string
  keywords: string[]
}

function envCategory(env: string): 'pharmacy' | 'dentist_clinic' | 'airport' | 'restaurant' | 'cafe' | 'generic' {
  const e = (env || '').toLowerCase()
  if (/(pharmacy|drugstore|chemist)/.test(e)) return 'pharmacy'
  if (/(dentist|dental|clinic)/.test(e)) return 'dentist_clinic'
  if (/(airport|terminal|gate|boarding|security)/.test(e)) return 'airport'
  if (/(restaurant|diner|eatery)/.test(e)) return 'restaurant'
  if (/(cafe|coffee)/.test(e)) return 'cafe'
  return 'generic'
}

const VOCABS: Record<string, EnvVocab> = {
  pharmacy: {
    name: 'pharmacy',
    keywords: ['prescription', 'medicine', 'pharmacist', 'counter', 'pickup', 'refill', 'receipt'],
  },
  dentist_clinic: {
    name: 'dentist_clinic',
    keywords: ['appointment', 'checkup', 'tooth', 'teeth', 'dentist', 'waiting room', 'cleaning', 'x-ray'],
  },
  airport: {
    name: 'airport',
    keywords: ['boarding', 'gate', 'luggage', 'security', 'passport', 'check-in', 'terminal'],
  },
  restaurant: {
    name: 'restaurant',
    keywords: ['table', 'menu', 'order', 'server', 'bill', 'reservation', 'kitchen'],
  },
  cafe: {
    name: 'cafe',
    keywords: ['coffee', 'barista', 'counter', 'latte', 'espresso', 'pastry'],
  },
  generic: { name: 'generic', keywords: [] },
}

export function getExpectedVocabulary(environment: string): string[] {
  const cat = envCategory(environment)
  return VOCABS[cat].keywords
}

export function lineHasVocabulary(line: string, environment: string): boolean {
  const kws = getExpectedVocabulary(environment)
  if (!kws.length) return true
  const lower = (line || '').toLowerCase()
  return kws.some((k) => {
    const re = new RegExp(`\\b${k.replace(/\s+/g, '\\s+')}\\b`, 'i')
    return re.test(lower)
  })
}

export function avoidAdminPhrases(line: string): boolean {
  const bad = ['id check requested', 'verification requested', 'identity verification', 'document verification']
  const lower = (line || '').toLowerCase()
  return !bad.some((b) => lower.includes(b))
}

