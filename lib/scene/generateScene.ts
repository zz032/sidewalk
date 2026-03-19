import { callDeepSeek } from "../ai/deepseek"
import { SceneInput, Scene } from "./types"
import { buildScenePrompt } from "../prompts/scenePrompt"
import { isOpeningLineValid } from "./openingLineGuard"

function extractJson(text: string): any {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")

  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1))
    } catch {}
  }

  return null
}

export async function generateScene(input: SceneInput): Promise<Scene> {
  const prompt = buildScenePrompt(input)

  for (let i = 0; i < 3; i++) {
    try {
      const res = await callDeepSeek(prompt, {
        temperature: 0.7,
        max_tokens: 500,
      })

      const j = extractJson(res)

      if (j?.context && j?.openingLine) {
        if (isOpeningLineValid(j.openingLine)) {
          return {
            environment: input.environment,
            context: j.context,
            openingLine: j.openingLine,
            interactionSource: input.interactionSource,
            userGoal: j.userGoal || 'Engage naturally with the characters.',
            yourRole: j.userRole,
          }
        } else {
          console.warn(`[generateScene] Invalid opening line (attempt ${i + 1}):`, j.openingLine)
        }
      } else {
        console.warn(`[generateScene] Invalid JSON format (attempt ${i + 1}):`, res)
      }
    } catch (e) {
      console.error(`[generateScene] DeepSeek call failed (attempt ${i + 1}):`, e)
    }
  }

  // fallback based on interaction source
  const source = input.interactionSource
  let fallbackContext = `You are at ${input.environment}.`
  let fallbackLine = `${input.characterA}: Looks like it's getting busy here.`
  let fallbackGoal = 'Chat naturally.'

  if (source === 'event_based') {
    fallbackContext = `Something just happened at ${input.environment}.`
    fallbackLine = `${input.characterA}: Did you see that?`
    fallbackGoal = 'Ask what just happened.'
  } else if (source === 'topic_based') {
    fallbackContext = `People are discussing a trending topic at ${input.environment}.`
    fallbackLine = `${input.characterA}: I was just reading about this news.`
    fallbackGoal = 'Join the discussion with your opinion.'
  } else if (source === 'emotional_sharing') {
    fallbackContext = `${input.characterA} looks a bit concerned at ${input.environment}.`
    fallbackLine = `${input.characterA}: Honestly, I'm a bit worried about today.`
    fallbackGoal = `Comfort ${input.characterA}.`
  } else if (source === 'activity_based') {
    fallbackContext = `Everyone is busy doing something at ${input.environment}.`
    fallbackLine = `${input.characterA}: Could you give me a hand with this?`
    fallbackGoal = `Help ${input.characterA} with the task.`
  }

  console.warn('[generateScene] All attempts failed, using fallback:', { source, fallbackLine })

  return {
    environment: input.environment,
    context: fallbackContext,
    openingLine: fallbackLine,
    interactionSource: input.interactionSource,
    userGoal: fallbackGoal,
  }
}
