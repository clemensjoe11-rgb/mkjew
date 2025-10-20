
import React from 'react'

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white/60 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-4 gap-6 text-sm">
        <div>
          <div className="text-lg font-semibold">MK Jewel</div>
          <p className="mt-2 text-neutral-600">Modern pieces made responsibly.</p>
        </div>
        <div>
          <div className="font-medium">Shop</div>
          <ul className="mt-2 space-y-1 text-neutral-600">
            <li><a href="#collections" className="hover:text-neutral-900 transition-colors">All</a></li>
            <li><a href="#collections" className="hover:text-neutral-900 transition-colors">Rings</a></li>
            <li><a href="#collections" className="hover:text-neutral-900 transition-colors">Necklaces</a></li>
            <li><a href="#collections" className="hover:text-neutral-900 transition-colors">Bracelets</a></li>
            <li><a href="#collections" className="hover:text-neutral-900 transition-colors">Earrings</a></li>
          </ul>
        </div>
        <div>
          <div className="font-medium">Company</div>
          <ul className="mt-2 space-y-1 text-neutral-600">
            <li><a href="#about" className="hover:text-neutral-900 transition-colors">About</a></li>
            <li><a href="#care" className="hover:text-neutral-900 transition-colors">Care</a></li>
            <li><a href="mailto:sales@mkjewel.example" className="hover:text-neutral-900 transition-colors">Contact</a></li>
          </ul>
        </div>
        <div>
          <div className="font-medium">Policy</div>
          <ul className="mt-2 space-y-1 text-neutral-600">
            <li className="hover:text-neutral-900 transition-colors">Shipping & Returns</li>
            <li className="hover:text-neutral-900 transition-colors">Privacy</li>
            <li className="hover:text-neutral-900 transition-colors">Terms</li>
          </ul>
        </div>
      </div>
      <div className="text-xs text-neutral-500 text-center py-6">© {new Date().getFullYear()} MK Jewel. Demo storefront.</div>
    </footer>
  )
}
