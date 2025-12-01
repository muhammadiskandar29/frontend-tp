import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://3.105.234.181:8000";

/**
 * 9.3 Re-send OTP Customer
 * POST /api/otp/resend
 * 
 * Request: { customer_id, wa }
 * Response: { success, message, data: { otp_id, customer, otp, wa_response } }
 */
export async function POST(request) {
  try {
    // Ambil token dari header Authorization
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || null;
    
    console.log("🟢 [OTP_RESEND] Token received:", token ? "Token ada" : "Token tidak ada");

    const body = await request.json();

    console.log("🟢 [OTP_RESEND] Request body:", body);

    // Validasi request body
    if (!body?.customer_id || !body?.wa) {
      return NextResponse.json(
        { success: false, message: "customer_id dan wa harus diisi" },
        { status: 400 }
      );
    }

    const payload = {
      customer_id: Number(body.customer_id),
      wa: String(body.wa),
    };

    // Forward ke backend dengan token
    const response = await fetch(`${BACKEND_URL}/api/otp/resend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (err) {
      console.error("❌ [OTP_RESEND] Non-JSON response:", responseText);
      return NextResponse.json(
        { success: false, message: "Backend error: Response bukan JSON" },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error("❌ [OTP_RESEND] Backend error:", data);
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Gagal mengirim ulang OTP",
        },
        { status: response.status }
      );
    }

    // Return response sesuai format requirement
    return NextResponse.json({
      success: true,
      message: data?.message || "OTP berhasil dikirim ke WhatsApp",
      data: data?.data || data,
    });
  } catch (error) {
    console.error("❌ [OTP_RESEND] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Terjadi kesalahan saat mengirim ulang OTP",
      },
      { status: 500 }
    );
  }
}


