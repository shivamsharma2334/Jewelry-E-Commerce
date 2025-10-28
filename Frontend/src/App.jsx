import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./components/Landing";
import Product from "./components/Product";
import About from "./components/About";
import Contact from "./components/Contact";
import Cart from "./components/Cart";
import Login from "./components/Login";
import Register from "./components/Register";
import Footer from "./components/Footer";
import Order from "./components/Order";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";

export default function App() {
  const location = useLocation();

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5,
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            <Routes location={location}>
              <Route path="/" element={<Landing />} />
              <Route path="/products" element={<Product />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/order" element={<Order />} />
              <Route path="*" element={<div className='text-center py-20'>Page not found</div>} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}