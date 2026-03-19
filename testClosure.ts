import { checkClosure } from './lib/ai/closure.ts'
import { generateScene } from './lib/scene/generator.ts'

function now() {
  return new Date().toISOString()
}

const scene = generateScene(6)
const history = []
for (let i = 0; i < 11; i++) {
  history.push({ speaker: 'User', message: `msg ${i}`, timestamp: now() })
}

const ended = checkClosure(scene, history as any)
console.log(ended)
