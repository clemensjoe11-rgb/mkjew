
import React, { useRef, useEffect } from 'react'

export default function ShareModal({ url, onClose }) {
  const inputRef = useRef(null)
  useEffect(() => { if (inputRef.current) inputRef.current.select() }, [url])
  if (!url) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(40rem,95vw)] rounded-2xl border border-neutral-200 bg-white shadow-xl p-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">Share product link</div>
          <button onClick={onClose} className="px-2 py-1 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors">Close</button>
        </div>
        <div className="mt-3 grid gap-2">
          <input ref={inputRef} readOnly value={url} className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white" />
          <div className="flex gap-2">
            <button onClick={() => { if (inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }} className="px-3 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors">Select</button>
            <a href={url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-xl text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors">Open link</a>
          </div>
          <p className="text-xs text-neutral-500">Press Ctrl/Cmd+C after selecting to copy.</p>
        </div>
      </div>
    </div>
  )
}
