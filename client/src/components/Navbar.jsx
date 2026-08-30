import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaHeart, FaShoppingBag, FaSignInAlt, FaSignOutAlt, FaShieldAlt, FaTimes, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const close = () => setOpen(false);
  const doLogout = async () => { try { await logout(); toast.success('Logged out'); nav('/'); } catch (e) { toast.error(e.message); } };
  return <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b">
    <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
      <Link to="/" onClick={close} className="text-xl sm:text-2xl font-bold tracking-tight text-indigo-700">ShivAmbar Jewels</Link>
      <div className="hidden md:flex gap-6 text-sm"><Link to="/products">Collection</Link><Link to="/about">Our Story</Link><Link to="/contact">Contact</Link></div>
      <div className="flex items-center gap-4">
        {!loading && user && <><Link to="/orders" title="Orders"><FaShoppingBag/></Link><Link to="/cart" title="Cart"><FaShoppingBag/></Link><Link to="/account" title="Account"><FaUserCircle/></Link><Link to="/wishlist" title="Wishlist"><FaHeart/></Link>{user.role === 'admin' && <Link to="/admin" title="Admin"><FaShieldAlt/></Link>}<button title="Logout" onClick={doLogout}><FaSignOutAlt/></button></>}
        {!loading && !user && <Link to="/login" title="Login"><FaSignInAlt/></Link>}
        <button className="md:hidden" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>{open ? <FaTimes/> : <FaBars/>}</button>
      </div>
    </div>
    {open && <div className="md:hidden border-t bg-white px-4 py-4 space-y-3"><Link onClick={close} className="block" to="/products">Collection</Link><Link onClick={close} className="block" to="/about">Our Story</Link><Link onClick={close} className="block" to="/contact">Contact</Link>{user && <><Link onClick={close} className="block" to="/orders">Orders</Link><Link onClick={close} className="block" to="/cart">Cart</Link><Link onClick={close} className="block" to="/account">Account</Link><Link onClick={close} className="block" to="/wishlist">Wishlist</Link>{user.role === 'admin' && <Link onClick={close} className="block" to="/admin">Admin</Link>}</>}</div>}
  </nav>;
}
