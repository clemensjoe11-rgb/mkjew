
export const API = {
  async listProducts() {
    const res = await fetch('/api/products', { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error('no-api')
    return res.json()
  },
  async createProduct(p) {
    const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })
    if (!res.ok) throw new Error('create-failed')
    return res.json()
  },
  async uploadImage(file) {
    const fd = new FormData(); fd.append('image', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) throw new Error('upload-failed')
    return res.json()
  }
}
