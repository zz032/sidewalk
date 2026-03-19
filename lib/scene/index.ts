import type { Scene } from '../../types'
import { generateScene as coreGenerateScene } from './generator'
import { generatePersonalityPair } from '../conversation/personalityGenerator'
import { generateScene as generateSimpleScene } from './generateScene'
import type { SceneInput, InteractionSource } from './types'

export * from './rules'
export { validateScene } from './validator'

function inferUserRole(environment: string): string {
  const e = environment.toLowerCase()
  if (/(station|platform|subway|bus|train|tram|terminal|airport)/.test(e)) return 'commuter'
  if (/(shop|store|market|counter|salon|barber|tailor|cobbler|laundromat|cleaner)/.test(e)) return 'customer'
  if (/(cafe|coffee|restaurant|diner|bar|food)/.test(e)) return 'customer'
  if (/(post office|embassy|city hall|info desk|courthouse)/.test(e)) return 'visitor'
  if (/(clinic|hospital|pharmacy|doctor|nurse)/.test(e)) return 'patient'
  if (/(class|school|workshop|library)/.test(e)) return 'student'
  if (/(office|coworking|bullpen)/.test(e)) return 'colleague'
  if (/(meetup|mixer|reception|event|conference)/.test(e)) return 'attendee'
  return 'visitor'
}

function pickInteractionSource(): InteractionSource {
  const r = Math.random()
  if (r < 0.3) return 'situation_based'
  if (r < 0.5) return 'topic_based'
  if (r < 0.7) return 'activity_based'
  if (r < 0.85) return 'emotional_sharing'
  return 'event_based'
}

function pickSpecificSeed(source: InteractionSource): string | undefined {
  const seeds: Record<InteractionSource, string[]> = {
    'situation_based': [
      'a lost item found on the floor',
      'a spilled drink causing a mess',
      'a crowded space with only one chair left',
      'a broken machine or device nearby',
      'a misunderstanding about a queue or line'
    ],
    'event_based': [
      'a sudden loud noise outside',
      'the lights flickering or going out',
      'someone tripping or dropping something',
      'a fire alarm or siren sounding',
      'an unexpected announcement over the speaker'
    ],
    'topic_based': [
      'debating a controversial local news story',
      'discussing a strange trend seen online',
      'planning a surprise for a mutual friend',
      'arguing about the best way to solve a puzzle',
      'reminiscing about a shared past event'
    ],
    'emotional_sharing': [
      'anxious about an upcoming interview',
      'excited about a first date tonight',
      'upset about a rude message received',
      'confused by a friend’s recent behavior',
      'relieved after finishing a big project'
    ],
    'activity_based': [
      'trying to assemble a complicated object',
      'searching for a lost contact lens',
      'playing a competitive card game',
      'trying to take a perfect group selfie',
      'figuring out a confusing map or schedule'
    ]
  }
  const options = seeds[source]
  if (!options) return undefined
  return options[Math.floor(Math.random() * options.length)]
}

export async function generateScene(dramaLevel: number): Promise<Scene> {
  // STEP0: Seed selection for names/environment/characters
  const seed = coreGenerateScene(dramaLevel)
  const a = seed.characters[0]?.name || 'Alex'
  const b = seed.characters[1]?.name || 'Jordan'
  const rel = seed.characters[0]?.relationship || 'friend'
  const userRole = inferUserRole(seed.environment)
  const source = pickInteractionSource()
  const specificSeed = pickSpecificSeed(source)

  // STEP1: Simplified Scene Generation (New Logic)
  const input: SceneInput = {
    environment: seed.environment,
    characterA: a,
    characterB: b,
    relationship: rel,
    userRole,
    interactionSource: source,
    specificSeed,
  }

  // Uses the new generator with built-in Opening Line Guard
  const simpleScene = await generateSimpleScene(input)

  // STEP2: Inflate to full Scene object for backward compatibility
  // We fill the required old fields with defaults or map them from the new simple structure.
  
  // Map new fields to old structure
  seed.situation = simpleScene.context
  seed.firstLine = simpleScene.openingLine
  // Enhance context with environment description if not present
  if (!simpleScene.context.toLowerCase().includes(seed.environment.toLowerCase())) {
    seed.context = `You are at ${seed.environment}. ${simpleScene.context}`
  } else {
    seed.context = simpleScene.context
  }
  seed.openingLine = simpleScene.openingLine
  seed.yourRole = simpleScene.yourRole || userRole
  seed.interactionSource = source

  // Fill backend-required fields with sensible defaults (no longer AI generated)
  seed.conversationFocus = 'casual interaction'
  seed.emotionalContext = 'neutral'
  seed.interactionTension = 'low'
  seed.alignment = 'neutral'
  seed.dynamic = 'brief exchange'
  seed.hiddenPerspective = 'none'
  seed.userGoal = simpleScene.userGoal || 'Chat naturally and see where it goes.'
  seed.endingCondition = 'Natural conversation pause'

  // Local systems: personality (Required for Orchestrator)
  const traits = generatePersonalityPair()
  seed.personalityTraits = traits

  // Derive interactionStyle / scenePace for Turn Engine
  seed.interactionStyle = 'cooperative'
  seed.scenePace = 'medium'

  return seed
}
