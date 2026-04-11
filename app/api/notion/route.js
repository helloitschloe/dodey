import { getBiens, getContacts, getCompta } from '@/lib/notion'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    if (type === 'biens') return Response.json(await getBiens())
    if (type === 'contacts') return Response.json(await getContacts())
    if (type === 'compta') return Response.json(await getCompta())
    return Response.json({ error: 'type invalide' }, { status: 400 })
  } catch(e) {
    console.error('Notion GET error:', e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
