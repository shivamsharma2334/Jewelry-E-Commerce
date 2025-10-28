import React, { useState, useEffect } from "react";
import productsData from "../assets/products.json";
import ProductModal from "./ProductModal"; 
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function Product() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingProductIndex = cart.findIndex((item) => item.id === product.id);

    if (existingProductIndex > -1) {
      
      cart[existingProductIndex].quantity += 1;
    } else {
      
      cart.push({ ...product, quantity: 1 });
    }
    
   
    localStorage.setItem("cart", JSON.stringify(cart));
   
    window.dispatchEvent(new Event('storage'));
    toast.success("Added to cart!");
  };

  useEffect(() => {
    if (Array.isArray(productsData)) setProducts(productsData);
    else if (productsData.products) setProducts(productsData.products);
  }, []);

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Products</h2>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p, i) => (
          <motion.article
            key={i}
            className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col"
            whileHover={{ y: -5, boxShadow: "0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
            transition={{ duration: 0.2 }}
          >
            <div className="h-44 bg-gray-100 flex items-center justify-center">
              {p.imglink ? <img src={p.imglink} alt={p.title} className="object-contain max-h-full w-full cursor-pointer" onClick={() => setSelectedProduct(p)} /> : <div>No image</div>}
            </div>
            <div className="p-4 flex flex-col">
              <h3 className="font-semibold text-lg flex-grow">{p.title}</h3>
              <p className="text-gray-500 mt-2">{p.description}</p>
              <div className="mt-4 text-indigo-600 font-bold">₹{p.price}</div>
              <div className="mt-auto pt-4 flex gap-2">
                <button onClick={() => setSelectedProduct(p)} className="flex-1 px-4 py-2 text-sm rounded-md border border-gray-300">
                  View
                </button>
                <button onClick={() => handleAddToCart(p)} className="flex-1 px-4 py-2 text-sm rounded-md bg-indigo-600 text-white font-medium">
                  Add to Cart
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={handleAddToCart} />
    </section>
  );
}