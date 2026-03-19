import type { PersonalityLevel, PersonalityTraits } from '../../types'

const LEVELS: PersonalityLevel[] = ['low', 'medium', 'high']

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function genTraits(): PersonalityTraits {
  return {
    talkativeness: pick(LEVELS),
    directness: pick(LEVELS),
    emotionality: pick(LEVELS),
    initiative: pick(LEVELS),
  }
}

export function generatePersonalityPair(): {
  characterA: PersonalityTraits
  characterB: PersonalityTraits
} {
  return {
    characterA: genTraits(),
    characterB: genTraits(),
  }
}

export default generatePersonalityPair
