// src/components/EditProductModal.jsx
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { updateProduct, deleteProduct, getCategories } from '../utils/api.db'

function fileToDataURL(file){
  return new Promise((res, rej)=>{ const r=new FileReader(); r.onload=()=>res(String(r.result)); r.onerror=rej; r.readAsDataURL(file); })
}

export default function EditProductModal({ product, open=false, onClose=()=>{}, onSaved=()=>{} }){
  const [cats, setCats] = useState([])
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState(product?.image_url || product?.image || '')

  useEffect(()=>{ if(open){ getCategories().then(setCats) } },[open])

  useEffect(()=>{
    if (!open || !product) return
    setPreview(product.image_url || product.image || '')
    setFile(null); setUrl('')
  },[open, product])

  useEffect(()=>{
    let revoke
    if (file){
      const obj = URL.createObjectURL(file)
      setPreview(obj); revoke = () => URL.revokeObjectURL(obj)
    } else if (url.trim()){
      setPreview(url.trim())
    } else if (product){
      setPreview(product.image_url || product.image || '')
    }
    return ()=>{ revoke?.() }
  },[file, url, product])

  useEffect(()=>{
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key==='Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return ()=>{ document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  },[open, onClose])

  if (!open || !product) return null

  async function onSubmit(e){
    e.preventDefault()
    const f = e.currentTarget
    const name = f.name.value.trim()
    const category = f.category.value.trim()
    const price_cents = Math.round(Number(f.price.value)*100) || product.price_cents
    const description = f.description.value.trim()

    let image_url = product.image_url || product.image || ''
    if (file){
      if (file.size > 2*1024*1024) { alert('Max 2MB'); return }
      try { image_url = await fileToDataURL(file) } catch { alert('Bild konnte nicht gelesen werden'); return }
    } else if (url.trim()){
      image_url = url.trim()
    }

    const r = await updateProduct(product.id, { name, category, price_cents, description, image_url })
    if (r?.ok){ onSaved(); onClose() }
  }

  async function onDelete(){
    if (!confirm('Delete product?')) return
    const r = await deleteProduct(product.id)
    if (r?.ok){ onSaved(); onClose() }
  }

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 z-[12000]" onClick={onClose} />
      <div className="fixed inset-0 z-[12010] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex max-h-[90vh]">
          <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-hidden">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white px-6 py-4">
              <h2 className="text-lg font-semibold">Edit Product</h2>
              <button type="button" onClick={onClose} className="px-3 py-1.5 rounded border">Close</button>
            </div>

            {/* Scroll body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Name</label>
                  <input name="name" defaultValue={product.name} required className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Category</label>
                  <select name="category" defaultValue={product.category||''} className="w-full border rounded px-3 py-2">
                    <option value="">No category</option>
                    {(cats||[]).map(c=> <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Price (€)</label>
                  <input name="price" type="number" step="0.01" defaultValue={(product.price_cents||0)/100} className="w-full border rounded px-3 py-2" />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea name="description" defaultValue={product.description} className="w-full border rounded px-3 py-2" rows={3} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Image from PC</label>
                  <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0] || null)} className="w-full border rounded px-3 py-2" />
                  <p className="mt-1 text-xs text-gray-500">Max 2MB</p>
                </div>
                <div>
                  <label className="block text-sm mb-1">Image from URL</label>
                  <input value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="https://…" className="w-full border rounded px-3 py-2" />
                  <p className="mt-1 text-xs text-gray-500">Datei hat Vorrang.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Preview</label>
                <div className="aspect-[4/3] border rounded-xl overflow-hidden bg-gray-50">
                  {preview ? <img src={preview} alt="preview" className="w-full h-full object-cover" /> : (
                    <div className="grid h-full w-full place-items-center text-gray-400 text-sm">No image</div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t bg-white px-6 py-3">
              <button type="button" onClick={onDelete} className="px-3 py-2 rounded border text-red-600">Delete</button>
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
                <button type="submit" className="px-3 py-2 rounded bg-black text-white">Save</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  , document.body)
}
