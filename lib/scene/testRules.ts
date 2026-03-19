import { environments, triggerEvents } from './rules.ts'

console.log('environments length:', environments.length)
const rnd = triggerEvents[Math.floor(Math.random() * triggerEvents.length)]
console.log('random trigger:', rnd)
