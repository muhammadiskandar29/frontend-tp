import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/config/env";

// GET: List broadcasts
export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const response = await fetch(`${BACKEND_URL}/api/sales/broadcast`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ success: false, message: "Invalid JSON response" }, { status: 500 });
    }

    return NextResponse.json(json, { status: response.status });
  } catch (error) {
    console.error("❌ [BROADCAST-GET] Error:", error);
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}

// POST: Create new broadcast
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const body = await request.json();

    console.log("📤 [BROADCAST-POST] Request body:", body);

    // Prepare request body for backend
    const requestBody = {
      nama: body.nama,
      pesan: body.pesan,
      langsung_kirim: body.langsung_kirim,
      tanggal_kirim: body.tanggal_kirim,
      target: body.target || {},
    };

    // Ensure produk is an array of numbers (not strings)
    if (requestBody.target.produk && Array.isArray(requestBody.target.produk)) {
      requestBody.target.produk = requestBody.target.produk.map((id) => Number(id));
    }

    // Convert status_order to string if it exists
    if (requestBody.target.status_order !== undefined && requestBody.target.status_order !== null) {
      requestBody.target.status_order = String(requestBody.target.status_order);
    }

    // Convert status_pembayaran to string if it exists
    if (requestBody.target.status_pembayaran !== undefined && requestBody.target.status_pembayaran !== null) {
      requestBody.target.status_pembayaran = String(requestBody.target.status_pembayaran);
    }

    console.log("📤 [BROADCAST-POST] Final request body:", requestBody);

    const response = await fetch(`${BACKEND_URL}/api/sales/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const text = await response.text();
    console.log("📥 [BROADCAST-POST] Response status:", response.status);
    console.log("📥 [BROADCAST-POST] Response text:", text);

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ success: false, message: "Invalid JSON response from backend" }, { status: 500 });
    }

    return NextResponse.json(json, { status: response.status });
  } catch (error) {
    console.error("❌ [BROADCAST-POST] Error:", error);
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}
