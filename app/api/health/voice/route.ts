import { NextResponse } from 'next/server'
import crypto from 'crypto'

const TTS_URL = process.env.IFLYTEK_TTS_URL || 'https://api.xfyun.cn/v1/service/v1/tts'
const APP_ID = process.env.IFLYTEK_APP_ID
const API_KEY = process.env.IFLYTEK_API_KEY

export async function GET() {
  const hasAppId = !!APP_ID
  const hasApiKey = !!API_KEY

  // Never expose secrets. Provide only booleans and vendor error excerpts.
  const result: any = {
    hasAppId,
    hasApiKey,
    tts: { attempted: false, ok: false as boolean, status: undefined as number | undefined, vendor: undefined as any },
  }

  // Only attempt a lightweight TTS probe if credentials look present
  if (hasAppId && hasApiKey) {
    try {
      const curTime = Math.floor(Date.now() / 1000).toString()
      const paramObj = {
        auf: 'audio/L16;rate=16000',
        aue: 'lame',
        voice_name: 'xiaoyan',
        engine_type: 'intp65',
        speed: '50',
        pitch: '50',
        volume: '50',
        text_type: 'text',
      }
      const xParam = Buffer.from(JSON.stringify(paramObj)).toString('base64')
      const checksum = crypto.createHash('md5').update(API_KEY! + curTime + xParam).digest('hex')

      const headers = {
        'X-Appid': APP_ID!,
        'X-CurTime': curTime,
        'X-Param': xParam,
        'X-CheckSum': checksum,
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      }
      const body = new URLSearchParams({ text: '健康检查' }).toString()
      const r = await fetch(TTS_URL, { method: 'POST', headers, body })
      result.tts.attempted = true
      result.tts.status = r.status
      const ct = r.headers.get('content-type') || ''
      const ab = await r.arrayBuffer()
      if (r.ok && /audio/i.test(ct)) {
        result.tts.ok = true
      } else {
        const txt = Buffer.from(ab).toString('utf8')
        try {
          result.tts.vendor = JSON.parse(txt)
        } catch {
          result.tts.vendor = txt
        }
      }
    } catch (e: any) {
      result.tts.attempted = true
      result.tts.ok = false
      result.tts.vendor = String(e?.message || e)
    }
  }

  return NextResponse.json(result, { status: 200 })
}

