import type { Scene } from '../../types'

function envCategory(env: string): 'transit' | 'retail' | 'food' | 'public_service' | 'health' | 'education' | 'work' | 'social' | 'generic' {
  const e = env.toLowerCase()
  if (/(station|platform|subway|bus|train|tram|terminal|airport)/.test(e)) return 'transit'
  if (/(shop|store|market|counter|salon|barber|tailor|cobbler|laundromat|cleaner)/.test(e)) return 'retail'
  if (/(cafe|coffee|restaurant|diner|bar|food)/.test(e)) return 'food'
  if (/(post office|embassy|city hall|info desk|courthouse)/.test(e)) return 'public_service'
  if (/(clinic|hospital|pharmacy|doctor|nurse|dentist)/.test(e)) return 'health'
  if (/(class|school|workshop|library)/.test(e)) return 'education'
  if (/(office|coworking|bullpen)/.test(e)) return 'work'
  if (/(meetup|mixer|reception|event|conference)/.test(e)) return 'social'
  return 'generic'
}

function inferUserRole(environment: string): string {
  const cat = envCategory(environment)
  switch (cat) {
    case 'transit':
      return 'commuter'
    case 'retail':
    case 'food':
      return 'customer'
    case 'public_service':
      return 'visitor'
    case 'health':
      return 'patient'
    case 'education':
      return 'student'
    case 'work':
      return 'colleague'
    case 'social':
      return 'attendee'
    default:
      return 'visitor'
  }
}

export function presentScene(scene: Scene): {
  title: string
  situation: string
  role: string
  goal: string
} {
  const title = scene.environment
  const aName = scene.characters[0]?.name
  const bName = scene.characters[1]?.name
  const rel = scene.characters[0]?.relationship || scene.characters[1]?.relationship || ''
  const who = rel ? `${aName} and ${bName} (${rel})` : `${aName} and ${bName}`
  const baseContext = scene.context || scene.situation
  const situation = baseContext || `You are at ${scene.environment}. ${who} are nearby.`
  const role = scene.yourRole || inferUserRole(scene.environment)
  const goal = (scene as any).userGoal || 'Join briefly and keep the exchange natural.'
  return { title, situation, role, goal }
}

export default presentScene
