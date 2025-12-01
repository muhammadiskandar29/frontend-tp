import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://3.105.234.181:8000";

/**
 * 9.2 Verifikasi OTP Customer
 * POST /api/otp/verify
 * 
 * Catatan: OTP Berlaku selama 5 menit
 * Request: { customer_id, otp }
 * Response: { success, message, data: { customer_id, nama, verifikasi } }
 */
export async function POST(request) {
  try {
    const body = await request.json();

    console.log("🟢 [OTP_VERIFY] Request body:", body);

    // Validasi request body
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

    // Forward ke backend
    const response = await fetch(`${BACKEND_URL}/api/otp/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (err) {
      console.error("❌ [OTP_VERIFY] Non-JSON response:", responseText);
      return NextResponse.json(
        { success: false, message: "Backend error: Response bukan JSON" },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error("❌ [OTP_VERIFY] Backend error:", data);
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Kode OTP salah atau sudah kadaluarsa",
        },
        { status: response.status }
      );
    }

    // Return response sesuai format requirement
    return NextResponse.json({
      success: true,
      message: data?.message || "OTP valid, akun telah diverifikasi",
      data: data?.data || data,
    });
  } catch (error) {
    console.error("❌ [OTP_VERIFY] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Terjadi kesalahan saat memverifikasi OTP",
      },
      { status: 500 }
    );
  }
}


