const BASE_URL = "https://onedashboardapi-production.up.railway.app/api";

export async function getCustomers() {
  try {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${BASE_URL}/admin/customer`, { headers });
    if (!res.ok) throw new Error("Gagal mengambil data customer");

    const result = await res.json();
    return Array.isArray(result.data) ? result.data : [];
  } catch (err) {
    console.error("❌ Error getCustomers:", err);
    return [];
  }
}

export async function deleteCustomer(id) {
  try {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${BASE_URL}/admin/customer/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) throw new Error("Gagal menghapus customer");

    return true;
  } catch (err) {
    console.error("❌ Error deleteCustomer:", err);
    return false;
  }
}
