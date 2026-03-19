export type InteractionSource = 'situation_based' | 'event_based' | 'topic_based' | 'emotional_sharing' | 'activity_based'

export type SceneInput = {
  environment: string
  characterA: string
  characterB: string
  relationship: string
  userRole: string
  interactionSource: InteractionSource
  specificSeed?: string
}

export type Scene = {
  environment: string
  context: string
  openingLine: string
  interactionSource: InteractionSource
  userGoal: string
  yourRole?: string
}

