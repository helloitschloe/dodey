export async function POST(req) {
  try {
    const { messages } = await req.json()
    const last = messages[messages.length - 1]?.content || ''

    // 1. On demande à Gemini d'analyser l'intention ET de répondre en JSON
    const systemPrompt = `Tu es Kapouk, agent IA de Maxime Pichon, agent immobilier à Bordeaux.
Tu gères son CRM Dodey connecté à Notion.
Activités: CAKM (locaux Airbnb avec Kevin + rétrocession 10%), HOMELOOP (leads), Inter-agence, Perso.

IMPORTANT: Tu dois répondre UNIQUEMENT en JSON valide avec ce format:
{
  "reply": "ta réponse en français à Maxime",
  "action": null ou "CREATE_BIEN" ou "CREATE_CONTACT",
  "data": {} 
}

Si Maxime veut ajouter/créer un bien immobilier, action = "CREATE_BIEN" et data contient:
{
  "adresse": "...",
  "source": "CAKM" ou "HOMELOOP" ou "Inter-agence" ou "Perso",
  "statut": "Détecté" ou "Visité" ou "En cours" etc,
  "prix": nombre ou null,
  "notes": "..." ou null
}

Si Maxime veut ajouter un contact/client, action = "CREATE_CONTACT" et data contient:
{
  "nom": "...",
  "tel": "..." ou null,
  "email": "..." ou null,
  "type": "Acheteur" ou "Propriétaire" ou "Investisseur" ou "Agent",
  "budget": nombre ou null
}

Sinon action = null et data = {}.
Réponds toujours en français dans "reply", sois concis et efficace.`

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: '{"reply": "Compris, je suis Kapouk.", "action": null, "data": {}}' }] },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    ]

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents }) }
    )
    const geminiData = await geminiRes.json()
    if (!geminiRes.ok) throw new Error(geminiData.error?.message || 'Gemini error')
    
    let rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    let parsed = { reply: rawText, action: null, data: {} }
    try { parsed = JSON.parse(rawText) } catch(e) {}

    // 2. Si action détectée → appel Notion
    if (parsed.action === 'CREATE_BIEN' && parsed.data?.adresse) {
      const notionRes = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          parent: { database_id: process.env.NOTION_BIENS_DB },
          properties: {
            'Adresse': { title: [{ text: { content: parsed.data.adresse } }] },
            ...(parsed.data.source && { 'Source mandat': { select: { name: parsed.data.source } } }),
            ...(parsed.data.statut && { 'Statut': { select: { name: parsed.data.statut } } }),
            ...(parsed.data.prix && { 'Prix demandé': { number: parsed.data.prix } }),
            ...(parsed.data.notes && { 'Notes': { rich_text: [{ text: { content: parsed.data.notes } }] } }),
          }
        })
      })
      if (!notionRes.ok) {
        const err = await notionRes.json()
        console.error('Notion error:', err)
      }
    }

    if (parsed.action === 'CREATE_CONTACT' && parsed.data?.nom) {
      const notionRes = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          parent: { database_id: process.env.NOTION_CONTACTS_DB },
          properties: {
            'Nom': { title: [{ text: { content: parsed.data.nom } }] },
            ...(parsed.data.tel && { 'Téléphone': { phone_number: parsed
git add . && git commit -m "feat: kapouk writes to notion" && git push
cd ~/Downloads/dodey && sed -i '' 's/let parsed = { reply: rawText, action: null, data: {} }/console.log("GEMINI RAW:", rawText); let parsed = { reply: rawText, action: null, data: {} }/g' app/api/kapouk/route.js && git add . && git commit -m "debug: log gemini raw" && git push
cd ~/Downloads/dodey
cat > app/api/kapouk/route.js << 'EOF'
async function callGemini(contents, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents }) }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Gemini error')
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function notionCreate(token, dbId, properties) {
  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
    body: JSON.stringify({ parent: { database_id: dbId }, properties })
  })
  return res.ok
}

export async function POST(req) {
  try {
    const { messages } = await req.json()

    // Étape 1 : Kapouk répond à Maxime
    const conversationContents = [
      { role: 'user', parts: [{ text: `Tu es Kapouk, agent IA de Maxime, agent immobilier à Bordeaux. Tu gères son CRM. Activités: CAKM, HOMELOOP, Inter-agence, Perso. Réponds en français, sois concis.` }] },
      { role: 'model', parts: [{ text: 'Compris, je suis Kapouk.' }] },
      ...messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
    ]
    const reply = await callGemini(conversationContents, process.env.GEMINI_API_KEY)

    // Étape 2 : Extraire les données en JSON
    const lastMsg = messages[messages.length - 1]?.content || ''
    const extractContents = [
      { role: 'user', parts: [{ text: `Analyse ce message d'un agent immobilier et extrait les données en JSON.
Message: "${lastMsg}"

Réponds UNIQUEMENT avec du JSON valide, rien d'autre.
Si le message parle d'un ou plusieurs biens immobiliers à ajouter/créer/enregistrer, format:
{"biens": [{"adresse": "...", "source": "CAKM|HOMELOOP|Inter-agence|Perso", "statut": "Détecté|Visité|En cours", "prix": null_ou_nombre, "notes": "..."}]}

Si pas de bien à créer: {"biens": []}` }] }
    ]
    
    let biens = []
    try {
      const jsonText = await callGemini(extractContents, process.env.GEMINI_API_KEY)
      const clean = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(clean)
      biens = parsed.biens || []
    } catch(e) {}

    // Étape 3 : Créer dans Notion
    for (const bien of biens) {
      if (!bien.adresse) continue
      await notionCreate(process.env.NOTION_TOKEN, process.env.NOTION_BIENS_DB, {
        'Adresse': { title: [{ text: { content: bien.adresse } }] },
        ...(bien.source && { 'Source mandat': { select: { name: bien.source } } }),
        ...(bien.statut && { 'Statut': { select: { name: bien.statut } } }),
        ...(bien.prix && { 'Prix demandé': { number: Number(bien.prix) } }),
        ...(bien.notes && { 'Notes': { rich_text: [{ text: { content: bien.notes } }] } }),
      })
    }

    const nb = biens.filter(b => b.adresse).length
    const finalReply = nb > 0 ? `${reply}\n\n✓ ${nb} fiche${nb > 1 ? 's' : ''} créée${nb > 1 ?
git add . && git commit -m "feat: kapouk 2-step notion writer" && git push
cd ~/Downloads/dodey
cat > app/api/kapouk/route.js << 'EOF'
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

    const systemPrompt = `Tu es Kapouk, agent IA de Maxime, agent immobilier à Bordeaux.
Tu gères son CRM Dodey connecté à Notion.
Activités: CAKM (locaux Airbnb + rétrocession 10%), HOMELOOP (leads), Inter-agence, Perso.

Réponds UNIQUEMENT en JSON valide avec ce format exact:
{
  "reply": "ta réponse courte en français",
  "biens": [],
  "contacts": []
}

Si Maxime mentionne des biens à enregistrer, remplis "biens" avec:
[{"adresse": "adresse complète", "source": "CAKM ou HOMELOOP ou Inter-agence ou Perso", "statut": "Détecté ou Visité ou En cours", "prix": null_ou_nombre, "notes": "notes utiles"}]

Si pas de bien: "biens": []
Si pas de contact: "contacts": []

IMPORTANT: JSON uniquement, pas de markdown, pas de texte avant ou après.`

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: '{"reply":"Compris.","biens":[],"contacts":[]}' }] },
      ...messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
    ]

    const raw = await callGemini(contents, process.env.GEMINI_API_KEY)
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    let parsed = { reply: 'Compris.', biens: [], contacts: [] }
    try { parsed = JSON.parse(clean) } catch(e) { parsed.reply = clean }

    // Créer les biens dans Notion
    let created = 0
    for (const bien of (parsed.biens || [])) {
      if (!bien.adresse) continue
      const props = {
        'Adresse': { title: [{ text: { content: bien.adresse } }] }
      }
      if (bien.source) props['Source mandat'] = { select: { name: bien.source } }
      if (bien.statut) props['Statut'] = { select: { name: bien.statut } }
      if (bien.prix) props['Prix demandé'] = { number: Number(bien.prix) }
      if (bien.notes) props['Notes'] = { rich_text: [{ text: { content: bien.notes } }] }
      
      const r = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.NOTION_TOKEN}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
        body: JSON.stringify({ parent: { database_id: process.env.NOTION_BIENS_DB }, properties: props })
      })
      if (r.ok) created++
    }

    const reply = created > 0
      ? `${parsed.reply}\n\n✓ ${created} fiche${created > 1 ? 's' : ''} créée${created > 1 ? 's' : ''} dans Notion.`
      : parsed.reply

    return Response.json({ reply })
  } catch (e) {
    console.error('Kapouk error:', e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
