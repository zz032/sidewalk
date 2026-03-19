import type { Scene, ConversationMessage } from '../../types'
import { computeDriftScore, gravityGuideline } from '../conversation/sceneGravity'

function capList(items: string[] | undefined, n: number): string[] {
  return (items || []).slice(-n)
}

export function buildDialogueContext(scene: Scene): string {
  const scenarioLines = [
    `Scene: ${scene.environment}`,
    `Situation: ${scene.situation}`,
    scene.conversationFocus ? `Conversation focus: ${scene.conversationFocus}` : '',
    scene.emotionalContext ? `Emotional context: ${scene.emotionalContext}` : '',
    scene.interactionTension ? `Interaction tension: ${scene.interactionTension}` : '',
    scene.alignment ? `Alignment: ${scene.alignment}` : '',
    scene.dynamic ? `Dynamic: ${scene.dynamic}` : '',
    scene.hiddenPerspective ? `Hidden perspective: ${scene.hiddenPerspective}` : '',
    scene.userGoal ? `User goal: ${scene.userGoal}` : '',
    scene.endingCondition ? `Ending condition: ${scene.endingCondition}` : '',
  ].filter(Boolean)

  const personalities = scene.personalityTraits
    ? [
        `Character A Name: ${scene.characters[0]?.name || 'Character A'}`,
        'Character A personality:',
        `talkativeness: ${scene.personalityTraits.characterA.talkativeness}`,
        `directness: ${scene.personalityTraits.characterA.directness}`,
        `emotionality: ${scene.personalityTraits.characterA.emotionality}`,
        `initiative: ${scene.personalityTraits.characterA.initiative}`,
        '',
        `Character B Name: ${scene.characters[1]?.name || 'Character B'}`,
        'Character B personality:',
        `talkativeness: ${scene.personalityTraits.characterB.talkativeness}`,
        `directness: ${scene.personalityTraits.characterB.directness}`,
        `emotionality: ${scene.personalityTraits.characterB.emotionality}`,
        `initiative: ${scene.personalityTraits.characterB.initiative}`,
      ]
    : []

  const mem = scene.conversationMemory
    ? [
        'Conversation memory (short):',
        ...capList(scene.conversationMemory.userStatements, 2).map((s) => `- user: ${s}`),
        ...capList(scene.conversationMemory.userPreferences, 2).map((s) => `- preference: ${s}`),
        ...capList(scene.conversationMemory.keyFacts, 1).map((s) => `- fact: ${s}`),
      ]
    : []

  return [scenarioLines.join('\n'), personalities.join('\n'), mem.join('\n')].filter(Boolean).join('\n\n')
}

export default buildDialogueContext

export function buildShortContextPrompt(params: {
  scene: Scene
  history: ConversationMessage[]
  userMessage: string
  responseLength: 'short' | 'medium' | 'long'
  enforcedSpeaker?: 'characterA' | 'characterB'
  enforcedTarget?: 'user' | 'characterA' | 'characterB'
}): string {
  const { scene, history, userMessage, responseLength, enforcedSpeaker, enforcedTarget } = params
  const base = buildDialogueContext(scene)
  // Increase context window to 15 to prevent repetition
  const recent = history.slice(-15).map((m) => `- ${m.speaker}: ${m.message}`).join('\n')
  
  // Disable scene gravity to allow natural conversation flow
  const driftText = `Conversation focus: ${scene.conversationFocus || '(none)'}\n(Gravity disabled to allow natural topic evolution)`

  const lengthRule =
    responseLength === 'short'
      ? 'Respond in 1 concise sentence.'
      : responseLength === 'medium'
      ? 'Respond in 2 concise sentences.'
      : 'Respond in 3-4 concise sentences.'
  const who =
    enforcedSpeaker && enforcedTarget
      ? `Speaker must be ${enforcedSpeaker}, targeting ${enforcedTarget}.`
      : 'Choose an appropriate speaker and target.'
  const redirectRules = [
    'Conversation Flow Rules:',
    '1) Allow the topic to evolve naturally. Do NOT force the conversation back to the initial situation if it has been resolved or moved on.',
    '2) Characters should react to each other, not just the user.',
    '3) If the previous speaker asked a question, answer it.',
    '4) Do NOT repeat the same phrase or question from recent history.',
    '5) DYNAMIC SITUATION: Treat the initial "Situation" description as the starting point only. As the dialogue progresses, assume actions (like cleaning up, moving, eating) have happened. Do not act as if the initial event is still happening if the dialogue implies it is over.',
  ].join('\n')
  const format = [
    '{',
    ' "speaker": "characterA|characterB",',
    ' "target": "user|characterA|characterB",',
    ' "text": "…" ',
    '}',
  ].join('\n')
  return [
    'SCENARIO',
    base,
    '',
    'SCENE GRAVITY',
    driftText,
    '',
    'RECENT DIALOGUE',
    recent || '(none)',
    '',
    'USER MESSAGE',
    userMessage,
    '',
    'Rules:',
    who,
    lengthRule,
    redirectRules,
    'Return JSON only in this format:',
    format,
  ].join('\n')
}
