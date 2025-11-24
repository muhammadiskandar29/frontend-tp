import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://onedashboardapi-production.up.railway.app";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    console.log("🟢 [GET_PRODUK] Fetching products...");

    // Forward ke backend
    const response = await fetch(`${BACKEND_URL}/api/admin/produk`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    console.log("🟢 [GET_PRODUK] Backend response:", data);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data?.message || "Gagal mengambil produk" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [GET_PRODUK] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan saat mengambil produk" },
      { status: 500 }
    );
  }
}

