'use client'
import { useState, useEffect } from 'react'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function urgenceRappel(date) {
  if (!date) return 'none'
  const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return 'late'
  if (diff < 2) return 'urgent'
  if (diff < 7) return 'soon'
  return 'ok'
}

export default function ClientsTab() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('tous')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/notion?type=contacts')
      .then(r => r.json())
      .then(data => { setContacts(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = view === 'rappeler'
    ? contacts.filter(c => c.prochainRappel).sort((a, b) => new Date(a.prochainRappel) - new Date(b.prochainRappel))
    : contacts

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--dim)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 12, fontWeight: 700 }}>Chargement des contacts…</div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Filtres */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 8, borderBottom: '1px solid var(--line)' }}>
        {[['tous', 'Tous les contacts'], ['rappeler', '⏰ À rappeler']].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            fontSize: 11, fontWeight: 800, padding: '5px 14px', borderRadius: 100,
            border: `1.5px solid ${view === v ? 'var(--blue)' : 'var(--line)'}`,
            background: view === v ? 'var(--bdim)' : 'transparent',
            color: view === v ? 'var(--blue)' : 'var(--dim)', cursor: 'pointer', fontFamily: 'Nunito'
          }}>{label}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: 'var(--muted)', alignSelf: 'center' }}>{filtered.length} contact{filtered.length > 1 ? 's' : ''}</span>
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '60px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Aucun contact</div>
            <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 6 }}>Dis à Kapouk d'en ajouter</div>
          </div>
        ) : filtered.map(c => {
          const urgence = urgenceRappel(c.prochainRappel)
          const urgenceColor = { late: 'var(--pink)', urgent: '#FF9F0A', soon: 'var(--blue)', ok: 'var(--green)', none: 'var(--muted)' }[urgence]
          return (
            <div key={c.id} onClick={() => setSelected(c)} style={{
              background: 'var(--card)', border: `1px solid ${urgence === 'late' ? 'var(--pmid)' : 'var(--line)'}`,
              borderRadius: 14, padding: '12px 16px', cursor: 'pointer', transition: 'border-color .15s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = urgence === 'late' ? 'var(--pmid)' : 'var(--line)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{c.nom}</div>
                {c.type && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: 'var(--bdim)', color: 'var(--blue)', border: '1px solid var(--bmid)' }}>{c.type}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {c.tel && <span style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 600 }}>{c.tel}</span>}
                {c.budget && <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--blue)' }}>Budget {(c.budget/1000).toFixed(0)}k€</span>}
                {c.prochainRappel && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: urgenceColor }}>
                    {urgence === 'late' ? '⚠ ' : ''}Rappel {formatDate(c.prochainRappel)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Fiche contact */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000CC', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxHeight: '75vh', background: 'var(--card)', borderRadius: '20px 20px 0 0', padding: 24, overflow: 'auto', animation: 'fadeIn .2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{selected.nom}</div>
                {selected.type && <div style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 800, marginTop: 4 }}>{selected.type}</div>}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'var(--line)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: 'var(--dim)', cursor: 'pointer', fontSize: 16, fontFamily: 'Nunito' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selected.tel && <InfoRow label="Téléphone" value={selected.tel} link={`tel:${selected.tel}`} />}
              {selected.email && <InfoRow label="Email" value={selected.email} link={`mailto:${selected.email}`} />}
              {selected.budget && <InfoRow label="Budget" value={`${(selected.budget/1000).toFixed(0)} 000 €`} />}
              {selected.prochainRappel && <InfoRow label="Prochain rappel" value={formatDate(selected.prochainRappel)} />}
              {selected.dernierContact && <InfoRow label="Dernier contact" value={formatDate(selected.dernierContact)} />}
            </div>
            {selected.resumeIA && (
              <div style={{ marginTop: 16, background: 'var(--bdim)', border: '1px solid var(--bmid)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Résumé Kapouk</div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{selected.resumeIA}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, link }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--line)' }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, minWidth: 100 }}>{label}</span>
      {link ? (
        <a href={link} style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', textDecoration: 'none' }}>{value}</a>
      ) : (
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{value}</span>
      )}
    </div>
  )
}
