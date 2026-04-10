'use client'
import { useState, useEffect } from 'react'

const STATUT_STYLE = {
  'Encaissé': { bg: 'var(--gdim)', color: 'var(--green)', border: 'var(--gmid)' },
  'En attente': { bg: 'var(--bdim)', color: 'var(--blue)', border: 'var(--bmid)' },
  'À facturer': { bg: 'var(--pdim)', color: 'var(--pink)', border: 'var(--pmid)' },
}

export default function ComptaTab() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notion?type=compta')
      .then(r => r.json())
      .then(data => { setEntries(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalHT = entries.reduce((s, e) => s + (e.montantHT * e.partMaxime / 100), 0)
  const encaisse = entries.filter(e => e.statut === 'Encaissé').reduce((s, e) => s + (e.montantHT * e.partMaxime / 100), 0)
  const enAttente = entries.filter(e => e.statut !== 'Encaissé').reduce((s, e) => s + (e.montantHT * e.partMaxime / 100), 0)
  const aFacturer = entries.filter(e => e.statut === 'À facturer').length

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      <div style={{ padding: 16 }}>

        {/* Résumé chiffré */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <SumCard label="Total HT (ma part)" value={`${totalHT.toLocaleString('fr-FR')} €`} color="var(--text)" />
          <SumCard label="Encaissé" value={`${encaisse.toLocaleString('fr-FR')} €`} color="var(--green)" />
          <SumCard label="En attente" value={`${enAttente.toLocaleString('fr-FR')} €`} color="var(--blue)" />
          <SumCard label="À facturer" value={`${aFacturer} commission${aFacturer > 1 ? 's' : ''}`} color="var(--pink)" alert={aFacturer > 0} />
        </div>

        {/* Alerte si à facturer */}
        {aFacturer > 0 && (
          <div style={{ background: 'var(--pdim)', border: '1px solid var(--pmid)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--pink)' }}>{aFacturer} facture{aFacturer > 1 ? 's' : ''} à émettre</div>
              <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>Dis à Kapouk pour préparer les détails</div>
            </div>
          </div>
        )}

        {/* Liste */}
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Toutes les commissions
        </div>

        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>💶</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Aucune entrée comptable</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entries.map(e => {
              const style = STATUT_STYLE[e.statut] || STATUT_STYLE['En attente']
              const maPartHT = e.montantHT * e.partMaxime / 100
              return (
                <div key={e.id} style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{e.libelle}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--blue)' }}>{maPartHT.toLocaleString('fr-FR')} €</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>{e.statut}</span>
                    {e.partMaxime < 100 && <span style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 700 }}>Ma part : {e.partMaxime}%</span>}
                    {e.dateEncaissement && <span style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 700, marginLeft: 'auto' }}>{new Date(e.dateEncaissement).toLocaleDateString('fr-FR')}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function SumCard({ label, value, color, alert }) {
  return (
    <div style={{ background: alert ? 'var(--pdim)' : 'var(--card)', border: `1px solid ${alert ? 'var(--pmid)' : 'var(--line)'}`, borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
    </div>
  )
}
