// src/utils/products.js

// ---- Filter-Logik wie gefordert ----
// Regeln:
// - kein category & query leer  -> alle
// - nur category                -> nur diese Kategorie
// - nur query                   -> nur Namens-Treffer
// - category + query            -> Kategorie ODER Namens-Treffer
export function filterProducts(products, category, query) {
  const list = Array.isArray(products) ? products : []
  const cat = String(category || '').trim()
  const hasCat = !!cat && cat.toLowerCase() !== 'all'

  const q = String(query || '').trim()
  const hasQ = q.length > 0
  const nameRx = hasQ ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null

  return list.filter((p) => {
    const pCat = String(p.category || '').toLowerCase()
    const inCat = hasCat ? pCat === cat.toLowerCase() : true
    const nameHit = hasQ ? nameRx.test(String(p.name || '')) : true

    if (hasCat && hasQ) return inCat || nameHit
    if (hasCat && !hasQ) return inCat
    if (!hasCat && hasQ) return nameHit
    return true
  })
}

// ---- Rest: unverändert / Hilfen ----
export function calcCartTotal(products, cart) {
  const map = new Map(products.map((p) => [p.id, p]))
  let cents = 0
  for (const [id, qty] of Object.entries(cart || {})) {
    const p = map.get(id)
    if (!p) continue
    const priceCents =
      typeof p.price_cents === 'number'
        ? p.price_cents
        : Math.round(Number(p.price || 0) * 100)
    cents += Math.max(0, Number(qty) || 0) * priceCents
  }
  return cents
}

// Beispiel-Themes wie zuvor
export const THEMES = {
  classic: {},
}

// Optionales Fallback für lokale Demo
export const SAMPLE_PRODUCTS = []
