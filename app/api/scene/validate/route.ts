import { NextResponse } from 'next/server'
import type { Scene } from '../../../../types'
import { validateAndFixScene } from '../../../../lib/scene/validator'

export async function POST(req: Request) {
  try {
    const { scene } = (await req.json()) as { scene: Scene }
    const result = await validateAndFixScene(scene)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}
