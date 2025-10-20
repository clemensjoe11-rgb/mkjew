// src/components/Controls.jsx
import React from 'react'

export default function Controls({
  categories = [],            // darf "All" bereits enthalten
  category = 'All',
  setCategory = () => {},
  query = '',
  setQuery = () => {},
}) {
  // deduplizieren, "All" sicherstellen, aber nur 1×
  const uniq = Array.from(new Set(categories.length ? categories : ['All']))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
        className="w-full border rounded-full px-4 py-3"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {uniq.map((c) => {
          const active = String(category).toLowerCase() === String(c).toLowerCase()
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full border ${
                active ? 'bg-black text-white' : 'bg-white'
              }`}
            >
              {c}
            </button>
          )
        })}
      </div>
    </div>
  )
}
