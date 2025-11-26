import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://3.105.234.181:8000";

// Handle POST dengan _method=PUT (Laravel style)
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Ambil FormData dari request
    const formData = await request.formData();
    
    // Log untuk debug
    console.log(`[PRODUK UPDATE] Product ID: ${id}`);
    console.log(`[PRODUK UPDATE] FormData fields:`);
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${String(value).substring(0, 100)}`);
      }
    }

    // Forward ke backend Laravel
    const response = await fetch(`${BACKEND_URL}/api/admin/produk/${id}`, {
      method: "POST", // Laravel: POST dengan _method=PUT
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        // Jangan set Content-Type untuk FormData, biarkan fetch handle boundary
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    console.log(`[PRODUK UPDATE] Backend response:`, response.status);
    console.log(`[PRODUK UPDATE] Response data:`, JSON.stringify(data).substring(0, 500));

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Gagal memperbarui produk",
          error: data?.error || data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[PRODUK UPDATE] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat memperbarui produk",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Fallback untuk PUT request langsung
export async function PUT(request, { params }) {
  // Redirect ke POST handler
  return POST(request, { params });
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || "";

    const response = await fetch(`${BACKEND_URL}/api/admin/produk/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Produk tidak ditemukan",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[PRODUK GET] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil data produk",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const response = await fetch(`${BACKEND_URL}/api/admin/produk/${id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Gagal menghapus produk",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[PRODUK DELETE] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat menghapus produk",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

