import { NextResponse } from "next/server";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://3.105.234.181:8000";
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

// Generate unique filename
const generateFilename = (originalName, prefix = "img") => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const baseName = originalName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9]/g, "-")
    .toLowerCase()
    .substring(0, 30);
  return `${prefix}-${baseName}-${timestamp}-${random}.webp`;
};

// Ensure upload directory exists
const ensureUploadDir = async () => {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
};

// Convert image to WebP and save
const processAndSaveImage = async (file, prefix = "img") => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Convert to WebP with quality 75
  const webpBuffer = await sharp(buffer)
    .webp({ quality: 75 })
    .toBuffer();
  
  // Generate filename and save
  const filename = generateFilename(file.name, prefix);
  const filePath = path.join(UPLOAD_DIR, filename);
  
  await ensureUploadDir();
  await writeFile(filePath, webpBuffer);
  
  const publicUrl = `/uploads/products/${filename}`;
  
  console.log(`✅ [WEBP] Converted ${file.name} → ${filename} (${webpBuffer.length} bytes)`);
  
  return publicUrl;
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
      
      // Create JSON payload to forward to backend
      const jsonPayload = {};
      const processedImages = {};
      
      console.log("🟢 [POST_PRODUK] Processing FormData entries:");
      
      for (const [key, value] of incomingFormData.entries()) {
        if (value instanceof File && value.size > 0) {
          // Check if it's an image file
          const isImage = value.type.startsWith("image/");
          
          if (isImage) {
            console.log(`  🖼️ ${key}: [Image] ${value.name} (${value.size} bytes, type: ${value.type})`);
            
            try {
              // Determine prefix based on field name
              let prefix = "img";
              if (key === "header" || key.includes("header")) {
                prefix = "header";
              } else if (key.includes("gambar") || key.includes("gallery")) {
                prefix = "gallery";
              } else if (key.includes("testimoni")) {
                prefix = "testimoni";
              }
              
              // Convert to WebP and save locally
              const publicUrl = await processAndSaveImage(value, prefix);
              
              // Store the path for the payload
              if (key.includes("[") && key.includes("]")) {
                // Handle array fields like gambar[0][path], testimoni[1][gambar]
                // Parse the key to extract array name, index, and property
                const match = key.match(/^([^\[]+)\[(\d+)\]\[([^\]]+)\]$/);
                if (match) {
                  const [, arrayName, index, propName] = match;
                  if (!processedImages[arrayName]) {
                    processedImages[arrayName] = {};
                  }
                  if (!processedImages[arrayName][index]) {
                    processedImages[arrayName][index] = {};
                  }
                  processedImages[arrayName][index][propName] = publicUrl;
                }
              } else {
                // Simple field like "header"
                jsonPayload[key] = publicUrl;
              }
            } catch (imgError) {
              console.error(`  ❌ Failed to process ${value.name}:`, imgError);
              // Continue with other files
            }
          } else {
            console.log(`  📁 ${key}: [File] ${value.name} (${value.size} bytes, type: ${value.type}) - Skipped (not an image)`);
          }
        } else if (typeof value === "string") {
          console.log(`  📝 ${key}: ${value.substring(0, 100)}${value.length > 100 ? "..." : ""}`);
          
          // Handle array fields
          if (key.includes("[") && key.includes("]")) {
            const match = key.match(/^([^\[]+)\[(\d+)\]\[([^\]]+)\]$/);
            if (match) {
              const [, arrayName, index, propName] = match;
              if (!processedImages[arrayName]) {
                processedImages[arrayName] = {};
              }
              if (!processedImages[arrayName][index]) {
                processedImages[arrayName][index] = {};
              }
              processedImages[arrayName][index][propName] = value;
            }
          } else {
            jsonPayload[key] = value;
          }
        }
      }
      
      // Convert processedImages objects to arrays
      for (const [arrayName, indexedItems] of Object.entries(processedImages)) {
        const arr = [];
        const indices = Object.keys(indexedItems).map(Number).sort((a, b) => a - b);
        for (const idx of indices) {
          arr.push(indexedItems[idx]);
        }
        if (arr.length > 0) {
          jsonPayload[arrayName] = JSON.stringify(arr);
        }
      }
      
      console.log("🟢 [POST_PRODUK] Final JSON payload keys:", Object.keys(jsonPayload));

      // Forward as JSON to backend
      response = await fetch(`${BACKEND_URL}/api/admin/produk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(jsonPayload),
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

