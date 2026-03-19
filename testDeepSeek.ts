import { callDeepSeek } from './lib/ai/deepseek.ts'

const prompt = 'Test prompt for AI response'

callDeepSeek(prompt)
  .then((res) => {
    console.log(res)
  })
  .catch((err) => {
    console.error('DeepSeek call error:', err?.message || err)
  })
