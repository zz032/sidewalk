import { NextResponse } from 'next/server'
import type { Scene } from '../../../../types'
import { refineScene } from '../../../../lib/scene/refine'

export async function POST(req: Request) {
  try {
    const { scene } = (await req.json()) as { scene: Scene }
    const s = await refineScene(scene)
    return NextResponse.json({ scene: s })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}
