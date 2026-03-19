export interface Character {
  name: string
  relationship: string
  personality: string
  emotion: string
  behaviorStrategy: string
  voice: string
}

export type PersonalityLevel = 'low' | 'medium' | 'high'

export interface PersonalityTraits {
  talkativeness: PersonalityLevel
  directness: PersonalityLevel
  emotionality: PersonalityLevel
  initiative: PersonalityLevel
}

export interface ConversationMessage {
  speaker: string
  message: string
  timestamp: string
}

export type TriggerEvent = string | Record<string, unknown>

export type DialogueResponse = Record<string, unknown>

export interface Scene {
  environment: string
  characters: Character[]
  triggerEvent: TriggerEvent
  situation: string
  context?: string
  yourRole?: string
  initiativeAction: string
  interactionSource?: string
  conversationFocus?: string
  emotionalContext?: string
  interactionTension?: string
  alignment?: string
  dynamic?: string
  hiddenPerspective?: string
  personalityTraits?: {
    characterA: PersonalityTraits
    characterB: PersonalityTraits
  }
  interactionStyle?: string
  scenePace?: string
  conversationMemory?: {
    userStatements: string[]
    userPreferences: string[]
    keyFacts: string[]
  }
  hiddenTension: string
  userGoal: string
  openingLine?: string
  endingCondition?: string
  firstLine: string
  dramaLevel: number | string
  closureCondition: string
}
