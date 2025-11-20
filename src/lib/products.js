// src/lib/products.js
import { api } from "./api";

/* =====================================================
   🔍 GET: Ambil semua produk
   ===================================================== */
export async function getProducts() {
  try {
    const res = await api("/admin/produk", { method: "GET" });

    if (!res?.success) {
      throw new Error(res?.message || "Gagal mengambil data produk");
    }

    // Backend biasanya kirim array, fallback supaya aman
    const list = Array.isArray(res.data) ? res.data : [];

    console.log("📦 getProducts() →", list);

    return list;
  } catch (err) {
    console.error("❌ Error getProducts:", err);
    throw err;
  }
}

/* =====================================================
   🗑️ DELETE: Hapus produk
   ===================================================== */
export async function deleteProduct(id) {
  try {
    const res = await api(`/admin/produk/${id}`, { method: "DELETE" });

    if (!res?.success) {
      throw new Error(res?.message || "Gagal menghapus produk");
    }

    console.log(`🗑️ deleteProduct(${id}) → success`);

    return true; // biar gampang dipakai di hooks
  } catch (err) {
    console.error("❌ Error deleteProduct:", err);
    throw err;
  }
}

/* =====================================================
   📑 POST: Duplikasi produk
   ===================================================== */
export async function duplicateProduct(id) {
  try {
    const res = await api(`/admin/produk/${id}/duplicate`, { method: "POST" });

    if (!res?.success) {
      throw new Error(res?.message || "Gagal menduplikasi produk");
    }

    console.log("📄 duplicateProduct →", res.data);

    return res.data || null; // produk baru
  } catch (err) {
    console.error("❌ Error duplicateProduct:", err);
    throw err;
  }
}

/* =====================================================
   🔍 GET: Ambil detail produk berdasarkan ID
   ===================================================== */
export async function getProductById(id) {
  try {
    const res = await api(`/admin/produk/${id}`, { method: "GET" });

    if (!res?.success) {
      throw new Error(res?.message || "Gagal mengambil detail produk");
    }

    // Backend kirim object → pastikan object valid
    const detail = typeof res.data === "object" && res.data !== null ? res.data : null;

    console.log("🔍 getProductById →", detail);

    return detail;
  } catch (err) {
    console.error("❌ Error getProductById:", err);
    throw err;
  }
}
export async function createProduct(payload) {
  try {
    const res = await api("/admin/produk", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.success) {
      throw new Error(res.message || "Gagal membuat produk");
    }

    return res.data;
  } catch (err) {
    console.error("❌ Error createProduct:", err);
    throw err;
  }
}