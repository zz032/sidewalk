import { createPrompt } from './lib/ai/prompt.ts'
import { generateScene } from './lib/scene/generator.ts'

const scene = generateScene(6)
const scenePrompt = createPrompt(scene, [])
console.log(scenePrompt)
