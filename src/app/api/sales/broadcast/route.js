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

    console.log("📤 [BROADCAST-POST] Request body from frontend:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.nama || !body.pesan) {
      return NextResponse.json(
        { success: false, message: "Nama dan pesan wajib diisi" },
        { status: 400 }
      );
    }

    // Validate produk is present and not empty
    if (!body.target?.produk || !Array.isArray(body.target.produk) || body.target.produk.length === 0) {
      return NextResponse.json(
        { success: false, message: "Pilih minimal satu produk" },
        { status: 400 }
      );
    }

    // Prepare request body for backend
    // Frontend sudah mengirim payload yang sudah dinormalisasi, jadi kita hanya perlu memastikan format benar
    const requestBody = {
      nama: String(body.nama).trim(),
      pesan: String(body.pesan).trim(),
      langsung_kirim: Boolean(body.langsung_kirim),
      tanggal_kirim: body.tanggal_kirim || null,
      target: {
        // Produk: always array of integers (wajib)
        produk: Array.isArray(body.target.produk)
          ? body.target.produk.map((id) => Number(id)).filter((id) => !isNaN(id) && id > 0)
          : [],
      },
    };

    // Only include status_order if it exists and is not empty (optional - string)
    if (body.target?.status_order !== undefined && body.target?.status_order !== null && body.target?.status_order !== "") {
      let statusValue = null;
      
      if (typeof body.target.status_order === "string" && body.target.status_order.trim()) {
        statusValue = body.target.status_order.trim();
      } else if (Array.isArray(body.target.status_order) && body.target.status_order.length > 0) {
        // If array provided, take first element
        statusValue = String(body.target.status_order[0]).trim();
      } else {
        statusValue = String(body.target.status_order).trim();
      }
      
      // Only include if we have a valid non-empty string
      if (statusValue && statusValue !== "") {
        requestBody.target.status_order = statusValue;
      }
      // If empty string after trim, don't include it
    }

    // Only include status_pembayaran if it exists and is not empty (optional - string)
    if (body.target?.status_pembayaran !== undefined && body.target?.status_pembayaran !== null && body.target?.status_pembayaran !== "") {
      let statusValue = null;
      
      if (typeof body.target.status_pembayaran === "string" && body.target.status_pembayaran.trim()) {
        statusValue = body.target.status_pembayaran.trim();
      } else if (Array.isArray(body.target.status_pembayaran) && body.target.status_pembayaran.length > 0) {
        // If array provided, take first element
        statusValue = String(body.target.status_pembayaran[0]).trim();
      } else {
        statusValue = String(body.target.status_pembayaran).trim();
      }
      
      // Only include if we have a valid non-empty string
      if (statusValue && statusValue !== "") {
        requestBody.target.status_pembayaran = statusValue;
      }
      // If empty string after trim, don't include it
    }

    // Final validation: produk must not be empty
    if (!requestBody.target.produk || requestBody.target.produk.length === 0) {
      return NextResponse.json(
        { success: false, message: "Pilih minimal satu produk" },
        { status: 400 }
      );
    }

    console.log("📤 [BROADCAST-POST] Final request body to backend:", JSON.stringify(requestBody, null, 2));

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
