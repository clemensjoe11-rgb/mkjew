// src/utils/api.db.js
function emitCartChanged(){ if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cart:changed')); }

// Auth
export async function me(){ return fetch('/api/me',{ credentials:'include' }).then(r=>r.json()); }
export async function register(email, password){
  return fetch('/api/register',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}), credentials:'include' }).then(r=>r.json());
}
export async function login(email, password){
  return fetch('/api/login',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}), credentials:'include' }).then(r=>r.json());
}
export async function logout(){
  return fetch('/api/logout',{ method:'POST', credentials:'include' }).then(r=>r.json());
}

// Products
export async function getProducts(params={}){
  const u = new URLSearchParams();
  if (params.q) u.set('q', params.q);
  if (params.category) u.set('category', params.category);
  return fetch('/api/products' + (u.toString()?`?${u}`:''), { credentials:'include' }).then(r=>r.json());
}
export async function createProduct(p){
  return fetch('/api/products',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(p), credentials:'include' }).then(r=>r.json());
}
export async function updateProduct(id, p){
  return fetch('/api/products/'+id,{ method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(p), credentials:'include' }).then(r=>r.json());
}
export async function deleteProduct(id){
  return fetch('/api/products/'+id,{ method:'DELETE', credentials:'include' }).then(r=>r.json());
}

// Categories
export async function getCategories(){ return fetch('/api/categories',{ credentials:'include' }).then(r=>r.json()); }
export async function adminAddCategory(name){
  return fetch('/api/admin/categories',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name }), credentials:'include' }).then(r=>r.json());
}
export async function adminDeleteCategory(id){
  return fetch('/api/admin/categories/'+id,{ method:'DELETE', credentials:'include' }).then(r=>r.json());
}

// Cart
export async function getCart(){ return fetch('/api/cart',{ credentials:'include' }).then(r=>r.json()); }
export async function addToCart(product_id, qty){
  const r = await fetch('/api/cart/items',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({product_id, qty}), credentials:'include' });
  const j = await r.json(); emitCartChanged(); return j;
}
export async function removeCartItem(id){
  const r = await fetch('/api/cart/items/'+id,{ method:'DELETE', credentials:'include' });
  const j = await r.json(); emitCartChanged(); return j;
}

// Admin: Users
export async function adminListUsers(){ return fetch('/api/admin/users',{ credentials:'include' }).then(r=>r.json()); }
export async function adminSetRole(id, role){
  return fetch(`/api/admin/users/${id}/role`,{ method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ role }), credentials:'include' }).then(r=>r.json());
}
export async function adminResetPassword(id, new_password){
  return fetch(`/api/admin/users/${id}/reset-password`,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ new_password }), credentials:'include' }).then(r=>r.json());
}
export async function adminDeleteUser(id){ return fetch(`/api/admin/users/${id}`,{ method:'DELETE', credentials:'include' }).then(r=>r.json()); }
