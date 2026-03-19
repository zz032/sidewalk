import type { Scene } from '../../types'

export function formatSceneOverview(scene: Scene, userRole: string): string {
  const aName = scene.characters[0]?.name
  const bName = scene.characters[1]?.name
  const rel = scene.characters[0]?.relationship || scene.characters[1]?.relationship || ''
  const focus = scene.conversationFocus || 'a brief exchange'
  const emo = scene.emotionalContext || ''
  const tension = typeof scene.interactionTension === 'string' ? scene.interactionTension : scene.dramaLevel?.toString?.() || ''
  const dyn = scene.dynamic || 'brief turn-taking'
  const spark = scene.initiativeAction || scene.interactionSource || ''
  const parts = [
    `At ${scene.environment}, ${aName} and ${bName}${rel ? ` (${rel})` : ''} begin interacting.`,
    scene.situation ? `Situation: ${scene.situation}.` : '',
    `Focus: ${focus}.`,
    spark ? `It starts from "${spark}".` : '',
    emo ? `Emotion: ${emo}.` : '',
    tension ? `Tension: ${tension}.` : '',
    dyn ? `Dynamic: ${dyn}.` : '',
    `You join as a ${userRole}.`,
  ].filter(Boolean)
  return parts.join(' ')
}

export function formatSectioned(scene: Scene): Array<{ label: string; text: string }> {
  return [
    { label: 'Environment', text: scene.environment },
    { label: 'Situation', text: scene.situation },
    { label: 'Conversation focus', text: scene.conversationFocus || '' },
    { label: 'User goal', text: scene.userGoal || '' },
    { label: 'Ending condition', text: scene.endingCondition || '' },
  ]
}

export default formatSceneOverview
