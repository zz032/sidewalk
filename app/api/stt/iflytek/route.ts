import { NextResponse } from 'next/server'
import crypto from 'crypto'

const API_URL = process.env.IFLYTEK_IAT_URL || 'https://api.xfyun.cn/v1/service/v1/iat'
const APP_ID = process.env.IFLYTEK_APP_ID
const API_KEY = process.env.IFLYTEK_API_KEY

export async function POST(req: Request) {
  if (!APP_ID || !API_KEY) {
    return NextResponse.json({ error: 'missing iflytek credentials' }, { status: 500 })
  }
  const buf = Buffer.from(await req.arrayBuffer())
  const audioBase64 = buf.toString('base64')
  const curTime = Math.floor(Date.now() / 1000).toString()
  const paramObj = { engine_type: 'sms-en16k', aue: 'raw', audio_format: 'wav' }
  const xParam = Buffer.from(JSON.stringify(paramObj)).toString('base64')
  const checksum = crypto.createHash('md5').update(API_KEY + curTime + xParam).digest('hex')

  const headers = {
    'X-Appid': APP_ID,
    'X-CurTime': curTime,
    'X-Param': xParam,
    'X-CheckSum': checksum,
    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
  }

  const body = new URLSearchParams({ audio: audioBase64 }).toString()
  const r = await fetch(API_URL, { method: 'POST', headers, body })
  const text = await r.text()
  if (!r.ok) {
    return NextResponse.json({ error: 'iflytek error', detail: text }, { status: r.status })
  }
  try {
    const j = JSON.parse(text) as any
    const candidate = j.data?.result || j.data || j.result || j.text || ''
    const out = typeof candidate === 'string' ? candidate : JSON.stringify(candidate)
    return NextResponse.json({ text: out })
  } catch {
    return NextResponse.json({ text })
  }
}
