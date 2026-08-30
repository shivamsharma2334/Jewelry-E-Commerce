import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user,setUser]=useState(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{ api('/api/auth/me').then(d=>setUser(d.user)).catch(()=>setUser(null)).finally(()=>setLoading(false)); },[]);
  useEffect(()=>{ if(!user) return; const guest=JSON.parse(localStorage.getItem('guestCart')||'[]'); if(guest.length){ api('/api/cart').then(async d=>{const map=new Map((d.cart.items||[]).map(i=>[i.productId,i]));guest.forEach(i=>map.set(i.productId,{...i,quantity:(map.get(i.productId)?.quantity||0)+i.quantity}));await api('/api/cart',{method:'PUT',body:JSON.stringify({items:[...map.values()]})});localStorage.removeItem('guestCart');}).catch(()=>{}); } },[user]);
  const logout=async()=>{await api('/api/auth/logout',{method:'POST'});setUser(null);};
  return <AuthContext.Provider value={{user,setUser,loading,logout}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
