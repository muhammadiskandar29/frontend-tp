import { api } from "../api";

/* ======================
   🧾 ADMIN ORDER MODULE
====================== */

/** 📘 GET Semua Order (Admin) */
export async function getOrders(page = 1, per_page = 15) {
  try {
    // Build query string for pagination
    const queryParams = new URLSearchParams({
      page: String(page),
      per_page: String(per_page),
    });
    
    const res = await api(`/sales/order?${queryParams.toString()}`, { method: "GET" });
    
    // Logging struktur JSON lengkap sesuai requirement
    console.log("📦 getOrders() - Success:", res.success);
    console.log("📦 getOrders() - Data:", res.data);
    console.table(res.data);
    
    // Handle different response formats
    if (res.success === true && res.data) {
      return Array.isArray(res.data) ? res.data : [res.data];
    }
    
    // If response is already an array (legacy format)
    if (Array.isArray(res)) {
      return res;
    }
    
    // If response has data property
    if (res.data) {
      return Array.isArray(res.data) ? res.data : [res.data];
    }
    
    // Fallback: return empty array
    console.warn("⚠️ getOrders() - Unexpected response format:", res);
    return [];
  } catch (error) {
    console.error("❌ getOrders() - Error:", error);
    return [];
  }
}

/** 📘 GET Order by ID (Admin) */
export async function getOrderById(id) {
  const res = await api(`/sales/order/${id}`, { method: "GET" });
  return res.data?.[0] || null;
}

/** 🟢 POST Tambah Order (Admin) */
export async function createOrderAdmin(data) {
  const payload = {
    ...data,
    harga: String(data.harga ?? ""),
    ongkir: String(data.ongkir ?? ""),
    total_harga: String(data.total_harga ?? ""),
  };

  console.log("📦 Payload dikirim ke backend:", payload);

  return api("/sales/order-admin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** 🟡 PUT Update Order (Admin) */
export async function updateOrderAdmin(id, updateData) {
  const res = await api(`/sales/order/${id}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
  });
  return {
    success: res.success,
    message: res.message || "Order berhasil diupdate",
    data: res.data,
  };
}

/** 🟣 POST Konfirmasi Pembayaran (Admin) */
export async function confirmOrderPayment(id, { bukti_pembayaran, metode_pembayaran }) {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const waktu_pembayaran = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${pad(
    now.getFullYear()
  )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const formData = new FormData();
  if (bukti_pembayaran) formData.append("bukti_pembayaran", bukti_pembayaran);
  formData.append("waktu_pembayaran", waktu_pembayaran);
  formData.append("metode_pembayaran", metode_pembayaran);

  const res = await api(`/sales/order-konfirmasi/${id}`, {
    method: "POST",
    body: formData,
  });
  return {
    success: res.success !== false,
    message: res.message || "Konfirmasi pembayaran sukses",
    data: res.data,
  };
}

/* ======================
   👤 CUSTOMER ORDER MODULE
====================== */

/** 🟢 POST Tambah Order (Customer) */
export async function createOrderCustomer(orderData) {
  const res = await api("/order", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
  return {
    success: res.success,
    message: res.message || "Order berhasil dibuat",
    data: res.data?.order,
    whatsapp_response: res.data?.whatsapp_response,
  };
}

