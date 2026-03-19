import { NextResponse } from 'next/server'
import crypto from 'crypto'

const API_URL = process.env.IFLYTEK_TTS_URL || 'https://api.xfyun.cn/v1/service/v1/tts'
const APP_ID = process.env.IFLYTEK_APP_ID
const API_KEY = process.env.IFLYTEK_API_KEY

export async function POST(req: Request) {
  if (!APP_ID || !API_KEY) {
    return NextResponse.json({ error: 'missing iflytek credentials' }, { status: 500 })
  }
  let payload: { text?: string; vcn?: string; speed?: string; pitch?: string; volume?: string } = {}
  try {
    payload = (await req.json()) as any
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const text = (payload.text || '').toString()
  const vcn = (payload.vcn || 'xiaoyan').toString()
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

  const curTime = Math.floor(Date.now() / 1000).toString()
  const paramObj = {
    auf: 'audio/L16;rate=16000',
    aue: 'lame',
    voice_name: vcn,
    engine_type: 'intp65',
    speed: payload.speed || '50',
    pitch: payload.pitch || '50',
    volume: payload.volume || '50',
    text_type: 'text',
  }
  const xParam = Buffer.from(JSON.stringify(paramObj)).toString('base64')
  const checksum = crypto.createHash('md5').update(API_KEY + curTime + xParam).digest('hex')

  const headers = {
    'X-Appid': APP_ID,
    'X-CurTime': curTime,
    'X-Param': xParam,
    'X-CheckSum': checksum,
    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
  }

  const body = new URLSearchParams({ text }).toString()
  const r = await fetch(API_URL, { method: 'POST', headers, body })

  const ct = r.headers.get('content-type') || ''
  const ab = await r.arrayBuffer()
  if (!r.ok) {
    const errText = Buffer.from(ab).toString('utf8')
    return NextResponse.json({ error: 'iflytek tts error', detail: errText }, { status: r.status })
  }

  if (ct.includes('audio')) {
    return new Response(ab, { headers: { 'Content-Type': ct || 'audio/mpeg' } })
  } else {
    // some errors return JSON text
    const txt = Buffer.from(ab).toString('utf8')
    try {
      const j = JSON.parse(txt)
      return NextResponse.json(j, { status: 500 })
    } catch {
      return NextResponse.json({ error: 'unexpected tts response', detail: txt }, { status: 500 })
    }
  }
}
