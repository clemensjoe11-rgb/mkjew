
import React from 'react'
import { THEMES } from '../utils/products.js'

export default function Hero({ themeKey }) {
  const theme = THEMES[themeKey] ?? THEMES.classic
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-tight">Modern Fine Jewelry for every chapter</h1>
            <p className="mt-4 text-sm sm:text-base text-neutral-600 max-w-prose">Handcrafted pieces with ethically sourced materials. Built to last. Designed to be worn daily.</p>
            <div className="mt-6 flex gap-3">
              <a href="#collections" className={`px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.accent} text-neutral-900 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md`}>Shop collections</a>
              <a href="#about" className="px-4 py-2 rounded-xl text-sm border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors">Learn more</a>
            </div>
          </div>
          <div className="relative">
            <div className={`aspect-[4/3] w-full rounded-3xl overflow-hidden ring-2 ${theme.ring} shadow-md`}>
              <img className="w-full h-full object-cover transition-transform duration-300 ease-out hover:scale-[1.03]" src="/images/hero.svg" alt="jewelry hero" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
