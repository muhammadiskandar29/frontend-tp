// Use Next.js proxy to avoid CORS
const BASE_URL = "/api";

export async function getCustomers(page = 1, per_page = 15, filters = {}) {
  try {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Build query parameters
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("per_page", per_page);
    
    // Add filter parameters
    if (filters.verifikasi && filters.verifikasi !== "all") {
      params.append("verifikasi", filters.verifikasi === "verified" ? "1" : "0");
    }
    if (filters.status && filters.status !== "all") {
      params.append("status", filters.status === "active" ? "1" : "0");
    }
    if (filters.jenis_kelamin && filters.jenis_kelamin !== "all") {
      params.append("jenis_kelamin", filters.jenis_kelamin);
    }
    if (filters.dateRange && Array.isArray(filters.dateRange) && filters.dateRange.length === 2 && filters.dateRange[0] && filters.dateRange[1]) {
      const startDate = new Date(filters.dateRange[0]).toISOString().split('T')[0];
      const endDate = new Date(filters.dateRange[1]).toISOString().split('T')[0];
      params.append("date_from", startDate);
      params.append("date_to", endDate);
    }

    const res = await fetch(`${BASE_URL}/sales/customer?${params.toString()}`, { headers });
    if (!res.ok) throw new Error("Gagal mengambil data customer");

    const result = await res.json();
    return {
      data: Array.isArray(result.data) ? result.data : [],
      pagination: result.pagination || null,
      success: result.success !== false,
    };
  } catch (err) {
    console.error("❌ Error getCustomers:", err);
    return {
      data: [],
      pagination: null,
      success: false,
    };
  }
}

export async function deleteCustomer(id) {
  try {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${BASE_URL}/sales/customer/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) throw new Error("Gagal menghapus customer");

    return true;
  } catch (err) {
    console.error("❌ Error deleteCustomer:", err);
    return false;
  }
}
