import { generateAIResponse } from './lib/ai/dialogue.ts'
import { generateScene } from './lib/scene/generator.ts'

const scene = generateScene(6)

generateAIResponse(scene, [])
  .then((res) => {
    console.log(res)
  })
  .catch((err) => {
    console.error('Dialogue test error:', err?.message || err)
  })
