import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_TOKEN })

function txt(str) { return { rich_text: [{ text: { content: str || '' } }] } }
function ttl(str) { return { title: [{ text: { content: str || '' } }] } }
function sel(str) { return str ? { select: { name: str } } : undefined }
function num(n) { return n != null && n !== '' ? { number: Number(n) } : undefined }
function dat(d) { return d ? { date: { start: d } } : undefined }
function chk(b) { return { checkbox: Boolean(b) } }
function today() { return new Date().toLocaleDateString('fr-CA') }

async function geocode(adresse) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(adresse + ', France')}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.results?.[0]) {
      const { lat, lng } = data.results[0].geometry.location
      return { lat, lng }
    }
  } catch(e) {}
  return null
}

export async function getBiens() {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_BIENS_DB,
    sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    page_size: 100,
  })
  return res.results.map(parseBien)
}

export async function createBien(data) {
  const gps = data.adresse ? await geocode(data.adresse) : null
  const props = { 'Adresse': ttl(data.adresse) }
  if (data.source) props['Source'] = sel(data.source)
  if (data.statut) props['Statut'] = sel(data.statut)
  else props['Statut'] = sel('A prospecter')
  if (data.interAgence != null) props['Inter-agence'] = chk(data.interAgence)
  if (data.notes) props['Notes'] = txt(data.notes)
  if (data.prixEstimation) props['Prix estimation'] = num(data.prixEstimation)
  if (data.prixMandat) props['Prix mandat'] = num(data.prixMandat)
  if (data.prixCompromis) props['Prix compromis'] = num(data.prixCompromis)
  if (data.honorairesEstimes) props['Honoraires estimes'] = num(data.honorairesEstimes)
  if (data.honorairesReels) props['Honoraires reels'] = num(data.honorairesReels)
  if (data.honorairesCakm) props['Honoraires CAKM'] = num(data.honorairesCakm)
  if (data.retrocessionCakm) props['retrocession CAKM'] = num(data.retrocessionCakm)
  if (gps) { props['Latitude'] = num(gps.lat); props['Longitude'] = num(gps.lng) }
  props['Date de creation'] = dat(today())
  return notion.pages.create({ parent: { database_id: process.env.NOTION_BIENS_DB }, properties: props })
}

export async function updateBien(id, data) {
  const props = {}
  if (data.statut) {
    props['Statut'] = sel(data.statut)
    const dateMap = {
      'No show': 'Date no show',
      'Prospecte': 'Date de prospection',
      'Mandat signe': 'Date mandat signe',
      'En ligne': 'Date mise en ligne',
      'Compromis': 'Date du compromis',
      'Vendu': 'Date vente',
      'Cloture': 'Date cloture',
    }
    if (dateMap[data.statut]) props[dateMap[data.statut]] = dat(today())
  }
  if (data.notes) props['Notes'] = txt(data.notes)
  if (data.prixEstimation) props['Prix estimation'] = num(data.prixEstimation)
  if (data.prixMandat) props['Prix mandat'] = num(data.prixMandat)
  if (data.prixCompromis) props['Prix compromis'] = num(data.prixCompromis)
  if (data.honorairesEstimes) props['Honoraires estimes'] = num(data.honorairesEstimes)
  if (data.honorairesReels) props['Honoraires reels'] = num(data.honorairesReels)
  if (data.honorairesCakm) props['Honoraires CAKM'] = num(data.honorairesCakm)
  if (data.retrocessionCakm) props['retrocession CAKM'] = num(data.retrocessionCakm)
  if (data.resumeIA) props['Resume IA Kapouk'] = txt(data.resumeIA)
  return notion.pages.update({ page_id: id, properties: props })
}

function parseBien(page) {
  const p = page.properties
  return {
    id: page.id,
    adresse: p['Adresse']?.title?.[0]?.plain_text || '',
    source: p['Source']?.select?.name || '',
    statut: p['Statut']?.select?.name || 'A prospecter',
    interAgence: p['Inter-agence']?.checkbox || false,
    notes: p['Notes']?.rich_text?.[0]?.plain_text || '',
    prixEstimation: p['Prix estimation']?.number || null,
    prixMandat: p['Prix mandat']?.number || null,
    prixCompromis: p['Prix compromis']?.number || null,
    lat: p['Latitude']?.number || null,
    lng: p['Longitude']?.number || null,
    createdAt: page.created_time,
  }
}

export async function getContacts() {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_CONTACTS_DB,
    sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    page_size: 100,
  })
  return res.results.map(parseContact)
}

export async function createContact(data) {
  const props = { 'Nom': ttl(data.nom) }
  if (data.tel) props['Telephone'] = { phone_number: data.tel }
  if (data.email) props['Email'] = { email: data.email }
  if (data.type) props['Type'] = sel(data.type)
  if (data.budget) props['Budget'] = num(data.budget)
  if (data.notes) props['Notes'] = txt(data.notes)
  return notion.pages.create({ parent: { database_id: process.env.NOTION_CONTACTS_DB }, properties: props })
}

function parseContact(page) {
  const p = page.properties
  return {
    id: page.id,
    nom: p['Nom']?.title?.[0]?.plain_text || '',
    tel: p['Telephone']?.phone_number || '',
    email: p['Email']?.email || '',
    type: p['Type']?.select?.name || '',
    budget: p['Budget']?.number || null,
    prochainRappel: p['Prochain rappel']?.date?.start || null,
  }
}

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
    libelle: p['Libelle']?.title?.[0]?.plain_text || '',
    type: p['Type']?.select?.name || '',
    montant: p['Montant']?.number || 0,
    statut: p['Statut']?.select?.name || '',
    dateEncaissement: p['Date encaissement']?.date?.start || null,
  }
}
