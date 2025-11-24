import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://onedashboardapi-production.up.railway.app";

export async function POST(request) {
  try {
    const body = await request.json();

    const produk = Number(body.produk);
    const topic = body.topic ? String(body.topic).trim() : "";
    const start_time = body.start_time ? String(body.start_time).trim() : "";
    const duration = Number(body.duration) || 60;

    if (!produk || Number.isNaN(produk)) {
      return NextResponse.json(
        { success: false, message: "ID produk tidak valid" },
        { status: 400 }
      );
    }
    if (!topic) {
      return NextResponse.json(
        { success: false, message: "Topic webinar wajib diisi" },
        { status: 400 }
      );
    }
    if (!start_time) {
      return NextResponse.json(
        { success: false, message: "Start time wajib diisi" },
        { status: 400 }
      );
    }

    const payload = {
      produk,
      topic,
      start_time,
      duration,
    };

    const res = await fetch(`${BACKEND_URL}/api/webinar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Gagal membuat link Zoom",
          error: data?.error || data,
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("❌ Webinar API Proxy Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal terhubung ke server webinar",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    },
  });
}


