import { callDeepSeek } from './deepseek'
import { buildUserGoalPrompt } from '../prompts/userGoalPrompt'

export type UserGoalInput = {
  situation: string
  conversationFocus: string
  emotionalContext: string
  interactionTension: string
  alignment: string
  dynamic: string
  userRole: string
}

export type UserGoalResult = {
  userGoal: string
  endingCondition: string
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

function isValid(obj: any): obj is UserGoalResult {
  return obj && typeof obj.userGoal === 'string' && typeof obj.endingCondition === 'string'
}

export async function generateUserGoal(input: UserGoalInput): Promise<UserGoalResult> {
  const prompt = buildUserGoalPrompt(input)
  try {
    const txt = await callDeepSeek(prompt, { temperature: 0.3, max_tokens: 256 })
    const j = extractJson(txt)
    if (isValid(j)) return j
  } catch {}
  return {
    userGoal: 'Join briefly and keep the conversation moving naturally.',
    endingCondition: 'The topic is resolved and participants move on.',
  }
}

export default generateUserGoal
