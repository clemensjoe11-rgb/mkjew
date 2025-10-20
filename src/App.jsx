
import React, { useMemo, useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import Controls from './components/Controls.jsx'
import ProductCard from './components/ProductCard.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import AddProductModal from './components/AddProductModal.jsx'
import ShareModal from './components/ShareModal.jsx'
import Footer from './components/Footer.jsx'
import About from './components/About.jsx'
import Care from './components/Care.jsx'
import AuthModal from './components/AuthModal.jsx'
import EditProductModal from './components/EditProductModal.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import { API } from './utils/api.js'
import { useLocalStorage } from './utils/storage.js'
import { SAMPLE_PRODUCTS, filterProducts, calcCartTotal, THEMES } from './utils/products.js'
import { useAuth } from './auth/AuthContext.jsx'

function buildShareUrl(id) {
  const href = typeof window !== 'undefined' ? window.location.href : ''
  const url = href.split('#')[0]
  return `${url}#${id}`
}

export default function App() {
  const { currentUser, isAdmin } = useAuth()
  const [themeKey, setThemeKey] = useLocalStorage('mkj:theme', 'classic')
  const theme = THEMES[themeKey] ?? THEMES.classic

  const [products, setProducts] = useLocalStorage('mkj:products', SAMPLE_PRODUCTS)
  const [backend, setBackend] = useState(null)
  useEffect(() => {
    let active = true
    API.listProducts().then(list => { if (!active) return; setProducts(list); setBackend(true) })
      .catch(() => { if (!active) return; setBackend(false) })
    return () => { active = false }
  }, [setProducts])

  const [cart, setCart] = useLocalStorage('mkj:cart', {})
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [showCart, setShowCart] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [shareUrl, setShareUrl] = useState(null)
  const [toast, setToast] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [editProduct, setEditProduct] = useState(null)

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category))).sort()], [products])
  const filtered = useMemo(() => filterProducts(products, category, query), [products, category, query])
  const cartItems = useMemo(() => Object.entries(cart).map(([id, qty]) => ({ qty, product: products.find(p => p.id === id) })).filter(x => x.product), [cart, products])
  const cartTotal = useMemo(() => calcCartTotal(products, cart), [products, cart])

  function addToCart(p) { setCart(c => ({ ...c, [p.id]: (c[p.id] || 0) + 1 })) }
  function removeFromCart(id) { setCart(c => { const n = { ...c }; delete n[id]; return n; }) }
  function setQty(id, qty) { setCart(c => ({ ...c, [id]: Math.max(0, qty) })) }

  async function handleAddProduct(e) {
    e.preventDefault()
    if (!isAdmin) return
    const form = new FormData(e.target)
    const name = String(form.get('name')).trim()
    const price = Number(form.get('price'))
    const category = String(form.get('category')).trim() || 'Uncategorized'
    const imageFile = form.get('imageFile')
    const description = String(form.get('description')).trim()
    let image = ''
    if (imageFile && imageFile.size) {
      try {
        if (backend) {
          const up = await API.uploadImage(imageFile); image = up.path
        } else {
          image = await new Promise((resolve, reject)=>{ const r=new FileReader(); r.onload=()=>resolve(String(r.result)); r.onerror=reject; r.readAsDataURL(imageFile); })
        }
      } catch {}
    }
    if (!name || !price) return
    const draft = { id: `p_${Date.now()}`, name, price, category, image, description }
    try {
      if (backend) { const saved = await API.createProduct(draft); setProducts(ps => [saved, ...ps]) }
      else { setProducts(ps => [draft, ...ps]) }
    } catch { setProducts(ps => [draft, ...ps]) }
    e.target.reset(); setShowAdd(false)
  }

  function openShare(p) {
    const url = buildShareUrl(p.id)
    setShareUrl(url); setToast('Link ready to copy')
    window.setTimeout(() => setToast(null), 1500)
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-50">
        <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full blur-3xl bg-gradient-to-tr from-amber-100 to-yellow-50" />
        <div className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl bg-gradient-to-tr from-sky-100 to-cyan-50" />
      </div>

      {toast && (
        <div className="fixed left-1/2 top-4 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-xl bg-white border border-neutral-200 shadow-md text-sm">{toast}</div>
        </div>
      )}

      <div className="w-full text-center text-xs sm:text-sm py-2 bg-gradient-to-r from-neutral-100 to-white border-b border-neutral-200">
        Complimentary shipping on orders over 500€
      </div>

      <Header themeKey={themeKey} setThemeKey={setThemeKey} backend={backend} cartCount={cartItems.reduce((s, x) => s + x.qty, 0)} onOpenCart={() => setShowCart(true)} onOpenAuth={()=>setShowAuth(true)} currentUser={currentUser} />

      <Hero themeKey={themeKey} />

      <Controls
        categories={categories}
        category={category}
        setCategory={setCategory}
        query={query}
        setQuery={setQuery}
        onAddProduct={() => { if (isAdmin) setShowAdd(true) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} onAdd={addToCart} onShare={openShare} themeKey={themeKey} isAdmin={isAdmin} onEdit={(pp)=>setEditProduct(pp)} onDelete={(pp)=>{ if(!isAdmin) return; setProducts(ps=>ps.filter(x=>x.id!==pp.id)) }} />
          ))}
          {filtered.length === 0 && (<div className="col-span-full text-center py-10 text-neutral-500">No products found.</div>)}
        </div>
      </div>

      <About themeKey={themeKey} />
      <Care />
      {isAdmin && <AdminPanel />}
      <Footer />

      <CartDrawer open={showCart} items={cartItems} total={cartTotal} setQty={setQty} removeItem={removeFromCart} onClose={() => setShowCart(false)} />
      {isAdmin && <AddProductModal open={showAdd} onClose={() => setShowAdd(false)} onSubmit={handleAddProduct} backend={backend} />}
      <ShareModal url={shareUrl} onClose={() => setShareUrl(null)} />
      <AuthModal open={showAuth && !currentUser} onClose={()=>setShowAuth(false)} />
      {isAdmin && <EditProductModal open={!!editProduct} onClose={()=>setEditProduct(null)} product={editProduct} onSave={(np)=>{ setProducts(ps=>ps.map(x=>x.id===np.id?np:x)); setEditProduct(null) }} />}
    </div>
  )
}
