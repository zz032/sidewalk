import {
  ENVIRONMENTS,
  TRIGGER_EVENTS,
  EMOTIONAL_STATES,
  BEHAVIOR_STRATEGIES,
  RELATIONSHIP_TYPES,
  CLOSURE_REASONS,
} from './rules'
import type { Scene, Character, TriggerEvent } from '../../types'

const FIRST_NAMES = [
  'Alex',
  'Jordan',
  'Taylor',
  'Morgan',
  'Riley',
  'Casey',
  'Skyler',
  'Quinn',
  'Sam',
  'Jamie',
] as const

const VOICES = [
  'calm male',
  'warm female',
  'neutral',
  'friendly',
  'confident',
] as const

function sample<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function distinctPair<T>(arr: readonly T[]): [T, T] {
  if (arr.length < 2) {
    throw new Error('Array must contain at least two elements')
  }
  const a = sample(arr)
  let b = sample(arr)
  while (b === a) b = sample(arr)
  return [a, b]
}

function dramaDescriptor(level: number): string {
  if (level >= 8) return 'high'
  if (level >= 4) return 'medium'
  return 'low'
}

function buildHiddenTension(env: string, rel: string, trigger: string, level: number): string {
  const tone = dramaDescriptor(level)
  const seeds = {
    low: `A mild misunderstanding between the ${rel}s in the ${env}, triggered by ${trigger}.`,
    medium: `A growing disagreement between the ${rel}s about how to handle ${trigger} in the ${env}.`,
    high: `A tense conflict between the ${rel}s in the ${env} escalated by ${trigger}, risking public embarrassment.`,
  } as const
  return seeds[tone as keyof typeof seeds]
}

function envCategory(env: string): 'transit' | 'retail' | 'food' | 'public_service' | 'health' | 'education' | 'work' | 'social' | 'generic' {
  const e = env.toLowerCase()
  if (/(station|platform|subway|bus|train|tram|terminal|airport)/.test(e)) return 'transit'
  if (/(shop|store|market|counter|salon|barber|tailor|cobbler|laundromat|cleaner)/.test(e)) return 'retail'
  if (/(cafe|coffee|restaurant|diner|bar|food)/.test(e)) return 'food'
  if (/(post office|embassy|city hall|info desk|courthouse)/.test(e)) return 'public_service'
  if (/(clinic|hospital|pharmacy|doctor|nurse)/.test(e)) return 'health'
  if (/(class|school|workshop|library)/.test(e)) return 'education'
  if (/(office|coworking|bullpen)/.test(e)) return 'work'
  if (/(meetup|mixer|reception|event|conference)/.test(e)) return 'social'
  return 'generic'
}

function isIndoor(env: string): boolean {
  const e = env.toLowerCase()
  return /(lobby|reception|office|hallway|clinic|hospital|library|classroom|store|shop|counter|salon|barber|court|courthouse|embassy|city hall)/.test(e)
}

function socialSubtype(env: string): 'gym' | 'reception' | 'meetup' | 'conference' | 'event' | 'generic' {
  const e = env.toLowerCase()
  if (/gym/.test(e)) return 'gym'
  if (/wedding reception|reception/.test(e)) return 'reception'
  if (/meetup|mixer|speed dating/.test(e)) return 'meetup'
  if (/conference|demo day|career fair|booth|hallway/.test(e)) return 'conference'
  if (/festival|street fair|concert|stadium|venue/.test(e)) return 'event'
  return 'generic'
}

const TRIGGER_POOLS: Record<string, string[]> = {
  transit: [
    'missed stop',
    'train delay',
    'bus rerouted',
    'doors closing soon',
    'seat becomes available',
    'queue opens',
    'map reroute',
  ],
  retail: [
    'incorrect order',
    'overcharged bill',
    'undercharged bill',
    'promo code not working',
    'reservation mix-up',
    'double booking',
    'wrong seat assignment',
    'flash sale',
    'delivery mix-up',
    'package missing',
  ],
  food: [
    'incorrect order',
    'overcharged bill',
    'undercharged bill',
    'reservation mix-up',
    'flash sale',
    'queue opens',
  ],
  public_service: [
    'queue opens',
    'id verification',
    'delivery mix-up',
    'package missing',
    'lost item found',
    'name called by staff',
  ],
  health: [
    'health check request',
    'id verification',
    'name called by staff',
    'incorrect order',
  ],
  education: [
    'reservation mix-up',
    'misplaced ticket',
    'overheard interesting topic',
    'lost item found',
  ],
  work: [
    'new message popup',
    'app glitch',
    'device pairing request',
    'security bag check',
    'id verification',
  ],
  social: [
    'overheard interesting topic',
    'bump into acquaintance',
    'ask to take a photo',
    'ask for directions'
  ],
  generic: [
    'lost item found',
    'spilled coffee',
    'sudden rain',
    'fire alarm test',
    'security bag check',
    'language misunderstanding',
  ],
}

const RELATIONSHIP_POOLS: Record<string, string[]> = {
  transit: ['commuter', 'tourist', 'neighbor', 'student', 'friend', 'coworker'],
  retail: ['customer', 'friend', 'coworker', 'neighbor', 'tourist', 'roommate', 'sibling', 'parent', 'child'],
  food: ['customer', 'friend', 'coworker', 'neighbor', 'tourist', 'roommate', 'sibling', 'parent', 'child'],
  public_service: ['customer', 'friend', 'neighbor', 'tourist', 'parent', 'child', 'student'],
  health: ['friend', 'parent', 'child', 'neighbor', 'classmate'],
  education: ['student', 'classmate', 'friend'],
  work: ['coworker', 'teammate', 'manager', 'direct report'],
  social: ['friend', 'online acquaintance', 'language partner', 'neighbor', 'coworker'],
  generic: ['friend', 'neighbor', 'tourist', 'customer', 'online acquaintance', 'language partner'],
}

function chooseTriggerForEnv(env: string): string {
  const cat = envCategory(env)
  if (cat === 'social') {
    const sub = socialSubtype(env)
    const bySub: Record<string, string[]> = {
      gym: ['ask to take a photo', 'bump into acquaintance', 'ask for directions', 'name called by staff'],
      reception: ['ask to take a photo', 'overheard interesting topic', 'bump into acquaintance'],
      meetup: ['overheard interesting topic', 'ask to take a photo', 'ask for directions'],
      conference: ['overheard interesting topic', 'ask for directions', 'new message popup'],
      event: ['ask to take a photo', 'overheard interesting topic', 'bump into acquaintance'],
      generic: ['overheard interesting topic', 'ask for directions', 'bump into acquaintance'],
    }
    let poolSub = bySub[sub] || bySub.generic
    if (isIndoor(env)) {
      poolSub = poolSub.filter((t) => t !== 'sudden rain')
    }
    return sample(poolSub)
  }
  let pool = TRIGGER_POOLS[cat]
  if (pool && pool.length) {
    if (isIndoor(env)) {
      pool = pool.filter((t) => t !== 'sudden rain')
    }
    return sample(pool)
  }
  return sample(TRIGGER_EVENTS)
}

function chooseRelationshipForEnv(env: string): string {
  const cat = envCategory(env)
  const pool = RELATIONSHIP_POOLS[cat]
  if (pool && pool.length) return sample(pool)
  return 'friend'
}

function chooseInitiativeForEnv(env: string, trigger: string): string {
  const cat = envCategory(env)
  const t = trigger.toLowerCase()
  const byTrigger: Record<string, string[]> = {
    ticket: ['check lost-and-found', 'confirm details with staff', 'ask if they need a hand'],
    reservation: ['confirm details with staff', 'ask about wait time', 'offer to hold their spot'],
    order: ['clarify the bill with staff', 'confirm the order details', 'ask if they spoke to staff'],
    queue: ['clarify how the queue works', 'offer to hold their spot', 'ask about wait time'],
    id: ['remind to prepare ID', 'clarify the procedure with staff', 'ask where to verify'],
    delivery: ['check tracking with staff', 'confirm pickup details', 'ask if a claim is needed'],
    lostfound: ['check lost-and-found', 'ask where to report it', 'suggest retracing steps'],
    map: ['ask directions politely', 'suggest an alternate route', 'check if this is the right platform'],
    delay: ['make small talk about the delay', 'check announcements', 'suggest an alternate plan'],
    app: ['suggest retrying the app', 'check settings together', 'try a quick reboot'],
    spill: ['offer a napkin', 'suggest moving aside', 'check if they are okay'],
    photo: ['offer to take a photo', 'ask if they need help with the picture'],
    directions: ['ask directions politely', 'offer a quick suggestion'],
    greet: ['say hi', 'make small talk'],
  }
  const mapKeys: Array<[string, RegExp]> = [
    ['ticket', /(ticket|misplaced ticket)/],
    ['reservation', /(reservation|double booking|wrong seat)/],
    ['order', /(order|overcharged|undercharged)/],
    ['queue', /(queue opens|seat becomes available)/],
    ['id', /(id verification|security)/],
    ['delivery', /(delivery mix-up|package missing)/],
    ['lostfound', /(lost item found|dropped wallet)/],
    ['map', /(map reroute|bus rerouted)/],
    ['delay', /(train delay|doors closing soon)/],
    ['app', /(app glitch|device pairing|new message popup)/],
    ['spill', /(spilled coffee|sudden rain)/],
    ['photo', /(ask to take a photo)/],
    ['directions', /(ask for directions)/],
  ]
  let key = 'greet'
  for (const [k, re] of mapKeys) {
    if (re.test(t)) {
      key = k
      break
    }
  }
  const poolByTrigger = byTrigger[key] || byTrigger.greet
  const byEnv: Record<string, string[]> = {
    transit: ['ask directions politely', 'check if this is the right platform', 'make small talk about the delay'],
    retail: ['confirm details with staff', 'offer to hold their spot in line', 'ask about wait time'],
    food: ['confirm details with staff', 'offer to hold their spot in line', 'ask about wait time'],
    public_service: ['ask the clerk politely', 'clarify how the queue works', 'make small talk while waiting'],
    health: ['check if they are okay', 'offer a quick suggestion', 'make small talk about the wait'],
    education: ['say hi and ask about class', 'follow up on a message', 'ask a quick class-related question'],
    work: ['share a quick update', 'ask if they have a moment', 'clarify a small detail'],
    social: ['say hi', 'bring up the topic you overheard'],
    generic: ['say hi', 'make small talk', 'ask if everything is okay'],
  }
  const poolByEnv = byEnv[cat] || byEnv.generic
  if (poolByTrigger && poolByTrigger.length) {
    return sample(poolByTrigger)
  }
  return sample(poolByEnv)
}

function chooseClosureForEnv(env: string): string {
  const cat = envCategory(env)
  switch (cat) {
    case 'transit':
      return 'train boarding'
    case 'retail':
      return 'store closing announcement'
    case 'food':
      return 'table ready'
    case 'public_service':
      return 'security check'
    case 'education':
      return 'class begins'
    case 'work':
      return 'meeting starting'
    case 'social':
      return 'phone call'
    case 'health':
      return 'phone call'
    default:
      return 'phone call'
  }
}

function triggerReadable(trigger: string): string {
  const map: Record<string, string> = {
    'map reroute': 'their map app rerouted',
    'incorrect order': 'an order was incorrect',
    'overcharged bill': 'a bill appears overcharged',
    'undercharged bill': 'a bill seems undercharged',
    'lost item found': 'a lost item was found',
    'reservation mix-up': 'a reservation got mixed up',
    'double booking': 'a double booking happened',
    'misplaced ticket': 'a ticket seems misplaced',
    'delivery mix-up': 'a delivery got mixed up',
    'package missing': 'a package appears missing',
    'new message popup': 'a pop-up notification appeared',
    'app glitch': 'an app glitch occurred',
    'device pairing request': 'a device pairing request popped up',
    'train delay': 'a train delay was announced',
    'bus rerouted': 'the bus route changed',
    'doors closing soon': 'the doors are closing soon',
    'seat becomes available': 'a seat just became available',
    'queue opens': 'a new line opened',
    'fire alarm test': 'a fire alarm test started',
    'security bag check': 'a bag check was requested',
    'id verification': 'an ID check was requested',
    'spilled coffee': 'someone spilled coffee',
    'sudden rain': 'it suddenly started raining',
    'ask to take a photo': 'someone asked if you could take a photo',
    'ask for directions': 'someone asked for directions',
    'overheard interesting topic': 'you overheard an interesting topic',
    'name called by staff': 'a staff member called a name',
    'bump into acquaintance': 'you bumped into an acquaintance',
  }
  return map[trigger] ?? `${trigger} occurs`
}

function buildSituation(env: string, trigger: string, action: string, rel: string): string {
  const t = triggerReadable(trigger)
  return `You are at a ${env} when ${t}. Two ${rel}s nearby are talking. You may ${action} or let them lead the conversation.`
}

function buildABFirstLine(name: string, trigger: string): string {
  const t = triggerReadable(trigger)
  const options = [
    `${name}: Hey, quick question—${t}. What do you think?`,
    `${name}: Did you notice ${t}?`,
    `${name}: Sorry, could I ask you something? ${t[0].toUpperCase()}${t.slice(1)}.`,
  ]
  return sample(options)
}

function buildUserFirstLine(rel: string, trigger: string): string {
  const t = triggerReadable(trigger)
  const options = [
    `User: Hey—${t}. Everything okay?`,
    `User: Hi! ${t[0].toUpperCase()}${t.slice(1)}. Do you have a minute?`,
    `User: Hey there, just wanted to say hi—${t}.`,
  ]
  return sample(options)
}

function chooseStarter(): 'A' | 'B' | 'User' {
  const r = Math.random()
  if (r < 0.4) return 'A'
  if (r < 0.7) return 'B'
  return 'User'
}

export function generateScene(dramaLevel: number): Scene {
  const environment = sample(ENVIRONMENTS)
  const triggerType = chooseTriggerForEnv(environment)
  const triggerEvent: TriggerEvent = {
    type: triggerType,
    description: `An event occurred: ${triggerType}`,
  }

  const [nameA, nameB] = distinctPair(FIRST_NAMES)
  const relationship = chooseRelationshipForEnv(environment)
  const [emotionA, emotionB] = distinctPair(EMOTIONAL_STATES)
  const [strategyA, strategyB] = distinctPair(BEHAVIOR_STRATEGIES)
  const [voiceA, voiceB] = [sample(VOICES), sample(VOICES)]

  const characters: Character[] = [
    {
      name: nameA,
      relationship: relationship,
      personality: 'pragmatic',
      emotion: emotionA,
      behaviorStrategy: strategyA,
      voice: voiceA,
    },
    {
      name: nameB,
      relationship: relationship,
      personality: 'diplomatic',
      emotion: emotionB,
      behaviorStrategy: strategyB,
      voice: voiceB,
    },
  ]

  const initiative = chooseInitiativeForEnv(environment, triggerType)

  const situation = buildSituation(environment, triggerType, initiative, relationship)
  const hiddenTension = buildHiddenTension(environment, relationship, triggerType, dramaLevel)
  const goalTemplates = [
    `Start or join the conversation and ${initiative}.`,
    `Keep it brief and ${initiative}.`,
    `If appropriate, ${initiative}.`,
  ]
  const userGoal = sample(goalTemplates)
  const starter = chooseStarter()
  const firstLine =
    starter === 'User'
      ? buildUserFirstLine(relationship, triggerType)
      : buildABFirstLine(starter === 'A' ? characters[0].name : characters[1].name, triggerType)
  const closureCondition = chooseClosureForEnv(environment)

  return {
    environment,
    characters,
    triggerEvent,
    situation,
    initiativeAction: initiative,
    hiddenTension,
    userGoal,
    firstLine,
    dramaLevel: dramaDescriptor(dramaLevel),
    closureCondition,
  }
}

export default generateScene
