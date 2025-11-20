// /lib/kategori.js
const BASE_URL = "https://onedashboardapi-production.up.railway.app/api";

/**
 * Ambil semua kategori
 */
export async function getKategori() {
  try {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${BASE_URL}/admin/kategori-produk`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Gagal mengambil data kategori");

    const result = await res.json();
    console.log("📡 [GET] /admin/kategori-produk", result);

    return Array.isArray(result.data) ? result.data : [];
  } catch (err) {
    console.error("❌ Error getKategori:", err);
    return [];
  }
}

/**
 * Tambah kategori baru
 */
export async function addKategori(nama) {
  try {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${BASE_URL}/admin/kategori-produk`, {
      method: "POST",
      headers,
      body: JSON.stringify({ nama }),
    });

    if (!res.ok) throw new Error("Gagal menambahkan kategori");

    const result = await res.json();
    console.log("✅ [POST] /admin/kategori-produk", result);
    return result.data;
  } catch (err) {
    console.error("❌ Error addKategori:", err);
    return null;
  }
}

/**
 * Update kategori berdasarkan ID
 */
export async function updateKategori(id, nama) {
  try {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${BASE_URL}/admin/kategori-produk/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ nama }),
    });

    if (!res.ok) throw new Error("Gagal memperbarui kategori");

    const result = await res.json();
    console.log("✏️ [PUT] /admin/kategori-produk", result);
    return result.data;
  } catch (err) {
    console.error("❌ Error updateKategori:", err);
    return null;
  }
}

/**
 * Hapus kategori berdasarkan ID
 */
export async function deleteKategori(id) {
  try {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${BASE_URL}/admin/kategori-produk/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) throw new Error("Gagal menghapus kategori");

    console.log(`🗑 [DELETE] /admin/kategori-produk/${id} berhasil`);
    return true;
  } catch (err) {
    console.error("❌ Error deleteKategori:", err);
    return false;
  }
}
