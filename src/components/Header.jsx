// src/components/Header.jsx
import { useEffect, useState } from 'react'
import CartDrawer from './CartDrawer'
import AuthModal from './AuthModal'
import AdminPanel from './AdminPanel'
import { getCart } from '../utils/api.db'
import { useAuth } from '../auth/AuthContext'

export default function Header(){
  const { currentUser, logout } = useAuth()
  const isAdmin = currentUser?.role === 'admin'
  const [openCart, setOpenCart] = useState(false)
  const [openAuth, setOpenAuth] = useState(false)
  const [openAdmin, setOpenAdmin] = useState(false)
  const [count, setCount] = useState(0)

  async function refreshCount(){
    const r = await getCart()
    const c = (r.items||[]).reduce((s,i)=> s + Number(i.qty||0), 0)
    setCount(c)
  }
  useEffect(()=>{
    refreshCount()
    const handler = ()=> refreshCount()
    window.addEventListener('cart:changed', handler)
    return ()=> window.removeEventListener('cart:changed', handler)
  },[])

  return (
    <>
      <nav className="sticky top-0 z-[1000] border-b bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="font-semibold">MK Jewel</a>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={()=>setOpenAdmin(true)}
                className="px-3 py-1.5 rounded border hover:bg-gray-50"
              >
                Admin
              </button>
            )}

            {currentUser ? (
              <>
                <span className="hidden sm:inline text-sm text-gray-700">{currentUser.email}</span>
                <button onClick={logout} className="px-3 py-1.5 rounded border hover:bg-gray-50">
                  Sign out
                </button>
              </>
            ) : (
              <button onClick={()=>setOpenAuth(true)} className="px-3 py-1.5 rounded border hover:bg-gray-50">
                Sign in
              </button>
            )}

            <button
              onClick={()=>setOpenCart(true)}
              className="relative inline-flex items-center justify-center w-12 h-12 rounded-full border border-gray-200 hover:border-gray-300 transition"
              aria-label="Open cart"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="black" strokeWidth="2">
                <circle cx="9" cy="20" r="1.5"></circle>
                <circle cx="17" cy="20" r="1.5"></circle>
                <path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H7"></path>
              </svg>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs rounded-full bg-black text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <CartDrawer open={openCart} onClose={()=>setOpenCart(false)} />
      <AuthModal open={openAuth} onClose={()=>setOpenAuth(false)} />
      <AdminPanel open={openAdmin} onClose={()=>setOpenAdmin(false)} />
    </>
  )
}
