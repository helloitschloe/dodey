import { createBien, createContact, updateBien, getBiens, getContacts } from '@/lib/notion'

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
Inter-agence = applicable a CAKM ou Perso uniquement.

STATUTS EXACTS (utilise exactement ces valeurs):
"A prospecter", "No show", "Prospecte", "Estimation a envoyer", "Estimation faite", "Mandat signe", "En ligne", "Compromis", "Vendu", "Cloture"

REGLES:
- Quand source = CAKM ou Perso, demande toujours si inter-agence
- Contact et telephone = CREATE_CONTACT separement, jamais dans Notes
- Notes = uniquement informations sur le bien lui-meme

Reponds UNIQUEMENT en JSON valide sans markdown ni texte autour:
{
  "reply": "reponse courte en francais",
  "actions": [],
  "questions": []
}

Actions possibles:
CREATE_BIEN: {"type":"CREATE_BIEN","data":{"adresse":"adresse complete avec ville","source":"CAKM|HOMELOOP|Perso","statut":"A prospecter","interAgence":false,"notes":"infos sur le bien uniquement","prixEstimation":null,"prixMandat":null,"honorairesEstimes":null,"honorairesReels":null,"honorairesCakm":null,"retrocessionCakm":null}}

CREATE_CONTACT: {"type":"CREATE_CONTACT","data":{"nom":"Prenom Nom","tel":"0600000000","email":null,"type":"Vendeur|Acheteur|Investisseur|Agent","budget":null,"notes":null}}

UPDATE_BIEN: {"type":"UPDATE_BIEN","data":{"id":"id_notion","statut":"...","prixMandat":null}}

Si info manquante pose une question dans "questions".
Si pas d action: "actions":[]`

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
        console.error('Action error:', action.type, e.message)
      }
    }

    let reply = parsed.reply || ''
    if (created > 0) reply += '\n\n' + created + ' fiche' + (created > 1 ? 's' : '') + ' creee' + (created > 1 ? 's' : '') + ' dans Notion.'
    if (updated > 0) reply += '\n\n' + updated + ' fiche' + (updated > 1 ? 's' : '') + ' mise' + (updated > 1 ? 's' : '') + ' a jour.'
    if (parsed.questions?.length > 0) reply += '\n\n' + parsed.questions.join('\n')

    return Response.json({ reply })
  } catch (e) {
    console.error('Kapouk error:', e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    if (type === 'biens') return Response.json(await getBiens())
    if (type === 'contacts') return Response.json(await getContacts())
    return Response.json({ error: 'type invalide' }, { status: 400 })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
