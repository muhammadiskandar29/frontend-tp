// src/lib/products.js
import { api } from "./api";

/* =====================================================
   🔍 GET: Ambil semua produk (exclude yang sudah soft-deleted)
   ===================================================== */
export async function getProducts(includeDeleted = false) {
  try {
    const res = await api("/admin/produk", { method: "GET" });

    // Check if response has success property
    if (res && res.success === false) {
      const errorMessage = res.message || "Gagal mengambil data produk";
      console.error("❌ getProducts API returned error:", errorMessage);
      throw new Error(errorMessage);
    }

    // If no success property but has data, assume success
    if (res && res.data !== undefined) {
      // Backend biasanya kirim array, fallback supaya aman
      let list = Array.isArray(res.data) ? res.data : [];

      // Filter out soft-deleted products (status = "0" atau null)
      // Kecuali includeDeleted = true
      if (!includeDeleted) {
        list = list.filter(p => p.status === "1" || p.status === 1);
      }

      console.log("📦 getProducts() →", list.length, "produk aktif");

      return list;
    }

    // If response is directly an array (fallback)
    if (Array.isArray(res)) {
      return includeDeleted ? res : res.filter(p => p.status === "1" || p.status === 1);
    }

    // If no data, return empty array
    console.warn("⚠️ getProducts() → No data in response, returning empty array");
    return [];
  } catch (err) {
    console.error("❌ Error getProducts:", err);
    throw err;
  }
}

/* =====================================================
   🗑️ DELETE: Hapus produk (hard delete dengan force=true)
   ===================================================== */
export async function deleteProduct(id, force = true) {
  try {
    const url = force ? `/admin/produk/${id}?force=true` : `/admin/produk/${id}`;
    const res = await api(url, { method: "DELETE" });

    if (!res?.success) {
      throw new Error(res?.message || "Gagal menghapus produk");
    }

    console.log(`🗑️ deleteProduct(${id}, force=${force}) → success`);

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

    // Backend bisa kirim array atau object
    let detail = null;
    if (Array.isArray(res.data)) {
      // Jika array, ambil elemen pertama
      detail = res.data.length > 0 ? res.data[0] : null;
    } else if (typeof res.data === "object" && res.data !== null) {
      // Jika object langsung
      detail = res.data;
    }

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

/* =====================================================
   🔄 UPDATE: Update status produk (1 = Active, 0 = Inactive)
   ===================================================== */
export async function updateProductStatus(id, status) {
  try {
    const res = await api(`/admin/produk/${id}`, {
      method: "POST",
      body: JSON.stringify({ status: String(status) }),
    });

    if (!res?.success) {
      throw new Error(res?.message || "Gagal mengupdate status produk");
    }

    console.log(`🔄 updateProductStatus(${id}, ${status}) → success`);

    return res.data || null;
  } catch (err) {
    console.error("❌ Error updateProductStatus:", err);
    throw err;
  }
}