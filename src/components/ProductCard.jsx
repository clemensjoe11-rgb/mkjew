// src/components/ProductCard.jsx
import { addToCart } from '../utils/api.db'

export default function ProductCard({ product }){
  return (
    <div className="border rounded-2xl p-4 space-y-2">
      <img src={product.image_url} alt={product.name} className="w-full h-40 object-cover rounded-xl" />
      <div className="font-semibold">{product.name}</div>
      <div className="text-sm text-gray-600">{(product.price_cents||0)/100} €</div>
      <button onClick={()=>addToCart(product.id, 1)} className="w-full rounded bg-black text-white py-2">Add to cart</button>
    </div>
  )
}
