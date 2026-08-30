import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import productsData from "../assets/products.json";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

// Select a few high-quality, visually appealing images for the background slideshow
const backgroundImages = [
  productsData[4].imglink, // Heritage Bridal Necklace
  productsData[1].imglink, // Royal Gorget
  productsData[6].imglink, // Dual Toned Gold Bracelet
  productsData[8].imglink, // Graceful Choker Necklace
];

const featuredProducts = productsData.slice(0, 4); // Take first 4 products for the featured section

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const handleAddToCart = (product) => {
  // This is a simplified version of the function in Product.jsx
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const existingProductIndex = cart.findIndex((item) => item.id === product.id);
  if (existingProductIndex > -1) { cart[existingProductIndex].quantity += 1; } else { cart.push({ ...product, quantity: 1 }); }
  localStorage.setItem("cart", JSON.stringify(cart));
  window.dispatchEvent(new Event('storage'));
  toast.success("Added to cart!");
};

export default function Landing() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const featuredSectionRef = useRef(null);

  const handleScrollToProducts = () => {
    gsap.to(window, {
      duration: 1.5,
      scrollTo: {
        y: featuredSectionRef.current,
        offsetY: 70 // Adjust this offset to account for a sticky navbar if you have one
      },
      ease: "power2.inOut",
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(timer); // Cleanup the interval on component unmount
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative text-center h-[calc(100vh-120px)] flex flex-col items-center justify-center text-white overflow-hidden -mt-8 -mx-4">
        <AnimatePresence>
          <motion.img
            key={currentImageIndex}
            src={backgroundImages[currentImageIndex]}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute top-0 left-0 w-full h-full bg-black/50" />

        <div className="relative z-10 p-4">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="text-5xl font-bold mb-4 tracking-tight text-shadow-md">
            Welcome to ShivAmbar Jewels
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }} className="text-lg text-gray-200 max-w-2xl mx-auto mb-8 text-shadow">
            Discover exquisite jewellery crafted with passion and precision. Find the perfect piece that tells your story.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }} className="flex justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/products" className="px-8 py-3 rounded-md bg-indigo-600 text-white font-medium shadow-lg hover:bg-indigo-500 transition-colors">
                Browse Collection
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/about" className="px-8 py-3 rounded-md border border-white/50 text-white font-medium hover:bg-white/10 transition-colors">
                Our Story
              </Link>
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
            <motion.button
              onClick={handleScrollToProducts}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Scroll to featured products"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.button>
        </div>
      </section>

      {/* Featured Products Section */}
      <motion.section
        ref={featuredSectionRef}
        className="py-20"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <h2 className="text-3xl font-bold text-center mb-12">Featured Collection</h2>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {featuredProducts.map((p) => (
            <motion.article
              key={p.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col"
              whileHover={{ y: -5, boxShadow: "0px 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="h-44 bg-gray-100 flex items-center justify-center">
                <img src={p.imglink} alt={p.title} className="object-contain max-h-full w-full" />
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold text-lg">{p.title}</h3>
                <div className="mt-4 text-indigo-600 font-bold">₹{p.price}</div>
                <div className="mt-auto pt-4">
                  <button onClick={() => handleAddToCart(p)} className="w-full px-4 py-2 text-sm rounded-md bg-indigo-600 text-white font-medium">
                    Add to Cart
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.section>

      {/* About Us Section */}
      <motion.section
        className="py-20 bg-white -mx-4 px-4"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">The Heart of Craftsmanship</h2>
          <p className="text-lg text-gray-600 mb-8">
            ShivAmbar Jewels was born from a passion for timeless elegance and exquisite craftsmanship. We believe that every piece of jewellery tells a story—a story of love, celebration, and personal milestones.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/about" className="inline-block px-8 py-3 rounded-md border border-indigo-600 text-indigo-600 font-medium hover:bg-indigo-50 transition-colors">
              Discover Our Story
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Contact Us Section */}
      <motion.section
        className="py-20"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Get In Touch</h2>
          <p className="text-lg text-gray-600 mb-8">
            Have a question or want to discuss a custom piece? We'd love to hear from you.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/contact" className="inline-block px-8 py-3 rounded-md bg-indigo-600 text-white font-medium shadow-lg hover:bg-indigo-700 transition-colors">
              Contact Us
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </>
  );
}