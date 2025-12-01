import { NextResponse } from "next/server";
import crypto from "crypto";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://3.105.234.181:8000";

const SECRET_KEY = process.env.SECRET_KEY || "superkeyy023Ad_8!jf983hfFj";

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body?.customer_id || !body?.wa) {
      return NextResponse.json(
        { success: false, message: "customer_id dan wa harus diisi" },
        { status: 400 }
      );
    }

    // Generate timestamp & hash
    const timestamp = Date.now().toString();
    const hash = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(timestamp)
      .digest("hex");

    const payload = {
      customer_id: Number(body.customer_id),
      wa: String(body.wa),
    };

    const response = await fetch(`${BACKEND_URL}/api/otp/resend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Timestamp": timestamp,
        "X-API-Hash": hash,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "Backend error: Response bukan JSON" },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Gagal mengirim ulang OTP",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data?.message || "OTP berhasil dikirim ke WhatsApp",
      data: data?.data || data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Terjadi kesalahan saat mengirim ulang OTP",
      },
      { status: 500 }
    );
  }
}
