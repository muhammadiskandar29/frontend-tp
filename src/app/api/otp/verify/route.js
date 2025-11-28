import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://3.105.234.181:8000";

const PUBLIC_OTP_TOKEN =
  process.env.OTP_PUBLIC_TOKEN ||
  process.env.LANDING_AUTH_TOKEN ||
  process.env.OTP_SERVICE_TOKEN ||
  null;

const baseHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
  ...(PUBLIC_OTP_TOKEN ? { Authorization: `Bearer ${PUBLIC_OTP_TOKEN}` } : {}),
};

export async function POST(request) {
  try {
    const body = await request.json();

    console.log("🟢 [PUBLIC_OTP_VERIFY] Request body:", body);

    if (!body?.customer_id || !body?.otp) {
      return NextResponse.json(
        { success: false, message: "customer_id dan otp harus diisi" },
        { status: 400 }
      );
    }

    const payload = {
      customer_id: Number(body.customer_id),
      otp: String(body.otp),
    };

    const response = await fetch(`${BACKEND_URL}/api/otp/verify`, {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (err) {
      console.error("❌ [PUBLIC_OTP_VERIFY] Non-JSON response:", responseText);
      return NextResponse.json(
        { success: false, message: "Backend error: Response bukan JSON" },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error("❌ [PUBLIC_OTP_VERIFY] Backend error:", data);
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Kode OTP salah atau sudah kadaluarsa",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data?.message || "OTP valid, akun telah diverifikasi",
      data: data?.data || data,
    });
  } catch (error) {
    console.error("❌ [PUBLIC_OTP_VERIFY] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Terjadi kesalahan saat memverifikasi OTP",
      },
      { status: 500 }
    );
  }
}


