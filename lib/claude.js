import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const KAPOUK_SYSTEM = `Tu es Kapouk, l'agent IA de Maxime Pichon, agent immobilier et directeur à Bordeaux.

Tu gères son CRM immobilier Dodey. Tu es son assistant personnel ultra-efficace.
Tu comprends le langage naturel, les messages copiés-collés, les dictées vocales.
Tu agis immédiatement sans redemander de confirmation sauf ambiguïté réelle.

Les 3 activités de Maxime :
- CAKM : Vente de locaux commerciaux à investisseurs Airbnb. Partenaire Kevin.
- UNLOOP : Leads entrants qualifiés.
- Perso/hors-mandat : Particuliers, inter-agence.

Règles : antidatage respecté, mandats inter-agence 50/50, jamais verbeux.
Réponds TOUJOURS en français, de façon concise et efficace.`

export async function askKapouk(messages, context = '') {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: context ? KAPOUK_SYSTEM + '\n\n' + context : KAPOUK_SYSTEM,
  })

  const userMessages = messages.filter(m => m.role === 'user')
  const lastMessage = userMessages[userMessages.length - 1]?.content || ''

  const history = []
  for (let i = 0; i < messages.length - 1; i++) {
    const m = messages[i]
    if (m.role === 'user') {
      history.push({ role: 'user', parts: [{ text: m.content }] })
    } else if (m.role === 'assistant') {
      history.push({ role: 'model', parts: [{ text: m.content }] })
    }
  }

  const chat = model.startChat({ history })
  const result = await chat.sendMessage(lastMessage)
  return result.response.text()
}
