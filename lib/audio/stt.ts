type RecorderController = {
  start: () => Promise<void>
  stop: () => Promise<Blob>
  isRecording: () => boolean
}

function mergeBuffers(buffers: Float32Array[], length: number): Float32Array {
  const result = new Float32Array(length)
  let offset = 0
  for (const b of buffers) {
    result.set(b, offset)
    offset += b.length
  }
  return result
}

function downsampleBuffer(buffer: Float32Array, sampleRate: number, outRate: number): Float32Array {
  if (outRate === sampleRate) return buffer
  const ratio = sampleRate / outRate
  const newLen = Math.floor(buffer.length / ratio)
  const result = new Float32Array(newLen)
  let i = 0
  let j = 0
  let sum = 0
  let count = 0
  while (i < buffer.length) {
    sum += buffer[i++]
    count++
    if (i / ratio > j) {
      result[j++] = sum / count
      sum = 0
      count = 0
    }
  }
  return result
}

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  let offset = 0
  const writeString = (s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
    offset += s.length
  }
  writeString('RIFF')
  view.setUint32(offset, 36 + samples.length * 2, true); offset += 4
  writeString('WAVE')
  writeString('fmt ')
  view.setUint32(offset, 16, true); offset += 4
  view.setUint16(offset, 1, true); offset += 2
  view.setUint16(offset, 1, true); offset += 2
  view.setUint32(offset, sampleRate, true); offset += 4
  view.setUint32(offset, sampleRate * 2, true); offset += 4
  view.setUint16(offset, 2, true); offset += 2
  view.setUint16(offset, 16, true); offset += 2
  writeString('data')
  view.setUint32(offset, samples.length * 2, true); offset += 4
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return buffer
}

export function createSTTRecorder(targetSampleRate = 16000): RecorderController {
  let mediaStream: MediaStream | null = null
  let audioCtx: AudioContext | null = null
  let source: MediaStreamAudioSourceNode | null = null
  let processor: ScriptProcessorNode | null = null
  let sink: GainNode | null = null
  let recording = false
  const chunks: Float32Array[] = []
  let length = 0

  async function start() {
    if (recording) return
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } as any })
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    try { await (audioCtx as any).resume?.() } catch {}
    source = audioCtx.createMediaStreamSource(mediaStream)
    processor = audioCtx.createScriptProcessor(2048, 1, 1)
    processor.onaudioprocess = (e) => {
      const data = e.inputBuffer.getChannelData(0)
      chunks.push(new Float32Array(data))
      length += data.length
    }
    source.connect(processor)
    sink = audioCtx.createGain()
    sink.gain.value = 0
    processor.connect(sink)
    sink.connect(audioCtx.destination)
    recording = true
  }

  async function stop() {
    if (!recording) throw new Error('not recording')
    recording = false
    processor?.disconnect()
    source?.disconnect()
    sink?.disconnect()
    mediaStream?.getTracks().forEach((t) => t.stop())
    const inputRate = audioCtx?.sampleRate ?? 48000
    audioCtx?.close()
    const merged = mergeBuffers(chunks, length)
    const ds = downsampleBuffer(merged, inputRate, targetSampleRate)
    const wav = encodeWav(ds, targetSampleRate)
    return new Blob([wav], { type: 'audio/wav' })
  }

  return {
    start,
    stop,
    isRecording: () => recording,
  }
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const res = await fetch('/api/stt/iflytek', {
    method: 'POST',
    headers: { 'Content-Type': 'audio/wav' },
    body: blob,
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`stt failed: ${res.status} ${t}`)
  }
  const data = (await res.json()) as { text?: string }
  if (!data.text) throw new Error('no transcription')
  return data.text
}

export default { createSTTRecorder, transcribeAudio }
