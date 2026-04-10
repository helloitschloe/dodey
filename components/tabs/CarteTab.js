'use client'
import { useState, useEffect } from 'react'

const STATUT_COLORS = {
  'Détecté': '#8890C0', 'En cours': '#1A6FFF', 'Visité': '#FF9F0A',
  'Offre': '#FF2080', 'Compromis': '#AF52DE', 'Signé': '#39FF14',
  'Clôturé': '#30D158', 'Abandonné': '#636366'
}

export default function CarteTab() {
  const [biens, setBiens] = useState([])
  const [selected, setSelected] = useState(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

  useEffect(() => {
    fetch('/api/notion?type=biens')
      .then(r => r.json())
      .then(data => setBiens(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Adresses Bordeaux pour l'affichage
  const bordeaux = encodeURIComponent('Bordeaux, France')
  const mapsUrl = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${bordeaux}&zoom=13`
    : `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d45244!2d-0.5792!3d44.8378!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd5527e8f751ca81%3A0x796386037b397a89!2sBordeaux!5e0!3m2!1sfr!2sfr!4v1234567890`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Légende statuts */}
      <div style={{ padding: '10px 16px', display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--line)' }}>
        {Object.entries(STATUT_COLORS).map(([s, c]) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--dim)' }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Carte */}
      <div style={{ flex: 1, position: 'relative' }}>
        <iframe
          src={mapsUrl}
          style={{ width: '100%', height: '100%', border: 'none', filter: 'invert(90%) hue-rotate(180deg)' }}
          allowFullScreen
          loading="lazy"
          title="Carte Bordeaux"
        />

        {/* Overlay biens sur la carte (placeholder visuel) */}
        {biens.length > 0 && (
          <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 14px', maxWidth: 200 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{biens.length} biens</div>
            {biens.slice(0, 5).map(b => (
              <div key={b.id} onClick={() => setSelected(b)} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, cursor: 'pointer' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUT_COLORS[b.statut] || '#888', flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.adresse.split(',')[0]}</span>
              </div>
            ))}
            {biens.length > 5 && <div style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 700 }}>+{biens.length - 5} autres</div>}
          </div>
        )}
      </div>

      {/* Fiche au clic */}
      {selected && (
        <div style={{ background: 'var(--card)', borderTop: '1px solid var(--line)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{selected.adresse}</div>
            <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>{selected.statut} · {selected.prix ? `${(selected.prix/1000).toFixed(0)}k€` : '—'}</div>
          </div>
          <a href={`https://maps.google.com/?q=${encodeURIComponent(selected.adresse + ', Bordeaux')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 800, color: 'var(--blue)', textDecoration: 'none', padding: '6px 14px', border: '1px solid var(--bmid)', borderRadius: 100, background: 'var(--bdim)' }}>
            Ouvrir Maps ↗
          </a>
          <button onClick={() => setSelected(null)} style={{ background: 'var(--line)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: 'var(--dim)', cursor: 'pointer', fontSize: 14, fontFamily: 'Nunito' }}>✕</button>
        </div>
      )}
    </div>
  )
}
