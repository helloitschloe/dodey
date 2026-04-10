async function callGemini(contents, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
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
Activites: CAKM (locaux Airbnb + retrocession 10%), HOMELOOP (leads), Inter-agence, Perso.

Reponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou apres:
{"reply":"ta reponse courte en francais","biens":[{"adresse":"adresse complete","source":"CAKM ou HOMELOOP ou Inter-agence ou Perso","statut":"Detecte ou Visite ou En cours","prix":null,"notes":"notes utiles"}],"contacts":[]}

Si pas de bien a creer: "biens":[]
Si pas de contact: "contacts":[]`

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: '{"reply":"Compris, je suis Kapouk.","biens":[],"contacts":[]}' }] },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    ]

    const raw = await callGemini(contents, process.env.GEMINI_API_KEY)
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed = { reply: clean, biens: [], contacts: [] }
    try {
      parsed = JSON.parse(clean)
    } catch(e) {
      parsed.reply = clean
    }

    let created = 0
    for (const bien of (parsed.biens || [])) {
      if (!bien.adresse) continue
      const props = {
        'Nom': { title: [{ text: { content: bien.adresse } }] }
      }
      if (bien.source) props['Source mandat'] = { select: { name: bien.source } }
      if (bien.statut) props['Statut'] = { select: { name: bien.statut } }
      if (bien.prix) props['Prix demand\u00e9'] = { number: Number(bien.prix) }
      if (bien.notes) props['Notes'] = { rich_text: [{ text: { content: bien.notes } }] }

      const r = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          parent: { database_id: process.env.NOTION_BIENS_DB },
          properties: props
        })
      })
      if (r.ok) created++
    }

    const reply = created > 0
      ? `${parsed.reply}\n\n✓ ${created} fiche${created > 1 ? 's' : ''} dans Notion.`
      : parsed.reply

    return Response.json({ reply })

  } catch (e) {
    console.error('Kapouk error:', e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
