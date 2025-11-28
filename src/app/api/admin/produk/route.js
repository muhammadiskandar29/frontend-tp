import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://3.105.234.181:8000";

// Image conversion settings - Convert to WEBP
const IMAGE_CONFIG = {
  maxWidth: 1600,           // Max width in pixels (as requested)
  maxHeight: 1600,          // Max height in pixels
  targetSizeKB: 200,        // Target size in KB
  initialQuality: 80,        // Initial quality (70-80 as requested)
  minQuality: 50,           // Minimum quality to try
  qualityStep: 5,           // Quality reduction step
};

// Supported image formats
const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/jpg", 
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/heic",
  "image/heif",
];

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

// Convert image to WebP with compression
// Iteratively reduces quality if file is still too large
const convertToWebP = async (buffer, mimeType, filename) => {
  const sharp = await getSharp();
  if (!sharp) return null;
  
  try {
    const targetSizeBytes = IMAGE_CONFIG.targetSizeKB * 1024;
    let quality = IMAGE_CONFIG.initialQuality;
    let webpBuffer;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      attempts++;
      let sharpInstance = sharp(buffer);
      
      // Resize if too large (maintain aspect ratio)
      sharpInstance = sharpInstance.resize({
        width: IMAGE_CONFIG.maxWidth,
        height: IMAGE_CONFIG.maxHeight,
        fit: "inside",
        withoutEnlargement: true, // Don't upscale small images
      });
      
      // Convert to WebP with current quality
      webpBuffer = await sharpInstance
        .webp({ quality })
        .toBuffer();
      
      const sizeKB = (webpBuffer.length / 1024).toFixed(2);
      console.log(`  🔄 Attempt ${attempts}: Quality ${quality} → ${sizeKB} KB`);
      
      // If file is small enough or we've tried enough, stop
      if (webpBuffer.length <= targetSizeBytes || attempts >= maxAttempts) {
        break;
      }
      
      // Reduce quality for next attempt
      quality = Math.max(quality - IMAGE_CONFIG.qualityStep, IMAGE_CONFIG.minQuality);
      
    } while (webpBuffer.length > targetSizeBytes && quality >= IMAGE_CONFIG.minQuality && attempts < maxAttempts);
    
    const originalSizeKB = (buffer.length / 1024).toFixed(2);
    const finalSizeKB = (webpBuffer.length / 1024).toFixed(2);
    const reduction = Math.round((1 - webpBuffer.length / buffer.length) * 100);
    
    console.log(`  ✅ Converted to WebP: ${originalSizeKB} KB → ${finalSizeKB} KB (${reduction}% reduction, quality: ${quality})`);
    
    return webpBuffer;
  } catch (err) {
    console.error(`❌ WebP conversion failed for ${filename}:`, err.message);
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
      // Convert images to WebP in frontend before sending to backend
      const incomingFormData = await request.formData();
      
      // Create new FormData to forward to backend with WebP converted images
      const forwardFormData = new FormData();
      
      console.log("🟢 [POST_PRODUK] Processing FormData entries (converting images to WebP):");
      
      for (const [key, value] of incomingFormData.entries()) {
        if (value instanceof File && value.size > 0) {
          // Check if it's an image file
          const isImage = value.type.startsWith("image/");
          
          if (isImage) {
            console.log(`  🖼️ ${key}: [Image] ${value.name} (${(value.size / 1024).toFixed(2)} KB, type: ${value.type})`);
            
            // Get file buffer
            const arrayBuffer = await value.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Convert to WebP with compression
            console.log(`  🔄 Converting ${value.name} to WebP...`);
            const webpBuffer = await convertToWebP(buffer, value.type, value.name);
            
            if (webpBuffer) {
              // Conversion successful - create File with WebP format
              // Keep original filename but change extension to .webp
              const webpFilename = value.name.replace(/\.[^/.]+$/, "") + ".webp";
              const webpFile = new File([new Uint8Array(webpBuffer)], webpFilename, { 
                type: "image/webp",
                lastModified: value.lastModified || Date.now()
              });
              
              forwardFormData.append(key, webpFile);
              console.log(`  ✅ Converted to WebP: ${value.name} → ${webpFilename} (${(value.size / 1024).toFixed(2)} KB → ${(webpBuffer.length / 1024).toFixed(2)} KB)`);
            } else {
              // Conversion failed - use original
              console.log(`  ⚠️ Conversion failed, using original: ${value.name}`);
              forwardFormData.append(key, value);
            }
          } else {
            // Non-image file, forward as-is
            console.log(`  📁 ${key}: [File] ${value.name} (${(value.size / 1024).toFixed(2)} KB) - forwarding as-is`);
            forwardFormData.append(key, value);
          }
        } else if (typeof value === "string") {
          console.log(`  📝 ${key}: ${value.substring(0, 100)}${value.length > 100 ? "..." : ""}`);
          forwardFormData.append(key, value);
        }
      }
      
      console.log("🟢 [POST_PRODUK] Forwarding FormData to backend (images converted to WebP)...");

      // Forward FormData to backend
      response = await fetch(`${BACKEND_URL}/api/admin/produk`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type, let fetch set it with boundary automatically
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

