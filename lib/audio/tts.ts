import type { Scene } from '../../types'

const DEFAULT_A_VOICE = 'xiaoyan' // female
const DEFAULT_B_VOICE = 'aisjiuxu' // male

export function mapVoiceLabelToVcn(label?: string, fallback?: string): string {
  const l = (label || '').toLowerCase()
  if (l.includes('female') || l.includes('warm')) return 'xiaoyan'
  if (l.includes('male') || l.includes('calm') || l.includes('confident')) return 'aisjiuxu'
  if (l.includes('neutral') || l.includes('friendly')) return 'xiaoyan'
  return fallback || DEFAULT_A_VOICE
}

export async function ttsFetchAudio(text: string, vcn: string): Promise<Blob> {
  const res = await fetch('/api/tts/iflytek', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, vcn }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`tts failed: ${res.status} ${t}`)
  }
  const buf = await res.arrayBuffer()
  const type = res.headers.get('Content-Type') || 'audio/mpeg'
  return new Blob([buf], { type })
}

export async function speakBlob(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  await audio.play().catch(() => {
    // swallow autoplay errors; caller may handle UI gestures
  })
  audio.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true })
}

export function pickCharacterVcn(scene: Scene, who: 'A' | 'B'): string {
  const a = scene.characters[0]
  const b = scene.characters[1]
  const vA = mapVoiceLabelToVcn(a?.voice, DEFAULT_A_VOICE)
  const vB = mapVoiceLabelToVcn(b?.voice, DEFAULT_B_VOICE)
  if (who === 'A') return vA
  // ensure different voices
  return vB === vA ? DEFAULT_B_VOICE : vB
}

export async function speakForCharacter(scene: Scene, who: 'A' | 'B', text: string): Promise<void> {
  const vcn = pickCharacterVcn(scene, who)
  const blob = await ttsFetchAudio(text, vcn)
  await speakBlob(blob)
}

export default { ttsFetchAudio, speakBlob, pickCharacterVcn, speakForCharacter, mapVoiceLabelToVcn }
