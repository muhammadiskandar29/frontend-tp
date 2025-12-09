import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/config/env";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    
    // Extract query parameters from request
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '15';
    
    // Build backend URL with query parameters
    const backendUrl = `${BACKEND_URL}/api/sales/order?page=${page}&per_page=${perPage}`;
    
    console.log("🔍 Fetching orders from:", backendUrl);
    console.log("🔑 Auth header present:", !!authHeader);
    console.log("📄 Query params - page:", page, "per_page:", perPage);
    
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
    console.log("📥 Response status:", response.status);
    console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()));
    console.log("📥 Response text preview:", text.substring(0, 500));
    
    // Check if response is HTML
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      console.error("❌ Backend mengembalikan HTML, bukan JSON!");
      console.error("❌ Full response:", text.substring(0, 1000));
      
      return NextResponse.json(
        {
          success: false,
          message: "Backend mengembalikan HTML, bukan JSON. Kemungkinan endpoint tidak ditemukan atau ada error di backend.",
          error: "HTML response received",
          data: [],
        },
        { status: 500 }
      );
    }
    
    let json;
    
    try {
      json = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ Response bukan JSON valid:", text.substring(0, 200));
      console.error("❌ Parse error:", parseError);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON response from backend",
          error: text.substring(0, 200),
          data: [],
        },
        { status: 500 }
      );
    }

    // Logging struktur JSON lengkap sesuai requirement
    console.log("✅ Success:", json.success);
    console.log("📊 Data:", json.data);
    console.table(json.data);

    // Ensure response format is consistent
    // If backend returns data directly (array), wrap it in standard format
    if (Array.isArray(json)) {
      return NextResponse.json({
        success: true,
        data: json,
      });
    }

    // If backend returns { success, data, pagination }, use it as is
    if (json.success !== undefined) {
      return NextResponse.json({
        success: json.success,
        data: json.data || json || [],
        message: json.message,
        pagination: json.pagination, // Forward pagination object if exists
      });
    }

    // If backend returns { data: [...] }, wrap it
    if (json.data !== undefined) {
      return NextResponse.json({
        success: true,
        data: Array.isArray(json.data) ? json.data : [json.data],
      });
    }

    // Fallback: wrap entire response in data array
    return NextResponse.json({
      success: true,
      data: Array.isArray(json) ? json : [json],
    });

  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil data order",
        error: error.message,
        data: [],
      },
      { status: 500 }
    );
  }
}

