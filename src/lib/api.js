/**
 * Base API Client
 * Centralized API request handler dengan error handling, auth, dan logging
 * Scalable dan mudah dipindahkan ke environment manapun
 */

import { toast } from "react-hot-toast";
import { getApiUrl } from "@/config/api";
import config from "@/config/env";

/**
 * Get authentication token
 */
const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

/**
 * Get customer token
 */
const getCustomerToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("customer_token");
};

/**
 * Build request headers
 */
const buildHeaders = (options = {}) => {
  const isFormData = options.body instanceof FormData;
  const token = options.useCustomerToken ? getCustomerToken() : getToken();

  return {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
};

/**
 * Handle API response
 */
const handleResponse = async (res, endpoint, options = {}) => {
  let data;

  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    console.warn(`⚠️ Response dari ${endpoint} bukan JSON valid`);
    data = null;
  }

  // Logging (jika enabled)
  if (config.features.enableLogging) {
    console.groupCollapsed(
      `%c📡 [${options.method || "GET"}] ${endpoint}`,
      "color: #3B82F6; font-weight: bold"
    );
    console.log("Status:", res.status, res.statusText);
    console.log("Response:", data);
    console.groupEnd();
  }

  // Success response
  if (data?.success === true) {
    if (config.features.enableToast && data?.message) {
      toast.success(data.message);
    }
    return {
      success: true,
      message: data?.message || "Berhasil",
      data: data?.data,
    };
  }

  // Unauthorized
  if (res.status === 401) {
    if (config.features.enableToast) {
      toast.error("⚠️ Sesi kamu berakhir. Silakan login ulang.");
    }
    
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("customer_token");
      setTimeout(() => {
        const loginPath = options.useCustomerToken 
          ? "/customer/login" 
          : "/login";
        window.location.href = loginPath;
      }, 1000);
    }
    
    return { success: false, message: "Unauthorized", status: 401 };
  }

  // Error response
  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Terjadi kesalahan server (${res.status} ${res.statusText})`;

    // Special handling untuk order-admin (legacy)
    if (res.status === 500 && endpoint.includes("/order-admin")) {
      console.warn("⚠️ Server error tapi data kemungkinan berhasil masuk.");
      if (config.features.enableToast) {
        toast.success("Data pesanan tersimpan, tapi server mengirim error.");
      }
      return {
        success: true,
        message: "Data pesanan tersimpan, tapi server error.",
        data,
      };
    }

    if (config.features.enableToast) {
      toast.error(message);
    }
    
    throw Object.assign(new Error(message), { 
      status: res.status, 
      data,
      endpoint 
    });
  }

  return data || { success: true, message: "Operasi berhasil tanpa response data" };
};

/**
 * Main API function
 * @param {string} endpoint - API endpoint (akan di-append ke base URL)
 * @param {object} options - Fetch options
 * @param {boolean} options.useCustomerToken - Use customer token instead of admin token
 * @returns {Promise<object>} API response
 */
export async function api(endpoint, options = {}) {
  const url = getApiUrl(endpoint);
  const headers = buildHeaders(options);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    return await handleResponse(res, endpoint, options);
  } catch (err) {
    console.error(`❌ API Error [${endpoint}]:`, err);

    // Network error
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      const message = "🚫 Tidak dapat terhubung ke server. Coba lagi nanti.";
      if (config.features.enableToast) {
        toast.error(message);
      }
      return { success: false, message };
    }

    // Other errors
    const message = err.message || "Terjadi kesalahan tidak diketahui.";
    if (config.features.enableToast && !err.status) {
      toast.error(message);
    }

    return { 
      success: false, 
      message,
      error: err,
      status: err.status 
    };
  }
}

/**
 * API helper untuk customer (menggunakan customer token)
 */
export async function customerApi(endpoint, options = {}) {
  return api(endpoint, { ...options, useCustomerToken: true });
}

export default api;

