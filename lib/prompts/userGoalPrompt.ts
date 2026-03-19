export function buildUserGoalPrompt(input: {
  situation: string
  conversationFocus: string
  emotionalContext: string
  interactionTension: string
  alignment: string
  dynamic: string
  userRole: string
}): string {
  const { situation, conversationFocus, emotionalContext, interactionTension, alignment, dynamic, userRole } = input
  return [
    "You are defining the user's role in a realistic social interaction for a language learning application.",
    '',
    'The interaction already has a situation and conversational dynamics.',
    '',
    'Situation:',
    situation,
    '',
    'Conversation Focus:',
    conversationFocus,
    '',
    'Emotional Context:',
    emotionalContext,
    '',
    'Interaction Tension:',
    interactionTension,
    '',
    'Alignment:',
    alignment,
    '',
    'Dynamic:',
    dynamic,
    '',
    'User Role:',
    userRole,
    '',
    'Your task is to define a simple conversational objective for the user.',
    '',
    'The objective should:',
    '',
    '* encourage the user to participate',
    '* be achievable through natural conversation',
    '* fit the situation and tension',
    '* remain realistic',
    '',
    'Then define a natural ending condition for the interaction.',
    '',
    'Examples of ending conditions:',
    '',
    '* the decision is made',
    '* the activity begins',
    '* the topic is resolved',
    '* someone leaves',
    '* the conversation naturally winds down',
    '',
    'Return JSON only:',
    '',
    '{',
    ' "userGoal": "",',
    ' "endingCondition": ""',
    ' }',
  ].join('\n')
}
