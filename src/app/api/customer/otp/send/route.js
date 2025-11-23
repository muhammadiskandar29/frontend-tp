import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://onedashboardapi-production.up.railway.app";

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
    const body = await request.json();

    console.log("🟢 [OTP_SEND] Request body:", body);
    console.log("🟢 [OTP_SEND] Token:", token ? "exists" : "missing");

    // Validasi body
    if (!body.customer_id || !body.wa) {
      return NextResponse.json(
        { success: false, message: "customer_id dan wa harus diisi" },
        { status: 400 }
      );
    }

    // Forward ke backend
    const response = await fetch(`${BACKEND_URL}/api/customer/otp/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        customer_id: parseInt(body.customer_id, 10),
        wa: String(body.wa),
      }),
    });

    const data = await response.json();

    console.log("🟢 [OTP_SEND] Backend response:", data);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data?.message || "Gagal mengirim OTP" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [OTP_SEND] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan saat mengirim OTP" },
      { status: 500 }
    );
  }
}

