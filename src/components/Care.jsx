
import React from 'react'

export default function Care() {
  const cards = [
    { t: 'Care Guide', d: 'Clean with mild soap and a soft brush. Avoid harsh chemicals. Store individually to prevent scratches.' },
    { t: 'Sizing', d: 'Complimentary ring resizing within 60 days on eligible styles.' },
    { t: 'Warranty', d: 'Two-year craftsmanship warranty. Repairs and inspections available.' },
  ]
  return (
    <section id="care" className="border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Care & Warranty</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {cards.map((x,i) => (
            <div key={i} className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="font-medium">{x.t}</div>
              <p className="mt-2 text-sm text-neutral-600">{x.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
