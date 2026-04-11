import { createBien, createContact, updateBien } from '@/lib/notion'

async function callGemini(contents) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents }) }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Gemini error')
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function POST(req) {
  try {
    const { messages } = await req.json()

    const systemPrompt = `Tu es Kapouk, agent IA de Maxime, agent immobilier a Bordeaux.
Tu geres son CRM Dodey connecte a Notion.
Sources: CAKM (locaux Airbnb avec Kevin, 2 commissions), HOMELOOP (leads), Perso.
Inter-agence = case separee applicable a CAKM ou Perso.
Statuts: A prospecter, No show, Prospecte, Estimation a envoyer, Estimation faite, Mandat signe, En ligne, Compromis, Vendu, Cloture.

Reponds UNIQUEMENT en JSON valide sans markdown:
{"reply":"reponse courte en francais","actions":[{"type":"CREATE_BIEN","data":{"adresse":"adresse complete Bordeaux","source":"CAKM ou HOMELOOP ou Perso ou null","statut":"A prospecter","interAgence":false,"notes":null,"prixEstimation":null,"prixMandat":null,"honorairesEstimes":null,"honorairesReels":null,"honorairesCakm":null,"retrocessionCakm":null}}],"questions":[]}`

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: '{"reply":"Compris.","actions":[],"questions":[]}' }] },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    ]

    const raw = await callGemini(contents)
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed = { reply: clean, actions: [], questions: [] }
    try { parsed = JSON.parse(clean) } catch(e) { parsed.reply = clean }

    let created = 0
    let updated = 0

    for (const action of (parsed.actions || [])) {
      try {
        if (action.type === 'CREATE_BIEN' && action.data?.adresse) {
          await createBien(action.data)
          created++
        } else if (action.type === 'CREATE_CONTACT' && action.data?.nom) {
          await createContact(action.data)
          created++
        } else if (action.type === 'UPDATE_BIEN' && action.data?.id) {
          await updateBien(action.data.id, action.data)
          updated++
        }
      } catch(e) {
        console.error('Action error:', e.message)
      }
    }

    let reply = parsed.reply || ''
    if (created > 0) reply += '\n\n✓ ' + created + ' fiche' + (created > 1 ? 's' : '') + ' dans Notion.'
    if (updated > 0) reply += '\n\n✓ ' + updated + ' fiche' + (updated > 1 ? 's' : '') + ' mise a jour.'
    if (parsed.questions?.length > 0) reply += '\n\n' + parsed.questions.join('\n')

    return Response.json({ reply })

  } catch (e) {
    console.error('Kapouk error:', e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
