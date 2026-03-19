import { orchestrateConversation } from './lib/ai/orchestrator.ts'
import { generateScene } from './lib/scene/generator.ts'

const scene = generateScene(6)
const history: any[] = []

;(async () => {
  const result = await orchestrateConversation(scene, history, 'User says hi')
  console.log('aiTurns:', result.aiTurns)
  console.log('history length:', result.history.length)
  console.log('history tail:', result.history.slice(-Math.min(3, result.history.length)))
})().catch((e) => console.error('orchestrator test error:', e?.message || e))
