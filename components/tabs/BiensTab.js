'use client'
import { useState, useEffect } from 'react'

const STATUTS = ['Détecté', 'En cours', 'Visité', 'Offre', 'Compromis', 'Signé', 'Clôturé', 'Abandonné']
const SOURCES = ['Tous', 'CAKM', 'UNLOOP', 'Inter-agence', 'Perso']
const STATUT_COLORS = {
  'Détecté': '#8890C0', 'En cours': '#1A6FFF', 'Visité': '#FF9F0A',
  'Offre': '#FF2080', 'Compromis': '#AF52DE', 'Signé': '#39FF14',
  'Clôturé': '#30D158', 'Abandonné': '#636366'
}

function formatPrix(n) {
  if (!n) return '—'
  return n >= 1000 ? `${(n/1000).toFixed(0)}k€` : `${n}€`
}

export default function BiensTab() {
  const [biens, setBiens] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Tous')
  const [view, setView] = useState('kanban')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/notion?type=biens')
      .then(r => r.json())
      .then(data => { setBiens(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'Tous' ? biens : biens.filter(b => b.source === filter)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--dim)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 12, fontWeight: 700 }}>Chargement des biens…</div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Filtres */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--line)' }}>
        {SOURCES.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            fontSize: 11, fontWeight: 800, padding: '5px 14px', borderRadius: 100,
            border: `1.5px solid ${filter === s ? 'var(--blue)' : 'var(--line)'}`,
            background: filter === s ? 'var(--bdim)' : 'transparent',
            color: filter === s ? 'var(--blue)' : 'var(--dim)', cursor: 'pointer', fontFamily: 'Nunito'
          }}>{s}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {['kanban', 'liste'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 100,
              border: `1.5px solid ${view === v ? 'var(--blue)' : 'var(--line)'}`,
              background: view === v ? 'var(--bdim)' : 'transparent',
              color: view === v ? 'var(--blue)' : 'var(--dim)', cursor: 'pointer', fontFamily: 'Nunito'
            }}>{v === 'kanban' ? '⬛ Kanban' : '☰ Liste'}</button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflowX: view === 'kanban' ? 'auto' : 'hidden', overflowY: 'auto', padding: 16 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '60px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏠</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Aucun bien trouvé</div>
            <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 6 }}>Dis à Kapouk d'en ajouter un</div>
          </div>
        ) : view === 'kanban' ? (
          <KanbanView biens={filtered} onSelect={setSelected} />
        ) : (
          <ListView biens={filtered} onSelect={setSelected} />
        )}
      </div>

      {/* Fiche détail */}
      {selected && <FicheDetail bien={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function KanbanView({ biens, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 12, minWidth: 'max-content' }}>
      {STATUTS.map(statut => {
        const col = biens.filter(b => b.statut === statut)
        return (
          <div key={statut} style={{ width: 220, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUT_COLORS[statut] }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: 1 }}>{statut}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', marginLeft: 'auto' }}>{col.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {col.map(b => <BienCard key={b.id} bien={b} onClick={() => onSelect(b)} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListView({ biens, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {biens.map(b => (
        <div key={b.id} onClick={() => onSelect(b)} style={{
          background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14,
          padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
          transition: 'border-color .15s'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{b.adresse}</div>
            <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>{formatPrix(b.prix)}</div>
          </div>
          <SourceTag source={b.source} />
          <div style={{ fontSize: 11, fontWeight: 800, color: STATUT_COLORS[b.statut] || 'var(--dim)', textAlign: 'right' }}>{b.statut}</div>
        </div>
      ))}
    </div>
  )
}

function BienCard({ bien, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12,
      padding: '12px', cursor: 'pointer', transition: 'border-color .15s, transform .1s'
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 6, lineHeight: 1.4 }}>{bien.adresse}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SourceTag source={bien.source} />
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--blue)' }}>{formatPrix(bien.prix)}</span>
      </div>
    </div>
  )
}

function SourceTag({ source }) {
  const colors = { CAKM: ['#EEEDFE','#3C3489'], UNLOOP: ['#E1F5EE','#085041'], 'Inter-agence': ['#FEF3E2','#7A4F00'], Perso: ['#FFF0E8','#7A3000'], Inconnu: ['#F0F0F0','#666'] }
  const [bg, color] = colors[source] || ['#F0F0F0','#666']
  return <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: bg, color }}>{source}</span>
}

function FicheDetail({ bien, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000CC', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxHeight: '80vh', background: 'var(--card)', borderRadius: '20px 20px 0 0',
        padding: 24, overflow: 'auto', animation: 'fadeIn .2s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{bien.adresse}</div>
            <div style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 800, marginTop: 4 }}>{formatPrix(bien.prix)}</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--line)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: 'var(--dim)', cursor: 'pointer', fontSize: 16, fontFamily: 'Nunito' }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <SourceTag source={bien.source} />
          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: 'var(--bdim)', color: 'var(--blue)', border: '1px solid var(--bmid)' }}>{bien.statut}</span>
        </div>
        {bien.notes && (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Notes</div>
            <div style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.6 }}>{bien.notes}</div>
          </div>
        )}
        {bien.resumeIA && (
          <div style={{ background: 'var(--bdim)', border: '1px solid var(--bmid)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Résumé Kapouk</div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{bien.resumeIA}</div>
          </div>
        )}
      </div>
    </div>
  )
}
