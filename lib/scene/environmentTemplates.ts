import { callDeepSeek } from '../ai/deepseek'

export const environmentTemplates: Record<string, string[]> = {
  book_club: [
    'people are gathering before the discussion begins',
    'members are discussing the current book',
    'someone is recommending a book',
    'a new visitor joins the group',
  ],
  pharmacy: [
    'customers are waiting at the counter',
    'someone is asking about a prescription',
    'people are waiting in line',
    'a pharmacist is helping a customer',
  ],
  dentist_clinic: [
    'patients are waiting in the waiting room',
    'someone just finished an appointment',
    'a patient is checking in at the front desk',
  ],
  cafe: [
    'people are ordering drinks',
    'customers are waiting for coffee',
    'someone is looking for a seat',
  ],
}

function envKey(env: string): keyof typeof environmentTemplates | null {
  const e = (env || '').toLowerCase()
  if (/book club/.test(e)) return 'book_club'
  if (/(pharmacy|drugstore|chemist)/.test(e)) return 'pharmacy'
  if (/(dentist|dental|clinic)/.test(e)) return 'dentist_clinic'
  if (/(cafe|coffee)/.test(e)) return 'cafe'
  return null
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pickTemplateForEnvironment(environment: string): string | null {
  const key = envKey(environment)
  if (!key) return null
  const list = environmentTemplates[key]
  if (!list || list.length === 0) return null
  return pick(list)
}

export async function generateContextAndOpeningLine(params: {
  environment: string
  template: string
  characterA?: string
  characterB?: string
}): Promise<{ context: string; openingLine: string }> {
  const { environment, template, characterA, characterB } = params
  const prompt = [
    'Environment:',
    environment,
    '',
    'Template:',
    template,
    '',
    'Generate:',
    'context (1–2 sentences)',
    'openingLine (natural dialogue)',
    '',
    'Return JSON only:',
    '{ "context": "", "openingLine": "" }',
  ].join('\n')
  try {
    const txt = await callDeepSeek(prompt, { temperature: 0.4, max_tokens: 160 })
    const start = txt.indexOf('{')
    const end = txt.lastIndexOf('}')
    const raw = start >= 0 && end > start ? txt.slice(start, end + 1) : txt
    const j = JSON.parse(raw)
    if (typeof j?.context === 'string' && typeof j?.openingLine === 'string') {
      return { context: j.context, openingLine: j.openingLine }
    }
  } catch {}
  return { context: `You are at ${environment}. ${template}.`, openingLine: 'Hi—could I ask something here?' }
}

