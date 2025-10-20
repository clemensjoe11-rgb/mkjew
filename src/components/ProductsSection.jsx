// src/components/ProductsSection.jsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import Controls from './Controls'
import { getProducts } from '../utils/api.db'
import ProductCard from './ProductCard'

function applyFilter(list, q, category) {
  const nameRx = q?.trim() ? new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null
  return list.filter(p => {
    const inCat = category ? String(p.category||'').toLowerCase() === category.toLowerCase() : true
    const nameHit = nameRx ? nameRx.test(String(p.name||'')) : true
    if (category && nameRx) return inCat || nameHit
    if (category && !nameRx) return inCat
    if (!category && nameRx) return nameHit
    return true
  })
}

export default function ProductsSection() {
  const [all, setAll] = useState([])
  const [filters, setFilters] = useState({ q: '', category: '' })

  const onFilter = useCallback((f) => setFilters(f), [])
  useEffect(() => { (async () => setAll((await getProducts()) || []))() }, [])

  const products = useMemo(() => applyFilter(all, filters.q, filters.category), [all, filters])

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-2">Our Products</h2>
      <Controls onFilter={onFilter} />
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
        {products.length === 0 && <div className="text-gray-500">No products found</div>}
      </div>
    </section>
  )
}
