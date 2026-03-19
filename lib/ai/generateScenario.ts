import { callDeepSeek } from './deepseek'
import { INTERACTION_SOURCES, type InteractionSource } from '../prompts/sceneNormalizationPrompt'
import { buildScenarioEnginePrompt } from '../prompts/scenarioEnginePrompt'

export type ScenarioEngineInput = {
  environment: string
  characterA: string
  characterB: string
  relationship: string
  userRole: string
}

export type ScenarioEngineResult = {
  interactionSource: InteractionSource
  situation: string
  conversationFocus: string
  emotionalContext: string
  interactionTension: string
  alignment: string
  dynamic: string
  hiddenPerspective: string
  userGoal: string
  endingCondition: string
}

function pickSource(): InteractionSource {
  const i = Math.floor(Math.random() * INTERACTION_SOURCES.length)
  return INTERACTION_SOURCES[i]
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

function isValid(obj: any): boolean {
  const keys = [
    'situation',
    'conversationFocus',
    'emotionalContext',
    'interactionTension',
    'alignment',
    'dynamic',
    'hiddenPerspective',
    'userGoal',
    'endingCondition',
  ]
  return obj && keys.every((k) => typeof obj[k] === 'string')
}

export async function generateScenario(input: ScenarioEngineInput): Promise<ScenarioEngineResult> {
  const interactionSource = pickSource()
  const prompt = buildScenarioEnginePrompt({ ...input, interactionSource })
  try {
    const res = await callDeepSeek(prompt, { temperature: 0.4, max_tokens: 384 })
    const j = extractJson(res)
    if (isValid(j)) {
      return { interactionSource, ...j } as ScenarioEngineResult
    }
  } catch {}
  return {
    interactionSource,
    situation: `At ${input.environment}, a brief ${interactionSource.replace('_', ' ')} cue starts a casual exchange.`,
    conversationFocus: 'quick practical talk',
    emotionalContext: 'neutral',
    interactionTension: 'low',
    alignment: 'cooperative',
    dynamic: 'brief turn-taking',
    hiddenPerspective: '',
    userGoal: 'Join briefly and keep it natural',
    endingCondition: 'The small task or topic is resolved',
  }
}

export default generateScenario
