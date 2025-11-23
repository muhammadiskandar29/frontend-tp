// src/hooks/useProducts.js
"use client";

import { useEffect, useState } from "react";

// ⛔ INI YANG BENER: Pakai lib/products
import { 
  getProducts, 
  deleteProduct, 
  duplicateProduct,
  updateProductStatus
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
  // 🧹 Hapus produk (ubah status menjadi 0 = Inactive)
  // =====================================================
  const handleDelete = async (id) => {
    try {
      // Update status menjadi 0 (Inactive) bukan delete
      await updateProductStatus(id, "0");

      // Debug
      console.log(`🗑️ Produk ${id} diubah menjadi Inactive`);

      // Update status di local state
      setProducts((prev) => 
        prev.map((p) => p.id === id ? { ...p, status: "0" } : p)
      );
    } catch (err) {
      console.error("❌ Error updating product status:", err);
      setError(err?.message || "Gagal mengubah status produk");
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
