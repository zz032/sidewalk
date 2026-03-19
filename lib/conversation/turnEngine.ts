type TurnState = 'idle' | 'waiting_user' | 'ai_prompting' | 'ai_continuing'

let state: TurnState = 'idle'
let promptTimer: ReturnType<typeof setTimeout> | null = null
let continueTimer: ReturnType<typeof setTimeout> | null = null
let onPromptCb: (() => void) | null = null
let onContinueCb: (() => void) | null = null

function clearTimers() {
  if (promptTimer) {
    clearTimeout(promptTimer)
    promptTimer = null
  }
  if (continueTimer) {
    clearTimeout(continueTimer)
    continueTimer = null
  }
}

export function startWaitingForUser(opts: {
  onPrompt: () => void
  onContinue: () => void
  promptDelayMs?: number
  continueDelayMs?: number
}) {
  clearTimers()
  state = 'waiting_user'
  onPromptCb = opts.onPrompt
  onContinueCb = opts.onContinue
  const promptDelay = opts.promptDelayMs ?? 6000
  const continueDelay = opts.continueDelayMs ?? 12000
  promptTimer = setTimeout(() => {
    triggerPrompt()
  }, promptDelay)
  continueTimer = setTimeout(() => {
    continueConversation()
  }, continueDelay)
}

export function triggerPrompt() {
  if (state !== 'waiting_user' && state !== 'ai_prompting') return
  state = 'ai_prompting'
  if (onPromptCb) onPromptCb()
}

export function continueConversation() {
  if (state === 'ai_continuing') return
  state = 'ai_continuing'
  if (onContinueCb) onContinueCb()
  // Once continued, reset timers so we don't re-trigger
  clearTimers()
  state = 'idle'
}

export function cancelWaiting() {
  clearTimers()
  state = 'idle'
}

export function getState(): TurnState {
  return state
}

// ---- Decision engine (multi-character) ----
import type { Scene, ConversationMessage, PersonalityLevel } from '../../types'

function levelScore(l?: PersonalityLevel): number {
  if (l === 'high') return 3
  if (l === 'medium') return 2
  return 1
}

function addressedByUser(userText: string, aName: string, bName: string): 'characterA' | 'characterB' | null {
  const t = userText.toLowerCase()
  if (new RegExp(`\\b${aName.toLowerCase()}\\b`).test(t)) return 'characterA'
  if (new RegExp(`\\b${bName.toLowerCase()}\\b`).test(t)) return 'characterB'
  return null
}

export function decideNextTurn(scene: Scene, history: ConversationMessage[], userText: string): {
  speaker: 'characterA' | 'characterB' | 'user'
  target: 'user' | 'characterA' | 'characterB'
  responseLength: 'short' | 'medium' | 'long'
} {
  const aName = scene.characters[0]?.name || 'A'
  const bName = scene.characters[1]?.name || 'B'
  const traits = scene.personalityTraits
  const talkA = levelScore(traits?.characterA.talkativeness)
  const talkB = levelScore(traits?.characterB.talkativeness)
  const initA = levelScore(traits?.characterA.initiative)
  const initB = levelScore(traits?.characterB.initiative)

  // Who is addressed?
  const addressed = addressedByUser(userText, aName, bName)
  if (addressed) {
    return {
      speaker: addressed,
      target: 'user',
      responseLength: pickLength(scene),
    }
  }

  // Analyze history for last speaker (ignoring the user's latest message if it's the very last one)
  // The orchestrator pushes the user message before calling this, so history[last] is User.
  // We need to check history[last - 1] to find the previous AI speaker.
  let lastAiSpeaker = ''
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i]
    if (msg.speaker !== 'User') {
      lastAiSpeaker = msg.speaker
      break
    }
  }

  let lastSpeakerIsA = lastAiSpeaker === aName
  let lastSpeakerIsB = lastAiSpeaker === bName

  // Weighted choice by talkativeness + initiative + rotation
  let wA = talkA + Math.random() + initA * 0.5
  let wB = talkB + Math.random() + initB * 0.5

  // Rotation logic: heavily penalize the last speaker to encourage turn-taking
  if (lastSpeakerIsA) wA -= 3.0
  if (lastSpeakerIsB) wB -= 3.0

  // Allow occasional double-turn if personality is high initiative/talkative
  // but generally enforce A-B-A-B flow
  
  const speak = wA >= wB ? 'characterA' : 'characterB'

  // Decide target
  let toOtherProb = scene.interactionTension && /medium|high/i.test(scene.interactionTension) ? 0.35 : 0.2
  if (scene.interactionStyle && /debate|competitive|argument/i.test(scene.interactionStyle)) {
    toOtherProb += 0.15
  } else if (scene.interactionStyle && /cooperat|support/i.test(scene.interactionStyle)) {
    toOtherProb -= 0.05
  }
  const target: 'user' | 'characterA' | 'characterB' =
    Math.random() < toOtherProb ? (speak === 'characterA' ? 'characterB' : 'characterA') : 'user'

  return {
    speaker: speak,
    target,
    responseLength: pickLength(scene),
  }
}

function pickLength(scene: Scene): 'short' | 'medium' | 'long' {
  const cf = (scene.conversationFocus || '').toLowerCase()
  const emo = (scene.emotionalContext || '').toLowerCase()
  const tension = (scene.interactionTension || 'low').toString().toLowerCase()
  if (/apolog|concern|worry|upset|emotional/.test(emo) || /high/.test(tension)) return 'long'
  if (/discuss|plan|compare|options|decision/.test(cf) || /medium/.test(tension)) return 'medium'
  const pace = (scene.scenePace || '').toLowerCase()
  if (pace === 'fast') return 'medium'
  if (pace === 'slow') return 'short'
  return 'short'
}
