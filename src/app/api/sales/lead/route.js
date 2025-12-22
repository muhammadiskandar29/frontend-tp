import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/config/env";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Build query parameters
    const params = new URLSearchParams();
    
    // Filter parameters
    if (searchParams.get("status") && searchParams.get("status") !== "all") {
      params.append("status", searchParams.get("status"));
    }
    if (searchParams.get("sales_id")) {
      params.append("sales_id", searchParams.get("sales_id"));
    }
    if (searchParams.get("customer_id")) {
      params.append("customer_id", searchParams.get("customer_id"));
    }
    if (searchParams.get("lead_label") && searchParams.get("lead_label") !== "all") {
      params.append("lead_label", searchParams.get("lead_label"));
    }
    if (searchParams.get("search")) {
      params.append("search", searchParams.get("search"));
    }
    
    // Pagination
    const page = searchParams.get("page") || "1";
    const perPage = searchParams.get("per_page") || "15";
    params.append("page", page);
    params.append("per_page", perPage);

    // Build backend URL
    const backendUrl = `${BACKEND_URL}/api/sales/lead?${params.toString()}`;
    
    console.log("🔍 Fetching leads from:", backendUrl);
    console.log("📄 Query params - page:", page, "per_page:", perPage);

    // Fetch from backend
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
    
    // Check if response is HTML
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      console.error("❌ Backend mengembalikan HTML, bukan JSON!");
      return NextResponse.json(
        {
          success: false,
          message: "Backend mengembalikan HTML, bukan JSON. Kemungkinan endpoint tidak ditemukan atau ada error di backend.",
          error: "HTML response received",
          data: [],
          pagination: null,
        },
        { status: 500 }
      );
    }

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
          data: [],
          pagination: null,
        },
        { status: 500 }
      );
    }

    // Ensure response format is consistent
    if (Array.isArray(json)) {
      return NextResponse.json({
        success: true,
        data: json,
        pagination: null,
      });
    }

    // If backend returns { success, data, pagination }, use it as is
    if (json.success !== undefined) {
      return NextResponse.json({
        success: json.success,
        data: json.data || [],
        message: json.message,
        pagination: json.pagination || null,
      });
    }

    // If backend returns { data: [...] }, wrap it
    if (json.data !== undefined) {
      return NextResponse.json({
        success: true,
        data: Array.isArray(json.data) ? json.data : [json.data],
        pagination: json.pagination || null,
      });
    }

    // Default: return as is
    return NextResponse.json({
      success: true,
      data: [],
      pagination: null,
    });
  } catch (error) {
    console.error("Error in /api/sales/lead:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", data: [], pagination: null },
      { status: 500 }
    );
  }
}

