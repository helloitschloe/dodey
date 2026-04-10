import { NextResponse } from 'next/server'
import { askKapouk } from '@/lib/claude'

export async function POST(req) {
  try {
    const { messages, context } = await req.json()
    if (!messages?.length) return NextResponse.json({ error: 'messages requis' }, { status: 400 })
    const reply = await askKapouk(messages, context)
    return NextResponse.json({ reply })
  } catch (e) {
    console.error('Kapouk error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
