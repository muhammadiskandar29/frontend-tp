// src/hooks/useProducts.js
"use client";

import { useEffect, useState } from "react";

// ⛔ INI YANG BENER: Pakai lib/products
import { 
  getProducts, 
  deleteProduct, 
  duplicateProduct 
} from "@/lib/products";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =====================================================
  // 🔥 Ambil semua produk saat halaman pertama kali ke-load
  // =====================================================
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const data = await getProducts();

        // Debug helper
        console.log("📦 Loaded products:", data);

        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Error fetching products:", err);
        setError(err?.message || "Gagal memuat produk");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // =====================================================
  // 🧹 Hapus produk
  // =====================================================
  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);

      // Debug
      console.log(`🗑️ Produk ${id} dihapus`);

      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("❌ Error deleting product:", err);
      setError(err?.message || "Gagal menghapus produk");
    }
  };

  // =====================================================
  // 📑 Duplikasi produk
  // =====================================================
  const handleDuplicate = async (id) => {
    try {
      const newProduct = await duplicateProduct(id);

      // Debug
      console.log("📄 Produk terduplikasi:", newProduct);

      if (!newProduct) return;

      setProducts((prev) => [newProduct, ...prev]);
    } catch (err) {
      console.error("❌ Error duplicating product:", err);
      setError(err?.message || "Gagal menduplikasi produk");
    }
  };

  return {
    products,
    loading,
    error,
    handleDelete,
    handleDuplicate,
    setProducts,
  };
}
