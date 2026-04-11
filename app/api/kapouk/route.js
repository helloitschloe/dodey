import { createBien, createContact, updateBien, getBiens, getContacts } from '@/lib/notion'

async function callGroq(messages) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1024,
      messages
    })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Groq error')
  return data.choices?.[0]?.message?.content || ''
}

export async function POST(req) {
  try {
    const { messages } = await req.json()

    const system = `Tu es Kapouk, agent IA de Maxime, agent immobilier a Bordeaux.
Tu geres son CRM Dodey connecte a Notion.
Sources: CAKM (locaux Airbnb avec Kevin, 2 commissions: honoraires + retrocession 10%), HOMELOOP (leads entrants), Perso.
Inter-agence = case separee, applicable uniquement a CAKM ou Perso.

STATUTS EXACTS a utiliser: "A prospecter", "No show", "Prospecte", "Estimation a envoyer", "Estimation faite", "Mandat signe", "En ligne", "Compromis", "Vendu", "Cloture"

REGLES IMPORTANTES:
- Quand source = CAKM ou Perso et pas mentionne, demande si inter-agence
- Contact et telephone = CREATE_CONTACT separe, JAMAIS dans Notes du bien
- Notes du bien = uniquement infos sur le bien (caracteristiques, remarques)
- Statut par defaut si visite = "Prospecte", si nouveau = "A prospecter"

Reponds UNIQUEMENT en JSON valide sans markdown:
{
  "reply": "reponse courte et utile en francais",
  "actions": [],
  "questions": []
}

Types d'actions:
CREATE_BIEN: {"type":"CREATE_BIEN","data":{"adresse":"adresse complete avec ville et code postal","source":"CAKM|HOMELOOP|Perso","statut":"A prospecter","interAgence":false,"notes":null,"prixEstimation":null,"prixMandat":null,"honorairesEstimes":null,"honorairesReels":null,"honorairesCakm":null,"retrocessionCakm":null}}
CREATE_CONTACT: {"type":"CREATE_CONTACT","data":{"nom":"Prenom Nom","tel":"0600000000","email":null,"type":"Vendeur|Acheteur|Investisseur|Agent","budget":null,"notes":null}}
UPDATE_BIEN: {"type":"UPDATE_BIEN","data":{"id":"id_notion","statut":"...","notes":null}}

Si info manquante: mets dans "questions".
Si pas d'action: "actions":[]`

    const groqMessages = [
      { role: 'system', content: system },
      ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
    ]

    const raw = await callGroq(groqMessages)
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
    if (created > 0) reply += '\n\n✓ ' + created + ' fiche' + (created > 1 ? 's' : '') + ' creee' + (created > 1 ? 's' : '') + ' dans Notion.'
    if (updated > 0) reply += '\n\n✓ ' + updated + ' fiche' + (updated > 1 ? 's' : '') + ' mise' + (updated > 1 ? 's' : '') + ' a jour.'
    if (parsed.questions?.length > 0) reply += '\n\n' + parsed.questions.join('\n')

    return Response.json({ reply })
  } catch (e) {
    console.error('Kapouk error:', e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
