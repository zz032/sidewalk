import { NextResponse } from 'next/server'
import type { Scene, ConversationMessage } from '../../../types'
import { orchestrateTurn } from '../../../lib/ai/orchestrator'
import { checkConversationClosure } from '../../../lib/ai/closure'

export async function POST(req: Request) {
  try {
    const { scene, history, text } = (await req.json()) as {
      scene: Scene
      history: ConversationMessage[]
      text: string
    }
    const result = await orchestrateTurn(scene, history, text)
    const closure = checkConversationClosure(scene, result.history)
    return NextResponse.json({ ...result, ...closure })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}
