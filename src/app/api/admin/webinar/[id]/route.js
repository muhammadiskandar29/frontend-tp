import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/config/env";

// GET handler - untuk mendapatkan webinar berdasarkan ID produk
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID produk tidak ditemukan" },
        { status: 400 }
      );
    }

    const produkId = Number(id);
    if (Number.isNaN(produkId)) {
      return NextResponse.json(
        { success: false, message: "ID produk tidak valid" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    console.log("🔍 [WEBINAR GET] Fetching webinar for product:", produkId);
    console.log("🔍 [WEBINAR GET] Backend URL:", `${BACKEND_URL}/api/admin/webinar/${produkId}`);

    const res = await fetch(`${BACKEND_URL}/api/admin/webinar/${produkId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("🔍 [WEBINAR GET] Backend response status:", res.status);

    const data = await res.json().catch((err) => {
      console.error("❌ [WEBINAR GET] JSON parse error:", err);
      return {};
    });

    console.log("🔍 [WEBINAR GET] Backend response data:", data);

    if (!res.ok) {
      // Jika 404, berarti belum ada webinar untuk produk ini (bukan error)
      if (res.status === 404) {
        return NextResponse.json(
          {
            success: false,
            message: "Belum ada webinar untuk produk ini",
            data: [],
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Gagal mengambil data webinar",
          error: data?.error || data,
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("❌ [WEBINAR GET] API Proxy Error:", error);
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

// PUT handler - untuk update webinar berdasarkan ID webinar
export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID webinar tidak ditemukan" },
        { status: 400 }
      );
    }

    const webinarId = Number(id);
    if (Number.isNaN(webinarId)) {
      return NextResponse.json(
        { success: false, message: "ID webinar tidak valid" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const topic = body.topic ? String(body.topic).trim() : "";
    const start_time = body.start_time ? String(body.start_time).trim() : "";
    const duration = Number(body.duration) || 60;
    const waiting_room = Boolean(body.waiting_room);
    const host_video = Boolean(body.host_video);
    const participant_video = Boolean(body.participant_video);
    const mute_upon_entry = Boolean(body.mute_upon_entry);
    const join_before_host = Boolean(body.join_before_host);

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
      topic,
      start_time,
      duration,
      waiting_room,
      host_video,
      participant_video,
      mute_upon_entry,
      join_before_host,
    };

    // Get authorization token from request
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    console.log("🔍 [WEBINAR PUT] Updating webinar:", webinarId, "with payload:", payload);
    console.log("🔍 [WEBINAR PUT] Backend URL:", `${BACKEND_URL}/api/admin/webinar/${webinarId}`);

    const res = await fetch(`${BACKEND_URL}/api/admin/webinar/${webinarId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    console.log("🔍 [WEBINAR PUT] Backend response status:", res.status);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Gagal mengupdate link Zoom",
          error: data?.error || data,
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("❌ [WEBINAR PUT] API Proxy Error:", error);
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
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    },
  });
}

