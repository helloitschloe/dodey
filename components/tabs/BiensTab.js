'use client'
import { useState, useEffect } from 'react'

const STATUT_COLORS = {
  'A prospecter': '#8890C0', 'No show': '#FF9F0A', 'Prospecte': '#1A6FFF',
  'Estimation a envoyer': '#AF52DE', 'Estimation faite': '#AF52DE',
  'Mandat signe': '#FF2080', 'En ligne': '#1A6FFF',
  'Compromis': '#FF2080', 'Vendu': '#39FF14', 'Cloture': '#636366',
}

const SOURCE_STYLE = {
  'CAKM': ['#EEEDFE','#3C3489'],
  'HOMELOOP': ['#E1F5EE','#085041'],
  'Perso': ['#FFF0E8','#7A3000'],
}

export default function BiensTab() {
  const [biens, setBiens] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Tous')
  const [view, setView] = useState('liste')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/notion?type=biens')
      .then(r => r.json())
      .then(data => { setBiens(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'Tous' ? biens : biens.filter(b => b.source === filter)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Filtres */}
      <div style={{ padding:'12px 16px', display:'flex', gap:6, flexWrap:'wrap', borderBottom:'1px solid var(--line)' }}>
        {['Tous','CAKM','HOMELOOP','Perso'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            fontSize:11, fontWeight:800, padding:'5px 14px', borderRadius:100, fontFamily:'Nunito',
            border:`1.5px solid ${filter===s?'var(--blue)':'var(--line)'}`,
            background:filter===s?'var(--bdim)':'transparent',
            color:filter===s?'var(--blue)':'var(--dim)', cursor:'pointer'
          }}>{s}</button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          {['kanban','liste'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              fontSize:11, fontWeight:800, padding:'5px 12px', borderRadius:100, fontFamily:'Nunito',
              border:`1.5px solid ${view===v?'var(--blue)':'var(--line)'}`,
              background:view===v?'var(--bdim)':'transparent',
              color:view===v?'var(--blue)':'var(--dim)', cursor:'pointer'
            }}>{v==='kanban'?'⬛ Kanban':'☰ Liste'}</button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div style={{ flex:1, overflow:'auto', padding:16 }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', gap:12, flexDirection:'column' }}>
            <div style={{ width:32, height:32, border:'3px solid var(--line)', borderTopColor:'var(--blue)', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
            <div style={{ fontSize:12, fontWeight:700, color:'var(--dim)' }}>Chargement…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', color:'var(--muted)', padding:'60px 0' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🏠</div>
            <div style={{ fontSize:14, fontWeight:700 }}>Aucun bien trouvé</div>
            <div style={{ fontSize:12, color:'var(--dim)', marginTop:6 }}>Dis à Kapouk d'en ajouter un</div>
          </div>
        ) : view === 'liste' ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {filtered.map(b => (
              <div key={b.id} onClick={() => setSelected(b)} style={{
                background:'var(--card)', border:'1px solid var(--line)', borderRadius:14,
                padding:'12px 16px', cursor:'pointer', transition:'border-color .15s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--blue)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--line)'}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{b.adresse || '—'}</div>
                  <SourceTag source={b.source} />
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:STATUT_COLORS[b.statut]||'#888' }} />
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--dim)' }}>{b.statut}</span>
                  {b.prixMandat && <span style={{ fontSize:11, fontWeight:800, color:'var(--blue)', marginLeft:'auto' }}>{(b.prixMandat/1000).toFixed(0)}k€</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <KanbanView biens={filtered} onSelect={setSelected} />
        )}
      </div>

      {/* Fiche detail */}
      {selected && <FicheDetail bien={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function KanbanView({ biens, onSelect }) {
  const cols = ['A prospecter','No show','Prospecte','Mandat signe','En ligne','Compromis','Vendu']
  return (
    <div style={{ display:'flex', gap:12, minWidth:'max-content' }}>
      {cols.map(statut => {
        const col = biens.filter(b => b.statut === statut)
        return (
          <div key={statut} style={{ width:200, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:STATUT_COLORS[statut]||'#888' }} />
              <span style={{ fontSize:10, fontWeight:800, color:'var(--dim)', textTransform:'uppercase', letterSpacing:1 }}>{statut}</span>
              <span style={{ fontSize:10, fontWeight:800, color:'var(--muted)', marginLeft:'auto' }}>{col.length}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {col.map(b => (
                <div key={b.id} onClick={() => onSelect(b)} style={{
                  background:'var(--card)', border:'1px solid var(--line)', borderRadius:12, padding:12, cursor:'pointer'
                }}>
                  <div style={{ fontSize:12, fontWeight:800, color:'#fff', marginBottom:6 }}>{b.adresse || '—'}</div>
                  <SourceTag source={b.source} />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SourceTag({ source }) {
  const [bg, color] = SOURCE_STYLE[source] || ['#F0F0F0','#666']
  return <span style={{ fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:100, background:bg, color }}>{source || 'Inconnu'}</span>
}

function FicheDetail({ bien, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'#000000CC', zIndex:100, display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width:'100%', maxHeight:'80vh', background:'var(--card)', borderRadius:'20px 20px 0 0',
        padding:24, overflow:'auto', animation:'fadeIn .2s ease'
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:900, color:'#fff' }}>{bien.adresse}</div>
            <div style={{ marginTop:6, display:'flex', gap:8, alignItems:'center' }}>
              <SourceTag source={bien.source} />
              <span style={{ fontSize:10, fontWeight:800, color:STATUT_COLORS[bien.statut]||'var(--dim)' }}>{bien.statut}</span>
              {bien.interAgence && <span style={{ fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:100, background:'var(--gdim)', color:'var(--green)' }}>Inter-agence</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'var(--line)', border:'none', borderRadius:'50%', width:32, height:32, color:'var(--dim)', cursor:'pointer', fontSize:16, fontFamily:'Nunito' }}>✕</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {bien.prixEstimation && <InfoRow label="Estimation" value={`${bien.prixEstimation.toLocaleString('fr-FR')} €`} />}
          {bien.prixMandat && <InfoRow label="Prix mandat" value={`${bien.prixMandat.toLocaleString('fr-FR')} €`} />}
          {bien.prixCompromis && <InfoRow label="Prix compromis" value={`${bien.prixCompromis.toLocaleString('fr-FR')} €`} />}
          {bien.honorairesEstimes && <InfoRow label="Honoraires estimés" value={`${bien.honorairesEstimes.toLocaleString('fr-FR')} €`} />}
          {bien.honorairesReels && <InfoRow label="Honoraires réels" value={`${bien.honorairesReels.toLocaleString('fr-FR')} €`} />}
          {bien.honorairesCakm && <InfoRow label="Honoraires CAKM" value={`${bien.honorairesCakm.toLocaleString('fr-FR')} €`} />}
          {bien.retrocessionCakm && <InfoRow label="Rétrocession CAKM" value={`${bien.retrocessionCakm.toLocaleString('fr-FR')} €`} />}
          {bien.notes && <InfoRow label="Notes" value={bien.notes} />}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display:'flex', gap:12, padding:'10px 14px', background:'var(--bg)', borderRadius:10, border:'1px solid var(--line)' }}>
      <span style={{ fontSize:10, fontWeight:800, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, minWidth:120 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{value}</span>
    </div>
  )
}
