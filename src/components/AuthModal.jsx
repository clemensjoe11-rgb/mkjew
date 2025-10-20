// src/components/AuthModal.jsx
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../auth/AuthContext'

export default function AuthModal({ open=false, onClose=()=>{} }){
  const { register, login } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'

  useEffect(()=>{
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return ()=>{ document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  },[open, onClose])

  if (!open) return null

  async function onSubmit(e){
    e.preventDefault()
    const email = e.target.email.value.trim()
    const password = e.target.password.value
    if (mode === 'register') await register(email, password)
    else await login(email, password)
    onClose()
  }

  const ui = (
    <>
      {/* Overlay über ALLEM */}
      <div
        className="fixed inset-0 bg-black/50 z-[10000]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal */}
      <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {mode==='register' ? 'Create account' : 'Sign in'}
            </h2>
            <button onClick={onClose} className="px-2 py-1 rounded border">Close</button>
          </div>
          <form onSubmit={onSubmit} className="space-y-3">
            <input name="email" type="email" placeholder="Email" required className="w-full border rounded px-3 py-2" />
            <input name="password" type="password" placeholder="Password" required className="w-full border rounded px-3 py-2" />
            <button type="submit" className="w-full rounded bg-black text-white py-2">
              {mode==='register' ? 'Create account' : 'Sign in'}
            </button>
          </form>
          <div className="text-sm mt-3">
            {mode==='register' ? (
              <button className="underline" onClick={()=>setMode('login')}>Have an account? Sign in</button>
            ) : (
              <button className="underline" onClick={()=>setMode('register')}>Need an account? Create one</button>
            )}
          </div>
        </div>
      </div>
    </>
  )
  return createPortal(ui, document.body)
}
