import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductModal({ product, onClose, onAddToCart }) {
  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold">{product.title}</h2>
              <button onClick={onClose} className="text-2xl font-semibold">&times;</button>
            </div>
            <div className="mt-4">
              <img src={product.imglink} alt={product.title} className="w-full h-64 object-contain rounded-md bg-gray-100" />
            </div>
            <div className="mt-4">
              <p className="text-gray-600"><span className="font-semibold">Category:</span> {product.category}</p>
              <p className="text-gray-600"><span className="font-semibold">Weight:</span> {product.gold_weight}</p>
              <p className="text-gray-600"><span className="font-semibold">Purity:</span> {product.karat} Gold</p>
              <p className="text-gray-600"><span className="font-semibold">Rating:</span> {product.review} / 5.0</p>
              <div className="mt-4 text-2xl text-indigo-600 font-bold">₹{product.price}</div>
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <button onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300">Close</button>
              <button onClick={() => { onAddToCart(product); onClose(); }} className="px-4 py-2 rounded-md bg-indigo-600 text-white font-medium">
                Add to Cart
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}