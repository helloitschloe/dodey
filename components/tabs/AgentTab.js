'use client'
import { useState, useRef, useEffect } from 'react'

const SHORTCUTS = ['+ Nouveau bien', 'Mes visites', 'Qui rappeler ?', 'Compta du mois', 'Coller un message WA']

export default function AgentTab() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Bonjour Maxime ! Agent Kapouk à votre service 🐋\nParle-moi d'un bien, colle un message WhatsApp, ou dis-moi ce dont tu as besoin." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const newMessages = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await fetch('/api/kapouk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || "Désolé, une erreur s'est produite." }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Erreur de connexion. Réessaie." }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            {m.role === 'assistant' && (
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FF2080', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/kapouk.png" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '48% 28%' }} alt="Kapouk" />
              </div>
            )}
            <div style={{
              maxWidth: '78%', padding: '11px 15px', borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              background: m.role === 'user' ? 'var(--blue)' : 'var(--bg)',
              border: m.role === 'user' ? 'none' : '1px solid var(--line)',
              color: 'var(--text)', fontSize: 13, fontWeight: 600, lineHeight: 1.6,
              whiteSpace: 'pre-wrap', animation: 'fadeIn .2s ease'
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FF2080', flexShrink: 0, overflow: 'hidden' }}>
              <img src="/kapouk.png" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '48% 28%' }} alt="Kapouk" />
            </div>
            <div style={{ padding: '14px 18px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '4px 16px 16px 16px', display: 'flex', gap: 5 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', animation: `pulse 1.2s ease infinite ${i*0.2}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Shortcuts */}
      <div style={{ padding: '8px 16px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {SHORTCUTS.map(s => (
          <button key={s} onClick={() => send(s)} style={{
            fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 100,
            border: '1px solid var(--line)', background: 'transparent', color: 'var(--dim)',
            cursor: 'pointer', fontFamily: 'Nunito', transition: 'all .15s'
          }}
          onMouseEnter={e => { e.target.style.borderColor = 'var(--blue)'; e.target.style.color = 'var(--blue)' }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--line)'; e.target.style.color = 'var(--dim)' }}
          >{s}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Parle ou écris à Kapouk…"
          style={{
            flex: 1, background: 'var(--bg)', border: '1px solid var(--line)',
            borderRadius: 100, padding: '11px 18px', fontFamily: 'Nunito',
            fontSize: 13, fontWeight: 600, color: 'var(--text)', outline: 'none',
            transition: 'border-color .15s'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--line)'}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={{
          width: 42, height: 42, borderRadius: '50%', background: input.trim() ? 'var(--blue)' : 'var(--line)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background .15s', flexShrink: 0
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
