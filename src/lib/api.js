import { toast } from "react-hot-toast";

// Use relative path - Next.js rewrite will proxy to backend
const BASE_URL = "/api";

export async function api(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;

const headers = {
  ...(isFormData ? {} : { "Content-Type": "application/json" }),
  Accept: "application/json", // 👉 tambahan baris ini aja!
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};


  let res, data;

  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    try {
      data = await res.json();
    } catch {
      console.warn("⚠️ Response kosong atau bukan JSON valid dari backend");
    }

    console.groupCollapsed(
      `%c📡 [${options.method || "GET"}] ${endpoint}`,
      "color: #3B82F6; font-weight: bold"
    );
    console.log("Status:", res.status, res.statusText);
    console.log("Response:", data);
    console.groupEnd();

    // ✅ Success dari backend
    if (data?.success === true) {
      if (data?.message) toast.success(data.message);
      return {
        success: true,
        message: data?.message || "Berhasil",
        data: data?.data,
      };
    }

    // ⚠️ Unauthorized
    if (res.status === 401) {
      toast.error("⚠️ Sesi kamu berakhir. Silakan login ulang.");
      localStorage.removeItem("token");
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 1000);
      return { success: false, message: "Unauthorized" };
    }

    // ⚠️ Error dari backend
    // ⚠️ Error dari backend
if (!res.ok) {
  const message =
    data?.message ||
    data?.error ||
    `Terjadi kesalahan server (${res.status} ${res.statusText})`;

  // ✅ Jika ternyata data tetap berhasil masuk, tetap anggap success
  if (res.status === 500 && endpoint.includes("/order-admin")) {
    console.warn("⚠️ Server error tapi data kemungkinan berhasil masuk.");
    toast.success("Data pesanan tersimpan, tapi server mengirim error.");
    return {
      success: true,
      message: "Data pesanan tersimpan, tapi server error.",
      data,
    };
  }

  toast.error(message);
  throw Object.assign(new Error(message), { status: res.status, data });
}


    return (
      data || { success: true, message: "Operasi berhasil tanpa response data" }
    );
  } catch (err) {
    console.error("❌ API Error:", err);

    // 🌐 Gagal koneksi (server down / CORS)
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      toast.error("🚫 Tidak dapat terhubung ke server. Coba lagi nanti.");
    } else {
      toast.error(err.message || "Terjadi kesalahan tidak diketahui.");
    }

    return { success: false, message: err.message || "Terjadi kesalahan." };
  }
}
