import { NextResponse } from 'next/server'
import crypto from 'crypto'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const HOST = 'tts-api.xfyun.cn'
const PATH = '/v2/tts'
const WS_URL = `wss://${HOST}${PATH}`

const APP_ID = process.env.IFLYTEK_SPARK_APP_ID
const API_KEY = process.env.IFLYTEK_SPARK_API_KEY
const API_SECRET = process.env.IFLYTEK_SPARK_API_SECRET

function buildAuthQuery(): { url: string; date: string } {
  const date = new Date().toUTCString()
  const signatureOrigin = `host: ${HOST}\ndate: ${date}\nGET ${PATH} HTTP/1.1`
  const signatureSha = crypto.createHmac('sha256', API_SECRET || '').update(signatureOrigin).digest('base64')
  const authorization = `api_key="${API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`
  const url = `${WS_URL}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(HOST)}`
  return { url, date }
}

export async function POST(req: Request) {
  if (!APP_ID || !API_KEY || !API_SECRET) {
    return NextResponse.json({ error: 'missing spark credentials' }, { status: 500 })
  }
  let payload: { text?: string; vcn?: string; speed?: number; volume?: number; pitch?: number } = {}
  try {
    payload = (await req.json()) as any
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const text = (payload.text || '').toString()
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })
  const vcn = (payload.vcn || 'x4_xiaoyan').toString()
  const speed = Number.isFinite(payload.speed) ? Number(payload.speed) : 50
  const volume = Number.isFinite(payload.volume) ? Number(payload.volume) : 50
  const pitch = Number.isFinite(payload.pitch) ? Number(payload.pitch) : 50

  const { url } = buildAuthQuery()
  const { default: WebSocket } = await import('ws')
  const ws = new WebSocket(url, { headers: { Host: HOST } })

  const chunks: Buffer[] = []

  const done = new Promise<Buffer>((resolve, reject) => {
    ws.on('open', () => {
      const frame = {
        common: { app_id: APP_ID },
        business: {
          aue: 'lame',
          tte: 'UTF8',
          vcn,
          speed,
          volume,
          pitch
        },
        data: {
          status: 2,
          text: Buffer.from(text, 'utf8').toString('base64')
        }
      }
      ws.send(JSON.stringify(frame))
    })
    ws.on('message', (data: any) => {
      try {
        const j = JSON.parse(data.toString())
        const code = j?.code
        if (code !== 0) {
          reject(new Error(JSON.stringify(j)))
          return
        }
        const audioBase64 = j?.data?.audio
        if (audioBase64) {
          chunks.push(Buffer.from(audioBase64, 'base64'))
        }
        const status = j?.data?.status
        if (status === 2) {
          resolve(Buffer.concat(chunks))
          ws.close()
        }
      } catch (e) {
        reject(e as any)
      }
    })
    ws.on('error', (e: any) => reject(e as any))
    ws.on('close', () => {
      if (chunks.length === 0) {
        reject(new Error('connection closed without audio'))
      }
    })
    setTimeout(() => {
      try { ws.close() } catch {}
      if (chunks.length === 0) {
        reject(new Error('timeout'))
      }
    }, 15000)
  })

  try {
    const buf = await done
    return new Response(buf, { headers: { 'Content-Type': 'audio/mpeg' } })
  } catch (e: any) {
    return NextResponse.json({ error: 'spark tts error', detail: String(e?.message || e) }, { status: 500 })
  }
}
