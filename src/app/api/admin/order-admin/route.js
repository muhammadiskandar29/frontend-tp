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

    console.log("📤 [ORDER_ADMIN] Payload dikirim ke backend:", JSON.stringify(body, null, 2));

    // Forward ke backend
    const response = await fetch(`${BACKEND_URL}/api/admin/order-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log("📥 [ORDER_ADMIN] Backend response:", JSON.stringify(data, null, 2));

    // Handle kasus khusus: Data berhasil masuk tapi backend return 500 dengan error "Undefined variable $field"
    // Workaround: Jika ada data.order di response meskipun ada error, anggap sebagai success dengan warning
    if (response.status === 500 && data.error === "ErrorException" && data.data?.order) {
      console.warn("⚠️ [ORDER_ADMIN] Backend error tapi data berhasil masuk, menggunakan workaround");
      return NextResponse.json({
        success: true,
        message: data.message || "Order berhasil dibuat (dengan warning)",
        data: data.data,
        warning: data.message || "Terjadi warning dari backend, namun data berhasil disimpan"
      });
    }

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: data?.message || "Gagal membuat order",
          error: data?.error || "Unknown error"
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [ORDER_ADMIN] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan saat membuat order" },
      { status: 500 }
    );
  }
}

