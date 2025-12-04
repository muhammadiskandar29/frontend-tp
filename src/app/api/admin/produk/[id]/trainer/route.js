export const runtime = "nodejs";

import { NextResponse } from "next/server";
import axios from "axios";
import { BACKEND_URL } from "@/config/env";

/**
 * PUT /api/admin/produk/{id}/trainer
 * Update trainer untuk produk
 * Request: { "trainer": 6 }
 * Response: { success: true, message: "...", data: {...} }
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
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
    const reqBody = await request.json();
    
    console.log(`[TRAINER_UPDATE] ========== PUT /api/admin/produk/${id}/trainer ==========`);
    console.log(`[TRAINER_UPDATE] Request body:`, reqBody);
    
    // Validate request body
    if (!reqBody || typeof reqBody.trainer !== "number") {
      return NextResponse.json(
        { success: false, message: "Trainer ID harus berupa number" },
        { status: 400 }
      );
    }

    // Forward ke backend Laravel
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/produk/${id}/trainer`,
        {
          trainer: reqBody.trainer,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(`[TRAINER_UPDATE] ✅ Backend response:`, response.data);
      
      return NextResponse.json(response.data);
    } catch (axiosError) {
      console.error(`[TRAINER_UPDATE] ❌ Axios error:`, axiosError);
      
      if (axiosError.response) {
        // Backend responded with error
        return NextResponse.json(
          axiosError.response.data || {
            success: false,
            message: "Gagal mengupdate trainer",
          },
          { status: axiosError.response.status }
        );
      } else if (axiosError.request) {
        // Request sent but no response
        console.error(`[TRAINER_UPDATE] ❌ No response from backend`);
        return NextResponse.json(
          {
            success: false,
            message: "Tidak ada response dari backend",
            error: axiosError.message,
          },
          { status: 500 }
        );
      } else {
        // Error setting up request
        console.error(`[TRAINER_UPDATE] ❌ Request setup error:`, axiosError.message);
        throw axiosError;
      }
    }
  } catch (error) {
    console.error(`[TRAINER_UPDATE] ❌ Unexpected error:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Terjadi kesalahan saat mengupdate trainer",
      },
      { status: 500 }
    );
  }
}

