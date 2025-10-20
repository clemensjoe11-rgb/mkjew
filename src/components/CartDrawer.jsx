// src/components/CartDrawer.jsx
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getCart, addToCart, removeCartItem } from '../utils/api.db'

export default function CartDrawer({ open=false, onClose=()=>{} }){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  async function load(){
    setLoading(true)
    const r = await getCart()
    const normalized = (r.items||[]).map(i => ({
      id: i.id, qty: i.qty, productId: i.product?.id, product: i.product
    }))
    setItems(normalized); setLoading(false)
  }
  useEffect(()=>{ if(open) load() },[open])

  useEffect(()=>{
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key==='Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return ()=>{ document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  },[open, onClose])

  async function setQty(item, q){
    await addToCart(item.productId, Number(q)); await load()
  }
  async function remove(item){ await removeCartItem(item.id); await load() }

  const total = items.reduce((s,i)=> s + (i.product?.price_cents||0)*i.qty, 0)

  const overlay = (
    <>
      {/* Unter Modal, über Seite */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 z-[9998] ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 z-[9999]
        ${open ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!open}
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Cart</h2>
            <button onClick={onClose} className="px-2 py-1 rounded border">Close</button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {loading && <div className="text-sm text-gray-500">Loading…</div>}
            {!loading && items.length===0 && <div className="text-sm text-gray-500">Empty</div>}
            {items.map(i=>(
              <div key={i.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{i.product?.name}</div>
                  <div className="text-sm text-gray-500">{(i.product?.price_cents||0)/100} €</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" value={i.qty} onChange={e=>setQty(i, e.target.value)} className="w-16 border rounded px-2 py-1" />
                  <button onClick={()=>remove(i)} className="px-2 py-1 rounded border">Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <div className="flex justify-between font-semibold">
              <span>Total</span><span>{(total/100).toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
  return createPortal(overlay, document.body)
}
