import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://3.105.234.181:8000";

// Handle PUT request
export async function PUT(request, { params }) {
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
    const contentType = request.headers.get("content-type") || "";

    console.log(`[PRODUK PUT] Product ID: ${id}`);
    console.log(`[PRODUK PUT] Content-Type: ${contentType}`);

    let response;

    if (contentType.includes("multipart/form-data")) {
      // FormData - ada file yang diupload
      const formData = await request.formData();
      
      // Tambahkan _method=PUT untuk Laravel
      formData.append("_method", "PUT");
      
      // Log untuk debug
      console.log(`[PRODUK PUT] FormData fields:`);
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${String(value).substring(0, 100)}`);
        }
      }

      // Forward ke backend Laravel menggunakan POST dengan _method=PUT (untuk file upload)
      response = await fetch(`${BACKEND_URL}/api/admin/produk/${id}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    } else {
      // JSON body - tidak ada file baru, gunakan PUT langsung
      const jsonBody = await request.json();
      
      console.log(`[PRODUK PUT] JSON body:`, JSON.stringify(jsonBody).substring(0, 500));

      // Coba PUT dulu, jika tidak work, fallback ke POST dengan _method
      response = await fetch(`${BACKEND_URL}/api/admin/produk/${id}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonBody),
      });

      // Jika PUT tidak supported (405), coba POST dengan _method=PUT
      if (response.status === 405) {
        console.log(`[PRODUK PUT] PUT not supported, trying POST with _method=PUT`);
        response = await fetch(`${BACKEND_URL}/api/admin/produk/${id}`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...jsonBody, _method: "PUT" }),
        });
      }
    }

    const data = await response.json().catch(() => ({}));

    console.log(`[PRODUK PUT] Backend response:`, response.status);
    console.log(`[PRODUK PUT] Response data:`, JSON.stringify(data).substring(0, 500));

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
    console.error("[PRODUK PUT] Error:", error);
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

// Handle POST dengan _method=PUT (fallback)
export async function POST(request, { params }) {
  return PUT(request, { params });
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
    
    // Get query params to check for force delete
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get("force") === "true";

    console.log(`[PRODUK DELETE] Product ID: ${id}, Force: ${forceDelete}`);

    // Coba DELETE dengan parameter force untuk hard delete
    const deleteUrl = forceDelete 
      ? `${BACKEND_URL}/api/admin/produk/${id}?force=true`
      : `${BACKEND_URL}/api/admin/produk/${id}`;

    const response = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      // Juga kirim force di body untuk backend yang menerima dari body
      body: JSON.stringify({ force: forceDelete }),
    });

    const data = await response.json().catch(() => ({}));

    console.log(`[PRODUK DELETE] Backend response:`, response.status, data);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Gagal menghapus produk",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ...data,
      success: true,
      message: data?.message || "Produk berhasil dihapus permanen"
    }, { status: response.status });
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

