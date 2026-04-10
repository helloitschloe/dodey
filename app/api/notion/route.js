import { NextResponse } from 'next/server'
import { getBiens, createBien, getContacts, createContact, getCompta } from '@/lib/notion'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  try {
    if (type === 'biens') return NextResponse.json(await getBiens())
    if (type === 'contacts') return NextResponse.json(await getContacts())
    if (type === 'compta') return NextResponse.json(await getCompta())
    return NextResponse.json({ error: 'type invalide' }, { status: 400 })
  } catch (e) {
    console.error('Notion GET error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  try {
    const data = await req.json()
    if (type === 'bien') return NextResponse.json(await createBien(data))
    if (type === 'contact') return NextResponse.json(await createContact(data))
    return NextResponse.json({ error: 'type invalide' }, { status: 400 })
  } catch (e) {
    console.error('Notion POST error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
