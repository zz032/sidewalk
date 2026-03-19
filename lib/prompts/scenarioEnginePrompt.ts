import type { InteractionSource } from './sceneNormalizationPrompt'

export function buildScenarioEnginePrompt(input: {
  environment: string
  characterA: string
  characterB: string
  relationship: string
  userRole: string
  interactionSource: InteractionSource
}): string {
  const { environment, characterA, characterB, relationship, userRole, interactionSource } = input
  return [
    'You are generating a realistic social interaction scenario for a language learning application.',
    '',
    'The program selected elements from a scenario asset library.',
    '',
    `Environment: ${environment}`,
    `Character A: ${characterA}`,
    `Character B: ${characterB}`,
    `Relationship: ${relationship}`,
    `User Role: ${userRole}`,
    `Interaction Source: ${interactionSource}`,
    '',
    'Your task is to refine this setup into a believable everyday interaction.',
    '',
    'Rules:',
    '',
    '* Keep the original elements',
    '* Do not invent a completely different situation',
    '* The interaction must feel realistic and casual',
    '* It should naturally encourage conversation',
    '',
    'Interaction source types:',
    '',
    'situation_based',
    'event_based',
    'topic_based',
    'emotional_sharing',
    'activity_based',
    '',
    'Return JSON only:',
    '',
    '{',
    ' "situation": "",',
    ' "conversationFocus": "",',
    ' "emotionalContext": "",',
    ' "interactionTension": "",',
    ' "alignment": "",',
    ' "dynamic": "",',
    ' "hiddenPerspective": "",',
    ' "userGoal": "",',
    ' "endingCondition": ""',
    ' }',
    '',
    'Important:',
    '',
    'All dialogue and descriptions must reference objects or actions that exist in the environment.',
    'If any line includes unrelated objects, rewrite it to fit.',
    '',
    'Examples:',
    'Pharmacy → prescriptions, medicine, counter, pickup, pharmacist',
    'Dentist clinic → appointment, teeth, checkup, waiting room',
    'Airport → boarding, luggage, gate, security',
  ].join('\n')
}

export default buildScenarioEnginePrompt
