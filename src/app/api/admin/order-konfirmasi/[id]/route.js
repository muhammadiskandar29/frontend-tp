import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/config/env";

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
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
    const contentType = request.headers.get("content-type") || "";

    console.log(`🔍 [ORDER-KONFIRMASI] Confirming payment for order: ${id}`);

    let response;

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData (file upload)
      const formData = await request.formData();
      
      // Create new FormData to forward
      const forwardFormData = new FormData();
      
      // Log and forward all fields
      console.log(`🔍 [ORDER-KONFIRMASI] FormData fields:`);
      for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
          console.log(`  📎 ${key}: [File] ${value.name} (${value.size} bytes)`);
          // Forward file
          const arrayBuffer = await value.arrayBuffer();
          const file = new File([arrayBuffer], value.name, { type: value.type });
          forwardFormData.append(key, file);
        } else if (typeof value === "string") {
          console.log(`  📝 ${key}: ${value}`);
          forwardFormData.append(key, value);
        }
      }

      // Forward to backend
      response = await fetch(`${BACKEND_URL}/api/admin/order-konfirmasi/${id}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: forwardFormData,
      });
    } else {
      // Handle JSON
      const body = await request.json();
      
      console.log(`🔍 [ORDER-KONFIRMASI] JSON body:`, body);

      response = await fetch(`${BACKEND_URL}/api/admin/order-konfirmasi/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    }

    console.log(`🔍 [ORDER-KONFIRMASI] Backend response status:`, response.status);

    // Handle response
    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(`❌ [ORDER-KONFIRMASI] Non-JSON response:`, responseText.substring(0, 500));
      return NextResponse.json(
        {
          success: false,
          message: "Backend error: Response bukan JSON",
          raw_response: responseText.substring(0, 200),
        },
        { status: response.status || 500 }
      );
    }

    console.log(`🔍 [ORDER-KONFIRMASI] Backend response:`, data);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Gagal konfirmasi pembayaran",
          error: data?.error || data,
        },
        { status: response.status }
      );
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: data?.message || "Konfirmasi Pembayaran Sukses",
      data: data?.data || data,
    });
  } catch (error) {
    console.error(`❌ [ORDER-KONFIRMASI] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal konfirmasi pembayaran",
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

