'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'

const AgentTab  = dynamic(() => import('@/components/tabs/AgentTab'),  { ssr: false })
const BiensTab  = dynamic(() => import('@/components/tabs/BiensTab'),  { ssr: false })
const CarteTab  = dynamic(() => import('@/components/tabs/CarteTab'),  { ssr: false })
const ClientsTab= dynamic(() => import('@/components/tabs/ClientsTab'),{ ssr: false })
const ComptaTab = dynamic(() => import('@/components/tabs/ComptaTab'), { ssr: false })

const TABS = [
  { id: 'agent',   label: 'Agent',   icon: <IconAgent /> },
  { id: 'carte',   label: 'Carte',   icon: <IconCarte /> },
  { id: 'biens',   label: 'Biens',   icon: <IconBiens /> },
  { id: 'clients', label: 'Clients', icon: <IconClients /> },
  { id: 'compta',  label: 'Compta',  icon: <IconCompta /> },
]

export default function App() {
  const [tab, setTab] = useState('agent')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 640, margin: '0 auto', background: 'var(--bg)' }}>

      {/* ── HEADER ── */}
      <header style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FF2080', overflow: 'hidden', flexShrink: 0 }}>
            <img src="/kapouk.png" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '48% 28%' }} alt="Kapouk" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, color: '#fff', lineHeight: 1 }}>DODEY</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#FF2080', letterSpacing: 1, marginTop: 2 }}>Agent Kapouk</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gdim)', border: '1px solid var(--gmid)', borderRadius: 100, padding: '5px 12px', fontSize: 10, fontWeight: 800, color: 'var(--green)', letterSpacing: 1 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
          ACTIF
        </div>
      </header>

      {/* ── CONTENU ── */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'hidden', display: tab === 'agent'   ? 'flex' : 'none', flexDirection: 'column' }}><AgentTab /></div>
        <div style={{ flex: 1, overflow: 'hidden', display: tab === 'carte'   ? 'flex' : 'none', flexDirection: 'column' }}><CarteTab /></div>
        <div style={{ flex: 1, overflow: 'hidden', display: tab === 'biens'   ? 'flex' : 'none', flexDirection: 'column' }}><BiensTab /></div>
        <div style={{ flex: 1, overflow: 'hidden', display: tab === 'clients' ? 'flex' : 'none', flexDirection: 'column' }}><ClientsTab /></div>
        <div style={{ flex: 1, overflow: 'hidden', display: tab === 'compta'  ? 'flex' : 'none', flexDirection: 'column' }}><ComptaTab /></div>
      </main>

      {/* ── NAVIGATION BAS ── */}
      <nav style={{ borderTop: '1px solid var(--line)', display: 'flex', flexShrink: 0, background: 'var(--card)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer', transition: 'all .15s',
            color: tab === t.id ? 'var(--blue)' : 'var(--muted)'
          }}>
            <div style={{ transition: 'transform .15s', transform: tab === t.id ? 'scale(1.1)' : 'scale(1)' }}>{t.icon}</div>
            <span style={{ fontSize: 10, fontWeight: tab === t.id ? 800 : 700, letterSpacing: .3, fontFamily: 'Nunito' }}>{t.label}</span>
            {tab === t.id && <div style={{ width: 16, height: 2, borderRadius: 1, background: 'var(--blue)', marginTop: -2 }} />}
          </button>
        ))}
      </nav>
    </div>
  )
}

// ── ICONES ────────────────────────────────────────────────────────────
function IconAgent() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
}
function IconCarte() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 018 8c0 5.25-8 13-8 13S4 15.25 4 10a8 8 0 018-8z"/>
  </svg>
}
function IconBiens() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
  </svg>
}
function IconClients() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
}
function IconCompta() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
}
