import type { Scene } from '../../types'
import { callDeepSeek } from '../ai/deepseek'

export type SceneValidationResult = {
  valid: boolean
  issues: string[]
  fixed?: Scene
  inferredUserRole?: string
}

function buildPrompt(scene: Scene): string {
  const schema = {
    valid: 'boolean',
    issues: ['string'],
    fixed: {
      environment: 'string',
      characters: 'array',
      triggerEvent: 'string or object',
      situation: 'string',
      initiativeAction: 'string',
      hiddenTension: 'string',
      userGoal: 'string',
      firstLine: 'string',
      dramaLevel: 'string|number',
      closureCondition: 'string',
    },
    inferredUserRole: 'string',
  }
  return [
    'You validate and fix conversational scenes for consistency.',
    'Check that environment, characters, trigger event, user role, hidden tension, user goal, first line belong to one realistic context.',
    'If inconsistencies exist, fix them minimally while keeping the original intent.',
    'Infer a plausible user role from the environment.',
    'Ensure initiativeAction is realistic for the environment and event.',
    'Output JSON only with keys: valid, issues, fixed, inferredUserRole.',
    'Ensure fixed includes the same keys as the input Scene object.',
    JSON.stringify({ schema, scene }),
  ].join('\n')
}

export async function validateAndFixScene(scene: Scene): Promise<SceneValidationResult> {
  try {
    const text = await callDeepSeek(buildPrompt(scene), { temperature: 0.2, max_tokens: 512 })
    const obj = JSON.parse(text) as SceneValidationResult
    if (typeof obj?.valid === 'boolean' && Array.isArray(obj?.issues)) {
      return obj
    }
    return { valid: true, issues: [] }
  } catch {
    return { valid: true, issues: [] }
  }
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

function hasAllSceneKeys(obj: any): boolean {
  const keys = [
    'environment',
    'characters',
    'triggerEvent',
    'situation',
    'initiativeAction',
    'hiddenTension',
    'userGoal',
    'firstLine',
    'dramaLevel',
    'closureCondition',
  ]
  return keys.every((k) => Object.prototype.hasOwnProperty.call(obj, k))
}

export async function validateScene(scene: Scene): Promise<Scene> {
  const p =
    [
      'You are a scene realism validator.',
      '',
      'Your job is to check whether a social interaction scenario is logically coherent.',
      '',
      'The following components must belong to the same real-world situation:',
      '',
      'Environment',
      'Characters',
      'Trigger Event',
      'User Role',
      'Hidden Tension',
      'Initiative Action',
      'Conversation Goal',
      'First Line',
      '',
      'Rules:',
      '',
      '1 Characters must plausibly exist in that environment',
      '2 Events must naturally occur there',
      '3 User role must make sense in the situation',
      '4 Dialogue must match the context',
      '5 Hidden tension must be believable',
      '6 Initiative action must be realistic for the environment',
      '',
      'If the scene is inconsistent:',
      '',
      'Rewrite the necessary elements to make the scenario realistic.',
      'You may rewrite characters, trigger event, user role, and initiativeAction if needed.',
      '',
      'Do NOT change the structure.',
      'Only correct the logic.',
      '',
      'Return a corrected JSON scene.',
      '',
      'Scene:',
      JSON.stringify(scene),
    ].join('\n')
  try {
    const txt = await callDeepSeek(p, { temperature: 0.2, max_tokens: 512 })
    const j = extractJson(txt)
    if (j && hasAllSceneKeys(j)) {
      return j as Scene
    }
    return scene
  } catch {
    return scene
  }
}

export default validateAndFixScene
