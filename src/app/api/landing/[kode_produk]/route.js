import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/config/env";

// Helper: Generate slug dari text
const generateSlug = (text) =>
  (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export async function GET(request, { params }) {
  try {
    const { kode_produk } = await params;

    if (!kode_produk) {
      return NextResponse.json(
        { success: false, message: "Kode produk wajib diisi" },
        { status: 400 }
      );
    }

    // Decode URL encoding
    const decodedKode = decodeURIComponent(kode_produk);
    
    console.log(`[LANDING] Fetching product with kode: ${decodedKode}`);

    // Coba cari produk dengan kode yang diberikan
    let response = await fetch(`${BACKEND_URL}/api/produk/${decodedKode}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    let data = await response.json().catch(() => ({}));

    // Jika tidak ditemukan dan kode mengandung spasi, coba dengan slug
    if (!response.ok || !data.success) {
      const slugKode = generateSlug(decodedKode);
      console.log(`[LANDING] Product not found, trying with slug: ${slugKode}`);
      
      response = await fetch(`${BACKEND_URL}/api/produk/${slugKode}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      data = await response.json().catch(() => ({}));
    }

    // Jika masih tidak ditemukan, coba cari di list produk berdasarkan nama
    if (!response.ok || !data.success) {
      console.log(`[LANDING] Still not found, searching in product list...`);
      
      // Fetch semua produk dan cari yang cocok
      const listResponse = await fetch(`${BACKEND_URL}/api/produk`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const listData = await listResponse.json().catch(() => ({}));
      
      if (listData.data && Array.isArray(listData.data)) {
        const slugKode = generateSlug(decodedKode);
        const decodedLower = decodedKode.toLowerCase();
        
        console.log(`[LANDING] Searching for slug: "${slugKode}" or "${decodedLower}"`);
        
        // Cari produk yang cocok dengan berbagai cara
        const foundProduct = listData.data.find((p) => {
          const productSlug = generateSlug(p.nama);
          const productKode = p.kode ? p.kode.toLowerCase().trim() : "";
          const productKodeSlug = generateSlug(p.kode || ""); // Generate slug dari kode juga
          const productUrl = p.url ? p.url.replace(/^\//, "").toLowerCase().trim() : "";
          
          const matches = (
            // Match by slug generated from nama
            productSlug === slugKode ||
            // Match by url field (paling reliable karena backend simpan dengan benar)
            productUrl === slugKode ||
            productUrl === decodedLower ||
            // Match by kode field (jika ada)
            productKode === slugKode ||
            productKode === decodedLower ||
            // Match by slug generated from kode
            productKodeSlug === slugKode
          );
          
          if (matches) {
            console.log(`[LANDING] ✅ Match found: "${p.nama}" (url: ${p.url}, kode: ${p.kode})`);
          }
          
          return matches;
        });

        if (foundProduct) {
          console.log(`[LANDING] Found product in list: ${foundProduct.nama}`);
          return NextResponse.json({
            success: true,
            data: foundProduct,
          });
        }
      }

      return NextResponse.json(
        {
          success: false,
          message: "Produk tidak ditemukan",
        },
        { status: 404 }
      );
    }

    console.log(`[LANDING] Product found: ${data.data?.nama || data.nama}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[LANDING] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data produk",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

