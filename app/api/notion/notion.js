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
  props['Statut'] = sel(data.statut || '\u00c0 prospecter')
  if (data.interAgence != null) props['Inter-agence'] = chk(data.interAgence)
  if (data.notes) props['Notes'] = txt(data.notes)
  if (data.prixEstimation) props['Prix estimation'] = num(data.prixEstimation)
  if (data.prixMandat) props['Prix mandat'] = num(data.prixMandat)
  if (data.prixCompromis) props['Prix compromis'] = num(data.prixCompromis)
  if (data.honorairesEstimes) props['Honoraires estim\u00e9s'] = num(data.honorairesEstimes)
  if (data.honorairesReels) props['Honoraires r\u00e9els'] = num(data.honorairesReels)
  if (data.honorairesCakm) props['Honoraires CAKM'] = num(data.honorairesCakm)
  if (data.retrocessionCakm) props['r\u00e9trocession CAKM'] = num(data.retrocessionCakm)
  if (gps) { props['Latitude'] = num(gps.lat); props['longitude'] = num(gps.lng) }
  props['Date de cr\u00e9ation'] = dat(today())
  return notion.pages.create({ parent: { database_id: process.env.NOTION_BIENS_DB }, properties: props })
}

export async function updateBien(id, data) {
  const props = {}
  if (data.statut) {
    props['Statut'] = sel(data.statut)
    const dateMap = {
      'No show': 'Date no show',
      'Prospect\u00e9': 'Date de prospection',
      'Mandat sign\u00e9': 'Date mandat sign\u00e9',
      'En ligne': 'Date mise en ligne',
      'Compromis': 'Date du compromis',
      'Vendu': 'Date vente',
      'Cl\u00f4tur\u00e9': 'Date cloture',
    }
    if (dateMap[data.statut]) props[dateMap[data.statut]] = dat(today())
  }
  if (data.notes) props['Notes'] = txt(data.notes)
  if (data.prixEstimation) props['Prix estimation'] = num(data.prixEstimation)
  if (data.prixMandat) props['Prix mandat'] = num(data.prixMandat)
  if (data.prixCompromis) props['Prix compromis'] = num(data.prixCompromis)
  if (data.honorairesEstimes) props['Honoraires estim\u00e9s'] = num(data.honorairesEstimes)
  if (data.honorairesReels) props['Honoraires r\u00e9els'] = num(data.honorairesReels)
  if (data.honorairesCakm) props['Honoraires CAKM'] = num(data.honorairesCakm)
  if (data.retrocessionCakm) props['r\u00e9trocession CAKM'] = num(data.retrocessionCakm)
  if (data.resumeIA) props['R\u00e9sum\u00e9 IA Kapouk'] = txt(data.resumeIA)
  return notion.pages.update({ page_id: id, properties: props })
}

function parseBien(page) {
  const p = page.properties
  return {
    id: page.id,
    adresse: p['Adresse']?.title?.[0]?.plain_text || '',
    source: p['Source']?.select?.name || '',
    statut: p['Statut']?.select?.name || '\u00c0 prospecter',
    interAgence: p['Inter-agence']?.checkbox || false,
    notes: p['Notes']?.rich_text?.[0]?.plain_text || '',
    prixEstimation: p['Prix estimation']?.number || null,
    prixMandat: p['Prix mandat']?.number || null,
    prixCompromis: p['Prix compromis']?.number || null,
    honorairesEstimes: p['Honoraires estim\u00e9s']?.number || null,
    honorairesReels: p['Honoraires r\u00e9els']?.number || null,
    honorairesCakm: p['Honoraires CAKM']?.number || null,
    retrocessionCakm: p['r\u00e9trocession CAKM']?.number || null,
    lat: p['Latitude']?.number || null,
    lng: p['longitude']?.number || null,
    resumeIA: p['R\u00e9sum\u00e9 IA Kapouk']?.rich_text?.[0]?.plain_text || '',
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
  if (data.tel) props['T\u00e9l\u00e9phone'] = { phone_number: data.tel }
  if (data.email) props['E-mail'] = { email: data.email }
  if (data.type) props['S\u00e9lectionner'] = sel(data.type)
  if (data.budget) props['Budget'] = num(data.budget)
  if (data.notes) props['Notes'] = txt(data.notes)
  return notion.pages.create({ parent: { database_id: process.env.NOTION_CONTACTS_DB }, properties: props })
}

function parseContact(page) {
  const p = page.properties
  return {
    id: page.id,
    nom: p['Nom']?.title?.[0]?.plain_text || '',
    tel: p['T\u00e9l\u00e9phone']?.phone_number || '',
    email: p['E-mail']?.email || '',
    type: p['S\u00e9lectionner']?.select?.name || '',
    budget: p['Budget']?.number || null,
    notes: p['Notes']?.rich_text?.[0]?.plain_text || '',
    prochainAppel: p['Prochain appel']?.date?.start || null,
    dernierContact: p['Dernier contact']?.date?.start || null,
    resumeIA: p['R\u00e9sum\u00e9 IA KApouk']?.rich_text?.[0]?.plain_text || '',
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

export async function createCompta(data) {
  const props = { 'Lib\u00e9ll\u00e9': ttl(data.libelle) }
  if (data.type) props['Type'] = sel(data.type)
  if (data.montant) props['Montant'] = num(data.montant)
  if (data.statut) props['Statut'] = sel(data.statut)
  if (data.notes) props['Notes'] = txt(data.notes)
  return notion.pages.create({ parent: { database_id: process.env.NOTION_COMPTA_DB }, properties: props })
}

function parseCompta(page) {
  const p = page.properties
  return {
    id: page.id,
    libelle: p['Lib\u00e9ll\u00e9']?.title?.[0]?.plain_text || '',
    type: p['Type']?.select?.name || '',
    montant: p['Montant']?.number || 0,
    statut: p['Statut']?.select?.name || '',
    dateEncaissement: p['Date encaissement']?.date?.start || null,
  }
}
