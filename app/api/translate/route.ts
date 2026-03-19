import { NextResponse } from 'next/server'

const LT_URL = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com/translate'
const LT_API_KEY = process.env.LIBRETRANSLATE_API_KEY || ''

type Payload = {
  q?: string
  text?: string
  source?: string
  target?: string
  format?: 'text' | 'html'
}

export async function POST(req: Request) {
  let body: Payload = {}
  try {
    body = (await req.json()) as Payload
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const q = (body.q ?? body.text ?? '').toString()
  const source = (body.source ?? 'auto').toString()
  const target = (body.target ?? '').toString()
  const format = (body.format ?? 'text') as 'text' | 'html'

  if (!q) return NextResponse.json({ error: 'q (text) required' }, { status: 400 })
  if (!target) return NextResponse.json({ error: 'target required' }, { status: 400 })

  // Graceful fallback: if no API key configured, return original text
  if (!LT_API_KEY) {
    return new NextResponse(JSON.stringify({ text: q }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Translate': 'bypass' },
    })
  }

  try {
    const res = await fetch(LT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q,
        source,
        target,
        format,
        api_key: LT_API_KEY,
      }),
    })

    const ct = res.headers.get('content-type') || ''
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return NextResponse.json({ error: 'translate_failed', detail: errText }, { status: res.status })
    }

    if (/application\/json/i.test(ct)) {
      const j = (await res.json()) as any
      const out = j?.translatedText ?? j?.text ?? j?.result ?? ''
      return NextResponse.json({ text: out || '' })
    } else {
      const t = await res.text()
      try {
        const j = JSON.parse(t)
        const out = j?.translatedText ?? j?.text ?? j?.result ?? ''
        return NextResponse.json({ text: out || '' })
      } catch {
        return NextResponse.json({ text: t })
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: 'network_error', detail: String(e?.message || e) }, { status: 502 })
  }
}

