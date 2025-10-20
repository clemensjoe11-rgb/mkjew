
import React from 'react'
import { THEMES } from '../utils/products.js'

export default function About({ themeKey }) {
  const theme = THEMES[themeKey] ?? THEMES.classic
  return (
    <section id="about" className="border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">About MK Jewel</h2>
            <p className="mt-4 text-neutral-600 text-sm sm:text-base">MK Jewel crafts modern fine jewelry with a focus on longevity, comfort, and responsible sourcing. Each piece is designed to layer, stack, and live with you.</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-neutral-200 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"><div className="text-2xl font-semibold">10y+</div><div className="text-sm text-neutral-600">Craft</div></div>
              <div className="p-4 rounded-2xl border border-neutral-200 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"><div className="text-2xl font-semibold">100%</div><div className="text-sm text-neutral-600">Ethically sourced</div></div>
            </div>
          </div>
          <div className={`rounded-3xl overflow-hidden ring-2 ${theme.ring} shadow-md`}>
            <img className="w-full h-full object-cover transition-transform duration-300 ease-out hover:scale-[1.03]" src="/images/about.svg" alt="workbench" />
          </div>
        </div>
      </div>
    </section>
  )
}
