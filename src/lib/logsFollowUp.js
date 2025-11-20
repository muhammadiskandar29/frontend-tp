const BASE_URL = "https://onedashboardapi-production.up.railway.app/api";

export async function getLogsFollowUp() {
  try {
    const token = localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${BASE_URL}/admin/logs-follup`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      throw new Error(`Gagal ambil data logs follow up: ${res.status}`);
    }

    const data = await res.json();
    return data; // hasil backend langsung
  } catch (error) {
    console.error("❌ Error di getLogsFollowUp:", error);
    throw error;
  }
}
