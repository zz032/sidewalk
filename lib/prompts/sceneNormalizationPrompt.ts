export type InteractionSource =
  | 'situation_based'
  | 'event_based'
  | 'topic_based'
  | 'emotional_sharing'
  | 'activity_based'

export const INTERACTION_SOURCES: InteractionSource[] = [
  'situation_based',
  'event_based',
  'topic_based',
  'emotional_sharing',
  'activity_based',
]

export function buildSceneNormalizationPrompt(input: {
  environment: string
  characterA: string
  characterB: string
  relationship: string
  userRole: string
  interactionSource: InteractionSource
}): string {
  const { environment, characterA, characterB, relationship, userRole, interactionSource } = input
  return [
    'You are refining a rough social interaction setup for a language learning application.',
    '',
    'The program selects elements from a scenario asset library.',
    '',
    `Environment: ${environment}`,
    `Character A: ${characterA}`,
    `Character B: ${characterB}`,
    `Relationship: ${relationship}`,
    `User Role: ${userRole}`,
    `Interaction Source: ${interactionSource}`,
    '',
    'Your task is to refine this rough combination into a short, believable everyday interaction.',
    '',
    'Important rules:',
    '',
    '- Keep the original elements.',
    '- Do not invent a completely different scenario.',
    '- The interaction must feel like something that could happen in normal daily life.',
    '- The situation should naturally lead to conversation between the three participants.',
    '',
    'Interaction source types:',
    '',
    'situation_based — a shared environment naturally leads to conversation',
    'event_based — a minor everyday event triggers interaction',
    'topic_based — someone introduces a topic',
    'emotional_sharing — someone expresses a feeling or concern',
    'activity_based — the characters are engaged in a small shared activity',
    '',
    'Return only valid JSON:',
    '',
    '{',
    ' "situation": "",',
    ' "conversationFocus": "",',
    ' "emotionalContext": ""',
    ' }',
  ].join('\n')
}
