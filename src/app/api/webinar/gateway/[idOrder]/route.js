import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  "https://onedashboardapi-production.up.railway.app";

function extractValue(source, key) {
  const regex = new RegExp(
    `const\\s+${key}\\s*=\\s*["'\`]{1}([^"'\`]+)["'\`]{1}`,
    "i"
  );
  const match = source.match(regex);
  return match ? match[1] : "";
}

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
    const joinUrl = `${BACKEND_URL}/customer/order/${idOrder}/join?token=${encodeURIComponent(
      token
    )}`;

    const response = await fetch(joinUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil gateway webinar",
          status: response.status,
        },
        { status: response.status }
      );
    }

    const html = await response.text();

    const data = {
      meetingNumber: extractValue(html, "meetingNumber"),
      meetingPassword: extractValue(html, "meetingPassword"),
      userName: extractValue(html, "userName"),
      userEmail: extractValue(html, "userEmail"),
      sdkKey: extractValue(html, "sdkKey"),
      signature: extractValue(html, "signature"),
      joinLink: joinUrl,
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

