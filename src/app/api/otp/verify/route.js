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
  console.log("🟢 [OTP_VERIFY] Route handler called");
  
  try {
    const body = await request.json();

    console.log("🟢 [OTP_VERIFY] Request body:", JSON.stringify(body, null, 2));

    // Validasi request body
    if (!body?.customer_id || !body?.otp) {
      console.error("❌ [OTP_VERIFY] Missing required fields:", { customer_id: body?.customer_id, otp: body?.otp });
      return NextResponse.json(
        { success: false, message: "customer_id dan otp harus diisi" },
        { status: 400 }
      );
    }

    const payload = {
      customer_id: Number(body.customer_id),
      otp: String(body.otp),
    };

    console.log("🟢 [OTP_VERIFY] Forwarding to backend:", `${BACKEND_URL}/api/otp/verify`);
    console.log("🟢 [OTP_VERIFY] Payload:", JSON.stringify(payload, null, 2));

    // Forward ke backend Laravel
    const response = await fetch(`${BACKEND_URL}/api/otp/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("🟢 [OTP_VERIFY] Backend response status:", response.status);

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
      console.log("🟢 [OTP_VERIFY] Backend response data:", JSON.stringify(data, null, 2));
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
    // Response: { success, message, data: { customer_id, nama, verifikasi } }
    const responseData = {
      success: true,
      message: data?.message || "OTP valid, akun telah diverifikasi",
      data: {
        customer_id: data?.data?.customer_id || data?.customer_id || payload.customer_id,
        nama: data?.data?.nama || data?.nama || "",
        verifikasi: data?.data?.verifikasi !== undefined 
          ? data.data.verifikasi 
          : (data?.verifikasi !== undefined ? data.verifikasi : 1),
      },
    };

    console.log("✅ [OTP_VERIFY] Returning success response:", JSON.stringify(responseData, null, 2));
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ [OTP_VERIFY] Error:", error);
    console.error("❌ [OTP_VERIFY] Error stack:", error.stack);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Terjadi kesalahan saat memverifikasi OTP",
      },
      { status: 500 }
    );
  }
}


