import type { Scene } from '../../types'
import { callDeepSeek } from '../ai/deepseek'

export async function refineScene(scene: Scene): Promise<Scene> {
  const prompt =
    [
      'You are a scene refiner. Make the scene coherent and grounded.',
      'Fix mismatches (indoor vs. weather, roles vs. actions).',
      'Ensure initiativeAction is realistic for the environment and event.',
      'Return valid JSON only with the same keys.',
      JSON.stringify(scene),
    ].join('\n')
  try {
    const text = await callDeepSeek(prompt, { temperature: 0.3, max_tokens: 256 })
    const j = JSON.parse(text)
    const keys = [
      'environment',
      'characters',
      'triggerEvent',
      'situation',
      'initiativeAction',
      'hiddenTension',
      'userGoal',
      'firstLine',
      'dramaLevel',
      'closureCondition',
    ]
    for (const k of keys) {
      if (!(k in j)) return scene
    }
    return j as Scene
  } catch {
    return scene
  }
}

export default refineScene
