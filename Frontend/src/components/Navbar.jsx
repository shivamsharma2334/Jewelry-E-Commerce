import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle, FaSignInAlt, FaSignOutAlt, FaShoppingCart } from "react-icons/fa";
import toast from "react-hot-toast";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    // Optional: Listen for storage changes to sync across tabs
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md p-4 mb-8">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-indigo-600">
          Jewelify
        </Link>
        {/* Centered Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-600 hover:text-indigo-500">Home</Link>
          <Link to="/about" className="text-gray-600 hover:text-indigo-500">About Us</Link>
        </div>
        {/* Right-aligned Icons */}
        <div className="flex items-center space-x-5">
          {isLoggedIn ? (
            <div className="flex items-center space-x-4">
              <Link to="/cart" className="text-gray-600 hover:text-indigo-500" title="Cart">
                <FaShoppingCart className="text-2xl" />
              </Link>
              <Link to="/profile" className="text-gray-600 hover:text-indigo-500" title="Profile">
                <FaUserCircle className="text-2xl" />
              </Link>
              <button onClick={handleLogout} className="flex items-center text-gray-600 hover:text-indigo-500" title="Logout">
                <FaSignOutAlt className="text-2xl" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center text-gray-600 hover:text-indigo-500" title="Login">
              <FaSignInAlt className="text-2xl" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}