import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://onedashboardapi-production.up.railway.app";

export async function GET(request, { params }) {
  try {
    const { idProduk } = await params;

    if (!idProduk) {
      return NextResponse.json(
        { success: false, message: "ID produk tidak ditemukan" },
        { status: 400 }
      );
    }

    const produkId = Number(idProduk);
    if (Number.isNaN(produkId)) {
      return NextResponse.json(
        { success: false, message: "ID produk tidak valid" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    console.log("🔍 [WEBINAR GET] Fetching webinar for product:", produkId);
    console.log("🔍 [WEBINAR GET] Backend URL:", `${BACKEND_URL}/api/admin/webinar/${produkId}`);

    const res = await fetch(`${BACKEND_URL}/api/admin/webinar/${produkId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("🔍 [WEBINAR GET] Backend response status:", res.status);

    const data = await res.json().catch((err) => {
      console.error("❌ [WEBINAR GET] JSON parse error:", err);
      return {};
    });

    console.log("🔍 [WEBINAR GET] Backend response data:", data);

    if (!res.ok) {
      // Jika 404, berarti belum ada webinar untuk produk ini (bukan error)
      if (res.status === 404) {
        return NextResponse.json(
          {
            success: false,
            message: "Belum ada webinar untuk produk ini",
            data: [],
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Gagal mengambil data webinar",
          error: data?.error || data,
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("❌ [WEBINAR GET] API Proxy Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal terhubung ke server webinar",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    },
  });
}

