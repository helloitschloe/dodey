export async function POST(req) {
  try {
    const { messages } = await req.json()
    const last = messages[messages.length - 1]?.content || ''
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: `Tu es Kapouk, agent IA de Maxime, agent immobilier à Bordeaux. Tu gères son CRM Dodey. Réponds en français, sois concis et efficace. Activités: CAKM (locaux Airbnb avec Kevin), UNLOOP (leads), Perso.` }] },
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }))
        })
      }
    )
    
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Gemini error')
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Désolé, je ne comprends pas.'
    return Response.json({ reply })
  } catch (e) {
    console.error('Kapouk error:', e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
