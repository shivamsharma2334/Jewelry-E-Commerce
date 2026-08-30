import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
  exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
};

export default function Cart() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("cart") || "[]";
    setCart(JSON.parse(raw));
  }, []);

  const handleRemoveItem = (productId) => {
    const updatedCart = cart.filter((item) => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('storage')); 
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }
    const updatedCart = cart.map((item) =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('storage')); 
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <section className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 border-b pb-4">Your Cart</h2>
      <AnimatePresence mode="wait">
        {cart.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-10 text-center text-gray-500"
          >
            Your cart is empty.
          </motion.p>
        ) : (
          <motion.div key="cart-items">
            <motion.div 
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    variants={itemVariants}
                    exit="exit"
                    className="flex items-center justify-between border-b py-4"
                  >
                    <div className="flex items-center gap-4">
                      <img src={item.imglink} alt={item.title} className="w-20 h-20 object-contain rounded-md bg-gray-100" />
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-gray-600">₹{item.price.toLocaleString()}</p> 
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border rounded-md">
                        <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)} className="px-3 py-1 text-lg font-medium">-</button>
                        <span className="px-4 py-1">{item.quantity}</span>
                        <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)} className="px-3 py-1 text-lg font-medium">+</button>
                      </div>
                      <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 font-semibold">Remove</button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 border-t pt-6">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total</span>
                <motion.span key={total} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  ₹{total.toLocaleString()}
                </motion.span>
              </div>
              <div className="mt-6 text-right">
                <button onClick={() => navigate('/order')} className="w-full sm:w-auto px-8 py-3 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
                  Proceed to Checkout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );}