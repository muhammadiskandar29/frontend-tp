import { NextResponse } from "next/server";
import { getBackendUrl } from "@/config/api";

const BACKEND_URL = process.env.BACKEND_URL || "https://onedashboardapi-production.up.railway.app";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    
    const backendUrl = `${BACKEND_URL}/api/admin/order`;
    
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: "no-store",
    });

    const text = await response.text();
    let json;
    
    try {
      json = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ Response bukan JSON valid:", text.substring(0, 200));
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON response from backend",
          error: text.substring(0, 200),
        },
        { status: 500 }
      );
    }

    // Logging struktur JSON lengkap sesuai requirement
    console.log("Success:", json.success);
    console.log("Data:", json.data);
    console.table(json.data);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: json?.message || json?.error || "Gagal mengambil data order",
          error: json?.error || json,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(json);
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil data order",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

