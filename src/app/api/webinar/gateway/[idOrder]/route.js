import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  "https://onedashboardapi-production.up.railway.app";

export async function GET(request, { params }) {
  try {
    const { idOrder } = await params;

    if (!idOrder) {
      return NextResponse.json(
        { success: false, message: "Order ID tidak ditemukan" },
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
    const joinUrl = `${BACKEND_URL}/api/webinar/join-order/${idOrder}`;

    const response = await fetch(joinUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            payload?.message || "Gagal mengambil gateway webinar",
          status: response.status,
        },
        { status: response.status }
      );
    }

    if (!payload?.success || !payload?.data) {
      return NextResponse.json(
        {
          success: false,
          message: payload?.message || "Gateway webinar tidak tersedia",
        },
        { status: 400 }
      );
    }

    const apiData = payload.data;
    const data = {
      meetingNumber: apiData.meetingNumber,
      meetingPassword: apiData.password || apiData.meetingPassword,
      userName: apiData.userName,
      userEmail: apiData.userEmail,
      sdkKey: apiData.sdkKey,
      signature: apiData.signature,
      joinLink:
        apiData.webinar?.join_url ||
        apiData.joinUrl ||
        apiData.joinLink ||
        "",
      produkNama: apiData.produkNama,
      orderId: apiData.orderId,
      webinar: apiData.webinar,
    };

    if (!data.meetingNumber || !data.sdkKey || !data.signature) {
      return NextResponse.json(
        {
          success: false,
          message: "Data gateway tidak lengkap",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[WEBINAR_GATEWAY] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Gagal memuat data gateway webinar",
      },
      { status: 500 }
    );
  }
}

