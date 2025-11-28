import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://3.105.234.181:8000";

export async function POST(request) {
  try {
    const body = await request.json();

    console.log("🟢 [PUBLIC_OTP_SEND] Request body:", body);

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

    const response = await fetch(`${BACKEND_URL}/api/otp/send`, {
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
      console.error("❌ [PUBLIC_OTP_SEND] Non-JSON response:", responseText);
      return NextResponse.json(
        { success: false, message: "Backend error: Response bukan JSON" },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error("❌ [PUBLIC_OTP_SEND] Backend error:", data);
      return NextResponse.json(
        { success: false, message: data?.message || "Gagal mengirim OTP" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data?.message || "OTP berhasil dikirim ke WhatsApp",
      data: data?.data || data,
    });
  } catch (error) {
    console.error("❌ [PUBLIC_OTP_SEND] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Terjadi kesalahan saat mengirim OTP",
      },
      { status: 500 }
    );
  }
}


