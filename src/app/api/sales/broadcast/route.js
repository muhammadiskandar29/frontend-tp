import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/config/env";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const backendUrl = `${BACKEND_URL}/api/sales/broadcast`;
    
    console.log("🔍 [SALES-BROADCAST] Fetching broadcasts from:", backendUrl);
    
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    const text = await response.text();
    console.log("📥 [SALES-BROADCAST] Response status:", response.status);
    
    // Check if response is HTML
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      console.error("❌ [SALES-BROADCAST] Backend mengembalikan HTML, bukan JSON!");
      return NextResponse.json(
        {
          success: false,
          message: "Backend mengembalikan HTML, bukan JSON.",
          error: "HTML response received",
        },
        { status: 500 }
      );
    }
    
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("❌ [SALES-BROADCAST] Invalid JSON response:", text);
      return NextResponse.json(
        {
          success: false,
          message: "Backend mengembalikan response yang tidak valid",
          error: "Invalid JSON response",
        },
        { status: 500 }
      );
    }

    console.log("📥 [SALES-BROADCAST] Response:", json);

    return NextResponse.json(json, { status: response.status });
  } catch (error) {
    console.error("❌ [SALES-BROADCAST] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat memuat data broadcast",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
