import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_TOKEN })

// ── Biens ──────────────────────────────────────────────────
export async function getBiens() {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_BIENS_DB,
    sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    page_size: 100,
  })
  return res.results.map(parseBien)
}

export async function createBien(data) {
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_BIENS_DB },
    properties: {
      'Adresse': { title: [{ text: { content: data.adresse } }] },
      'Source': { select: { name: data.source || 'Inconnu' } },
      'Statut': { select: { name: data.statut || 'Détecté' } },
      'Prix demandé': data.prix ? { number: data.prix } : undefined,
      'Notes': data.notes ? { rich_text: [{ text: { content: data.notes } }] } : undefined,
    }
  })
}

export async function updateBien(id, data) {
  const props = {}
  if (data.statut) props['Statut'] = { select: { name: data.statut } }
  if (data.prix) props['Prix demandé'] = { number: data.prix }
  if (data.notes) props['Notes'] = { rich_text: [{ text: { content: data.notes } }] }
  if (data.resumeIA) props['Résumé IA'] = { rich_text: [{ text: { content: data.resumeIA } }] }
  return notion.pages.update({ page_id: id, properties: props })
}

function parseBien(page) {
  const p = page.properties
  return {
    id: page.id,
    adresse: p['Nom']?.title?.[0]?.plain_text || '—',
    source: p['Source']?.select?.name || 'Inconnu',
    statut: p['Statut']?.select?.name || 'Détecté',
    prix: p['Prix demandé']?.number || null,
    notes: p['Notes']?.rich_text?.[0]?.plain_text || '',
    resumeIA: p['Résumé IA']?.rich_text?.[0]?.plain_text || '',
    createdAt: page.created_time,
  }
}

// ── Contacts ───────────────────────────────────────────────
export async function getContacts() {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_CONTACTS_DB,
    sorts: [{ timestamp: "created_time", direction: 'ascending' }],
    page_size: 100,
  })
  return res.results.map(parseContact)
}

export async function createContact(data) {
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_CONTACTS_DB },
    properties: {
      'Nom': { title: [{ text: { content: data.nom } }] },
      'Téléphone': data.tel ? { phone_number: data.tel } : undefined,
      'Email': data.email ? { email: data.email } : undefined,
      'Type': data.type ? { select: { name: data.type } } : undefined,
      'Budget': data.budget ? { number: data.budget } : undefined,
    }
  })
}

function parseContact(page) {
  const p = page.properties
  return {
    id: page.id,
    nom: p['Nom']?.title?.[0]?.plain_text || '—',
    tel: p['Téléphone']?.phone_number || '',
    email: p['Email']?.email || '',
    type: p['Type']?.select?.name || '',
    budget: p['Budget']?.number || null,
    prochainRappel: p['Prochain rappel']?.date?.start || null,
    dernierContact: p['Dernier contact']?.date?.start || null,
    resumeIA: p['Résumé IA']?.rich_text?.[0]?.plain_text || '',
  }
}

// ── Visites ────────────────────────────────────────────────
export async function createVisite(data) {
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_VISITES_DB },
    properties: {
      'Titre': { title: [{ text: { content: `Visite — ${data.bien}` } }] },
      'Date': { date: { start: data.date } },
      'Compte-rendu': data.cr ? { rich_text: [{ text: { content: data.cr } }] } : undefined,
    }
  })
}

// ── Comptabilité ───────────────────────────────────────────
export async function getCompta() {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_COMPTA_DB,
    sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    page_size: 50,
  })
  return res.results.map(parseCompta)
}

function parseCompta(page) {
  const p = page.properties
  return {
    id: page.id,
    libelle: p['Libellé']?.title?.[0]?.plain_text || '—',
    montantHT: p['Montant HT']?.number || 0,
    statut: p['Statut paiement']?.select?.name || 'En attente',
    dateEncaissement: p['Date encaissement']?.date?.start || null,
    partMaxime: p['% part Maxime']?.number || 100,
  }
}
