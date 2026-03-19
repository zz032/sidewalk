import type { Scene, ConversationMessage, Character } from '../../types'
import { buildDialoguePersonalityContext } from '../prompts/dialoguePersonalityContext'

function envCategory(env: string): 'transit' | 'retail' | 'food' | 'public_service' | 'health' | 'education' | 'work' | 'social' | 'generic' {
  const e = env.toLowerCase()
  if (/(station|platform|subway|bus|train|tram|terminal|airport)/.test(e)) return 'transit'
  if (/(shop|store|market|counter|salon|barber|tailor|cobbler|laundromat|cleaner)/.test(e)) return 'retail'
  if (/(cafe|coffee|restaurant|diner|bar|food)/.test(e)) return 'food'
  if (/(post office|embassy|city hall|info desk)/.test(e)) return 'public_service'
  if (/(clinic|hospital|pharmacy|doctor|nurse)/.test(e)) return 'health'
  if (/(class|school|workshop|library)/.test(e)) return 'education'
  if (/(office|coworking|bullpen)/.test(e)) return 'work'
  if (/(meetup|mixer|reception|event|conference)/.test(e)) return 'social'
  return 'generic'
}

function inferUserRole(environment: string): string {
  const cat = envCategory(environment)
  switch (cat) {
    case 'transit':
      return 'commuter'
    case 'retail':
      return 'customer'
    case 'food':
      return 'customer'
    case 'public_service':
      return 'visitor'
    case 'health':
      return 'patient'
    case 'education':
      return 'student'
    case 'work':
      return 'colleague'
    case 'social':
      return 'attendee'
    default:
      return 'visitor'
  }
}

function describeCharacter(c: Character): string {
  return [
    `name: ${c.name}`,
    `relationship: ${c.relationship}`,
    `personality: ${c.personality}`,
    `emotion: ${c.emotion}`,
    `strategy: ${c.behaviorStrategy}`,
    `voice: ${c.voice}`,
  ].join(', ')
}

function formatHistory(history: ConversationMessage[]): string {
  return history
    .slice(-12)
    .map((m) => `- ${m.speaker}: ${m.message}`)
    .join('\n')
}

export function buildRoleplayPrompt(scene: Scene, history: ConversationMessage[]): string {
  const a = scene.characters[0]
  const b = scene.characters[1]
  const userRole = inferUserRole(scene.environment)
  const context = [
    `Scene: ${scene.environment}`,
    `Situation: ${scene.situation}`,
    `User goal: ${scene.userGoal}`,
    `User role: ${userRole}`,
    `User participation: The User is present in this scene and speaks as themselves (${userRole}). Always consider and address the User's latest message directly.`,
    `Trigger: ${typeof scene.triggerEvent === 'object' && (scene as any).triggerEvent?.type ? (scene as any).triggerEvent.type : 'event'}`,
    `Drama: ${scene.dramaLevel}`,
  ].join('\n')

  const roles = [
    `Character A: ${describeCharacter(a)}`,
    `Character B: ${describeCharacter(b)}`,
  ].join('\n')

  const tension = `Hidden tension: ${scene.hiddenTension}`

  const personalityBlock =
    scene.personalityTraits
      ? buildDialoguePersonalityContext(scene.personalityTraits.characterA, scene.personalityTraits.characterB)
      : ''

  const rules = [
    'Rules:',
    '1) Speak naturally (1–2 sentences).',
    '2) Vary endings; do NOT make every line a question.',
    `3) Address the User as a ${userRole} when appropriate, but you can also make brief statements or proposals.`,
    '4) Stay in character; be proactive when it helps.',
    '5) Do not explain grammar.',
    '6) If the User clearly addresses a specific character by name, only that character should reply; the other should hold unless there is a strong reason to chime in.',
    '7) Do not unilaterally end the conversation; only move to wrap‑up after a concrete next step is proposed and others agree.',
  ].join('\n')

  const conv = history.length ? `Conversation so far:\n${formatHistory(history)}` : 'Conversation so far:'

  const output = [
    context,
    roles,
    personalityBlock,
    tension,
    conv,
    rules,
    'Continue the conversation with a single concise turn.',
  ].join('\n\n')

  return output
}

export const createPrompt = buildRoleplayPrompt

export default buildRoleplayPrompt
