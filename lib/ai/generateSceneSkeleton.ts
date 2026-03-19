import { callDeepSeek } from './deepseek'
import { INTERACTION_SOURCES, buildSceneNormalizationPrompt, type InteractionSource } from '../prompts/sceneNormalizationPrompt'

export type SceneSkeletonInput = {
  environment: string
  characterA: string
  characterB: string
  relationship: string
  userRole: string
}

export type SceneSkeleton = {
  situation: string
  conversationFocus: string
  emotionalContext: string
  interactionSource: InteractionSource
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

function isValidSkeleton(obj: any): obj is SceneSkeleton {
  return obj && typeof obj.situation === 'string' && typeof obj.conversationFocus === 'string' && typeof obj.emotionalContext === 'string'
}

export async function generateSceneSkeleton(input: SceneSkeletonInput): Promise<SceneSkeleton> {
  const interactionSource = pickSource()
  const prompt = buildSceneNormalizationPrompt({ ...input, interactionSource })
  try {
    const res = await callDeepSeek(prompt, { temperature: 0.4, max_tokens: 256 })
    const j = extractJson(res)
    if (isValidSkeleton(j)) return { ...j, interactionSource }
  } catch {}
  const fallback: SceneSkeleton = {
    situation: `At ${input.environment}, ${input.characterA} and ${input.characterB} (${input.relationship}) begin interacting with a ${interactionSource.replace('_', ' ')} cue while the ${input.userRole} joins in.`,
    conversationFocus: 'brief check-in to start the interaction naturally',
    emotionalContext: 'neutral',
    interactionSource,
  }
  return fallback
}

export default generateSceneSkeleton
