import type { PersonalityTraits } from '../../types'

function render(name: string, t: PersonalityTraits): string {
  return [
    `${name} personality:`,
    `talkativeness: ${t.talkativeness}`,
    `directness: ${t.directness}`,
    `emotionality: ${t.emotionality}`,
    `initiative: ${t.initiative}`,
  ].join('\n')
}

export function buildDialoguePersonalityContext(a: PersonalityTraits, b: PersonalityTraits): string {
  return [render('Character A', a), '', render('Character B', b)].join('\n')
}

export default buildDialoguePersonalityContext
