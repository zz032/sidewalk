type Entry = { key: string; value: string }

const MAX_ENTRIES = 200
const map = new Map<string, Entry>()
const order: string[] = []

function evictIfNeeded() {
  while (order.length > MAX_ENTRIES) {
    const k = order.shift()
    if (k) {
      map.delete(k)
    }
  }
}

export function simpleHash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i)
  }
  return (h >>> 0).toString(16)
}

export function computeScenarioId(input: { environment: string; a: string; b: string; situation?: string }): string {
  const raw = `${input.environment}|${input.a}|${input.b}|${input.situation || ''}`
  return simpleHash(raw)
}

export function buildCacheKey(scenarioId: string, lastUserMessage: string, conversationFocus?: string): string {
  const base = `${scenarioId}|${lastUserMessage}|${conversationFocus || ''}`
  return simpleHash(base)
}

export function getCachedResponse(key: string): string | null {
  const hit = map.get(key)
  return hit ? hit.value : null
}

export function setCachedResponse(key: string, value: string) {
  if (!map.has(key)) {
    order.push(key)
  }
  map.set(key, { key, value })
  evictIfNeeded()
}

