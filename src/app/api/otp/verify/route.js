import { NextResponse } from "next/server";
import crypto from "crypto";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://3.105.234.181:8000";

const SECRET_KEY = process.env.SECRET_KEY || "superkeyy023Ad_8!jf983hfFj";

export async function POST(request) {
  console.log("🟢 [OTP_VERIFY] Route handler called");

  try {
    const body = await request.json();

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

    // =========================================================
    // 🔥 Wajib: Generate timestamp & HMAC hash
    // =========================================================
    const timestamp = Date.now().toString();
    const hash = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(timestamp)
      .digest("hex");
    // =========================================================

    console.log("🟢 [OTP_VERIFY] Sending request to backend:");

    const response = await fetch(`${BACKEND_URL}/api/otp/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",

        // 🔥 Header wajib
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
          message: data?.message || "Kode OTP salah atau sudah kadaluarsa",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data?.message || "OTP valid, akun telah diverifikasi",
      data: {
        customer_id:
          data?.data?.customer_id ||
          data?.customer_id ||
          payload.customer_id,
        nama: data?.data?.nama || data?.nama || "",
        verifikasi:
          data?.data?.verifikasi ??
          data?.verifikasi ??
          1,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Terjadi kesalahan saat memverifikasi OTP",
      },
      { status: 500 }
    );
  }
}
