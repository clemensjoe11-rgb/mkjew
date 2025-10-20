// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { register as apiRegister, login as apiLogin, logout as apiLogout, me as apiMe } from '../utils/api.db'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      const u = await apiMe()
      if (u?.id) setCurrentUser(u)
      setReady(true)
    })()
  }, [])

  async function register(email, password){
    const r = await apiRegister(email, password)
    if (r?.id) { setCurrentUser({ id:r.id, email:r.email, role:r.role }); window.location.reload() }
    else throw new Error(r?.error || 'register failed')
  }
  async function login(email, password){
    const r = await apiLogin(email, password)
    if (r?.id) { setCurrentUser({ id:r.id, email:r.email, role:r.role }); window.location.reload() }
    else throw new Error(r?.error || 'login failed')
  }
  async function logout(){
    await apiLogout()
    setCurrentUser(null)
    window.location.reload()
  }

  const value = useMemo(() => ({ currentUser, ready, register, login, logout }), [currentUser, ready])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(){ return useContext(AuthContext) }
