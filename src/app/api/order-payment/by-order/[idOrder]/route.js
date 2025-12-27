import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/config/env";

export async function GET(request, { params }) {
  try {
    const { idOrder } = await params;

    if (!idOrder) {
      return NextResponse.json(
        { success: false, message: "Order ID tidak ditemukan" },
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

    const backendUrl = `${BACKEND_URL}/api/order-payment/by-order/${idOrder}`;
    console.log("🔍 [PAYMENT-HISTORY] Fetch:", backendUrl);

    const res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch((err) => {
      console.error("❌ [PAYMENT-HISTORY] JSON parse error:", err);
      return null;
    });

    if (!res.ok || (data && data.success === false)) {
      // Handle nested error structure: {success: false, data: {success: false, ...}}
      const errorData = data?.data || data;
      const errorMessage = errorData?.message || data?.message || "Gagal mengambil riwayat pembayaran";
      const errorDetail = errorData?.error || data?.error || errorData;
      
      console.error("❌ [PAYMENT-HISTORY] Backend error:", errorMessage);
      console.error("❌ [PAYMENT-HISTORY] Error detail:", errorDetail);
      
      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          error: errorDetail,
        },
        { status: res.status || 500 }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("❌ [PAYMENT-HISTORY] API Proxy Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Gagal mengambil riwayat pembayaran",
      },
      { status: 500 }
    );
  }
}

