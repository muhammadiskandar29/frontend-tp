import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://3.105.234.181:8000";

// Image compression settings
const IMAGE_CONFIG = {
  maxWidth: 1920,      // Max width in pixels
  maxHeight: 1080,     // Max height in pixels  
  jpegQuality: 80,     // JPEG quality (1-100)
  pngCompressionLevel: 8, // PNG compression (0-9)
};

// Dynamic import sharp
let sharpModule = null;

const getSharp = async () => {
  if (sharpModule === null) {
    try {
      sharpModule = (await import("sharp")).default;
      console.log("✅ Sharp loaded successfully");
    } catch (err) {
      console.warn("⚠️ Sharp not available:", err.message);
      sharpModule = false;
    }
  }
  return sharpModule;
};

// Compress image while keeping original format
const compressImage = async (buffer, mimeType, filename) => {
  const sharp = await getSharp();
  if (!sharp) return null;
  
  try {
    let sharpInstance = sharp(buffer);
    
    // Resize if too large (maintain aspect ratio)
    sharpInstance = sharpInstance.resize({
      width: IMAGE_CONFIG.maxWidth,
      height: IMAGE_CONFIG.maxHeight,
      fit: "inside",
      withoutEnlargement: true, // Don't upscale small images
    });
    
    // Compress based on format
    if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
      sharpInstance = sharpInstance.jpeg({ quality: IMAGE_CONFIG.jpegQuality });
    } else if (mimeType === "image/png") {
      sharpInstance = sharpInstance.png({ compressionLevel: IMAGE_CONFIG.pngCompressionLevel });
    }
    
    const compressedBuffer = await sharpInstance.toBuffer();
    
    console.log(`  📦 Compressed: ${buffer.length} → ${compressedBuffer.length} bytes (${Math.round((1 - compressedBuffer.length / buffer.length) * 100)}% reduction)`);
    
    return compressedBuffer;
  } catch (err) {
    console.error("❌ Compression failed:", err.message);
    return null;
  }
};

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    console.log("🟢 [GET_PRODUK] Fetching products...");

    // Forward ke backend
    const response = await fetch(`${BACKEND_URL}/api/admin/produk`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    console.log("🟢 [GET_PRODUK] Backend response:", data);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data?.message || "Gagal mengambil produk" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [GET_PRODUK] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan saat mengambil produk" },
      { status: 500 }
    );
  }
}

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
    const contentType = request.headers.get("content-type") || "";

    console.log("🟢 [POST_PRODUK] Creating product...");
    console.log("🟢 [POST_PRODUK] Content-Type:", contentType);

    let response;

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData (file uploads)
      const incomingFormData = await request.formData();
      
      // Create new FormData to forward to backend with converted images
      const forwardFormData = new FormData();
      
      console.log("🟢 [POST_PRODUK] Processing FormData entries:");
      
      for (const [key, value] of incomingFormData.entries()) {
        if (value instanceof File && value.size > 0) {
          // Check if it's an image file
          const isImage = value.type.startsWith("image/");
          
          if (isImage) {
            console.log(`  🖼️ ${key}: [Image] ${value.name} (${value.size} bytes, type: ${value.type})`);
            
            // Get file buffer
            const arrayBuffer = await value.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Try to compress image (keeps original format)
            console.log(`  🔄 Compressing ${value.name}...`);
            const compressedBuffer = await compressImage(buffer, value.type, value.name);
            
            if (compressedBuffer) {
              // Compression successful
              const compressedFile = new File([compressedBuffer], value.name, { type: value.type });
              forwardFormData.append(key, compressedFile);
              console.log(`  ✅ Compressed: ${value.name} (${value.size} → ${compressedBuffer.length} bytes)`);
            } else {
              // Compression failed - use original
              const file = new File([buffer], value.name, { type: value.type });
              forwardFormData.append(key, file);
              console.log(`  ⚠️ Using original: ${value.name} (${value.size} bytes)`);
            }
          } else {
            // Non-image file, forward as-is
            console.log(`  📁 ${key}: [File] ${value.name} (${value.size} bytes) - forwarding as-is`);
            const arrayBuffer = await value.arrayBuffer();
            const file = new File([arrayBuffer], value.name, { type: value.type });
            forwardFormData.append(key, file);
          }
        } else if (typeof value === "string") {
          console.log(`  📝 ${key}: ${value.substring(0, 100)}${value.length > 100 ? "..." : ""}`);
          forwardFormData.append(key, value);
        }
      }
      
      console.log("🟢 [POST_PRODUK] Forwarding FormData to backend...");

      // Forward FormData to backend
      response = await fetch(`${BACKEND_URL}/api/admin/produk`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type, let fetch set it with boundary
        },
        body: forwardFormData,
      });
    } else {
      // Handle JSON
      const body = await request.json();
      
      console.log("🟢 [POST_PRODUK] JSON body:", body);

      response = await fetch(`${BACKEND_URL}/api/admin/produk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    }

    console.log("🟢 [POST_PRODUK] Backend response status:", response.status);

    // Handle non-JSON responses (e.g., HTML error pages)
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("❌ [POST_PRODUK] Backend returned non-JSON response:", responseText.substring(0, 500));
      return NextResponse.json(
        { 
          success: false, 
          message: "Backend error: Response bukan JSON", 
          raw_response: responseText.substring(0, 200) 
        },
        { status: response.status || 500 }
      );
    }

    console.log("🟢 [POST_PRODUK] Backend response:", data);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data?.message || "Gagal membuat produk", errors: data?.errors },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [POST_PRODUK] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan saat membuat produk" },
      { status: 500 }
    );
  }
}

