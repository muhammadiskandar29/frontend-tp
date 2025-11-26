import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://3.105.234.181:8000";

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

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const contentType = request.headers.get("content-type") || "";

    console.log("🟢 [POST_PRODUK] Creating product...");
    console.log("🟢 [POST_PRODUK] Content-Type:", contentType);

    let response;

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData (file uploads)
      const incomingFormData = await request.formData();
      
      // Create new FormData to forward to backend
      const forwardFormData = new FormData();
      
      console.log("🟢 [POST_PRODUK] FormData entries:");
      for (const [key, value] of incomingFormData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${value.size} bytes, type: ${value.type})`);
          // For files, we need to convert to a Blob/File that fetch can handle
          const arrayBuffer = await value.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: value.type });
          forwardFormData.append(key, blob, value.name);
        } else {
          console.log(`  ${key}: ${value}`);
          forwardFormData.append(key, value);
        }
      }

      // Forward FormData to backend
      response = await fetch(`${BACKEND_URL}/api/admin/produk`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData, let fetch set it with boundary
        },
        body: forwardFormData,
      });
    } else {
      // Handle JSON
      const body = await request.json();
      
      console.log("🟢 [POST_PRODUK] JSON body:", body);

      response = await fetch(`${BACKEND_URL}/api/admin/produk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    }

    console.log("🟢 [POST_PRODUK] Backend response status:", response.status);

    // Handle non-JSON responses (e.g., HTML error pages)
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("❌ [POST_PRODUK] Backend returned non-JSON response:", responseText.substring(0, 500));
      return NextResponse.json(
        { 
          success: false, 
          message: "Backend error: Response bukan JSON", 
          raw_response: responseText.substring(0, 200) 
        },
        { status: response.status || 500 }
      );
    }

    console.log("🟢 [POST_PRODUK] Backend response:", data);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data?.message || "Gagal membuat produk", errors: data?.errors },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [POST_PRODUK] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan saat membuat produk" },
      { status: 500 }
    );
  }
}

