const API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions'
const API_KEY = process.env.DEEPSEEK_API_KEY

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type ChatCompletionChoice = {
  index: number
  message: ChatMessage
  finish_reason?: string
}

type ChatCompletionResponse = {
  id: string
  object: string
  created: number
  model: string
  choices: ChatCompletionChoice[]
}

export async function callDeepSeek(
  prompt: string,
  opts?: { model?: string; temperature?: number; max_tokens?: number }
): Promise<string> {
  if (!API_KEY) {
    throw new Error('Missing DEEPSEEK_API_KEY')
  }

  const body = {
    model: opts?.model ?? 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }] as ChatMessage[],
    temperature: opts?.temperature ?? 0.7,
    max_tokens: opts?.max_tokens ?? 512,
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`DeepSeek API error: ${res.status} ${res.statusText} ${text}`)
  }

  const data = (await res.json()) as ChatCompletionResponse
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('DeepSeek API returned no content')
  }
  return content
}

export default callDeepSeek
