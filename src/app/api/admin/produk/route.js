export const runtime = "nodejs";

import { NextResponse } from "next/server";
import FormData from "form-data";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://3.105.234.181:8000";

// Image compression settings
const IMAGE_CONFIG = {
  maxWidth: 1600,
  maxHeight: 1600,
  targetSizeKB: 300,        // Target size in KB
  initialQuality: 85,       // Initial quality
  minQuality: 50,          // Minimum quality to try
  qualityStep: 5,          // Quality reduction step
};

// Allowed file extensions (Laravel requirement)
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png"];

// MIME type mapping
const MIME_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
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

/**
 * Extract file extension from filename
 */
const getFileExtension = (filename) => {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : null;
};

/**
 * Validate file extension
 */
const isValidExtension = (extension) => {
  return extension && ALLOWED_EXTENSIONS.includes(extension.toLowerCase());
};

/**
 * Get MIME type from extension
 */
const getMimeTypeFromExtension = (extension) => {
  return MIME_TYPES[extension.toLowerCase()] || "image/jpeg";
};

/**
 * Compress image buffer while maintaining original format
 * Returns compressed buffer or null if compression fails
 */
const compressImage = async (buffer, extension, filename) => {
  const sharp = await getSharp();
  if (!sharp) {
    console.log(`  ⚠️ Sharp not available, skipping compression for ${filename}`);
    return null;
  }

  try {
    const targetSizeBytes = IMAGE_CONFIG.targetSizeKB * 1024;
    const originalSizeKB = (buffer.length / 1024).toFixed(2);
    
    console.log(`  📊 Original size: ${originalSizeKB} KB`);
    
    // If already small enough, return original
    if (buffer.length <= targetSizeBytes) {
      console.log(`  ✅ File already under ${IMAGE_CONFIG.targetSizeKB}KB, skipping compression`);
      return buffer;
    }

    let quality = IMAGE_CONFIG.initialQuality;
    let compressedBuffer;
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
        withoutEnlargement: true,
      });

      // Compress based on format (keep original format)
      if (extension === "png") {
        compressedBuffer = await sharpInstance
          .png({ quality, compressionLevel: 9 })
          .toBuffer();
      } else {
        // jpg/jpeg
        compressedBuffer = await sharpInstance
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
      }

      const sizeKB = (compressedBuffer.length / 1024).toFixed(2);
      console.log(`  🔄 Attempt ${attempts}: Quality ${quality} → ${sizeKB} KB`);

      // If file is small enough or we've tried enough, stop
      if (compressedBuffer.length <= targetSizeBytes || attempts >= maxAttempts) {
        break;
      }

      // Reduce quality for next attempt
      quality = Math.max(quality - IMAGE_CONFIG.qualityStep, IMAGE_CONFIG.minQuality);

    } while (compressedBuffer.length > targetSizeBytes && quality >= IMAGE_CONFIG.minQuality && attempts < maxAttempts);

    const finalSizeKB = (compressedBuffer.length / 1024).toFixed(2);
    const reduction = Math.round((1 - compressedBuffer.length / buffer.length) * 100);

    console.log(`  ✅ Compressed: ${originalSizeKB} KB → ${finalSizeKB} KB (${reduction}% reduction, quality: ${quality})`);

    return compressedBuffer;
  } catch (err) {
    console.error(`  ❌ Compression failed for ${filename}:`, err.message);
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

      // Create new FormData using form-data npm package
      const forwardFormData = new FormData();

      console.log("🟢 [POST_PRODUK] Processing FormData entries (compressing images, keeping original format):");

      // Collect all entries first (FormData entries can only be iterated once)
      // IMPORTANT: Store original values without modification
      const allEntries = [];
      const incomingFields = {};
      const originalValues = new Map(); // Store original values for forwarding
      
      for (const [key, value] of incomingFormData.entries()) {
        allEntries.push({ key, value });
        originalValues.set(key, value); // Store original value
        
        // Store for detailed logging (don't modify original)
        if (value instanceof File) {
          incomingFields[key] = `[File] ${value.name} (${value.size} bytes, ${value.type})`;
        } else {
          // For logging only - preserve original value type
          const logValue = value === null ? "[null]" : value === undefined ? "[undefined]" : String(value);
          incomingFields[key] = logValue.substring(0, 200);
        }
      }
      console.log(`  📊 Total FormData entries: ${allEntries.length}`);
      console.log(`  📋 Entry keys: ${allEntries.map((e) => e.key).join(", ")}`);
      console.log("  📦 [DEBUG] All incoming fields:", JSON.stringify(incomingFields, null, 2));

      // Process all entries
      for (const { key, value } of allEntries) {
        if (value instanceof File && value.size > 0) {
          // Get file extension
          const extension = getFileExtension(value.name);
          const detectedMime = value.type;
          const originalSize = value.size;

          console.log(`\n  📁 Processing file: ${key}`);
          console.log(`    Filename: ${value.name}`);
          console.log(`    Extension: ${extension || "unknown"}`);
          console.log(`    Detected MIME: ${detectedMime}`);
          console.log(`    Original size: ${(originalSize / 1024).toFixed(2)} KB`);

          // Validate extension BEFORE processing
          if (!isValidExtension(extension)) {
            console.error(`  ❌ Invalid file extension: ${extension}`);
            console.error(`    Allowed extensions: ${ALLOWED_EXTENSIONS.join(", ")}`);
            return NextResponse.json(
              {
                success: false,
                message: `File "${value.name}" has invalid extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
                debug: {
                  filename: value.name,
                  extension: extension,
                  allowedExtensions: ALLOWED_EXTENSIONS,
                },
              },
              { status: 400 }
            );
          }

          // Check if it's an image file
          const isImage = value.type.startsWith("image/");

          if (isImage) {
            // Get file buffer
            const arrayBuffer = await value.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Compress image (maintains original format)
            console.log(`  🔄 Compressing ${value.name} (keeping ${extension} format)...`);
            const compressedBuffer = await compressImage(buffer, extension, value.name);

            // Use compressed buffer if available, otherwise use original
            const finalBuffer = compressedBuffer || buffer;
            const finalSize = finalBuffer.length;
            const finalMimeType = getMimeTypeFromExtension(extension);

            console.log(`  ✅ Final file details:`);
            console.log(`    Filename: ${value.name} (extension: .${extension})`);
            console.log(`    MIME type: ${finalMimeType}`);
            console.log(`    Final size: ${(finalSize / 1024).toFixed(2)} KB`);
            console.log(`    Size change: ${originalSize > finalSize ? "reduced" : "unchanged"}`);

            // Append to FormData with proper filename, buffer, and content type
            forwardFormData.append(key, finalBuffer, {
              filename: value.name, // Keep original filename with original extension
              contentType: finalMimeType, // MIME type matching extension
            });

            console.log(`  ✅ Appended to FormData: name="${key}", filename="${value.name}", contentType="${finalMimeType}"`);
          } else {
            // Non-image file, forward as-is
            console.log(`  📁 ${key}: [Non-image File] ${value.name} (${(value.size / 1024).toFixed(2)} KB) - forwarding as-is`);
            const arrayBuffer = await value.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            forwardFormData.append(key, buffer, {
              filename: value.name,
              contentType: value.type || "application/octet-stream",
            });
          }
        } else {
          // Handle all non-file values (string, number, boolean, etc.)
          // CRITICAL: Forward original value WITHOUT modification
          // form-data package automatically converts primitives to string during append
          // We preserve the original value type and let form-data handle conversion
          
          // Log original value for debugging
          let logValue;
          if (value === null) {
            logValue = "[null]";
          } else if (value === undefined) {
            logValue = "[undefined]";
          } else if (typeof value === "string") {
            logValue = value.substring(0, 100) + (value.length > 100 ? "..." : "");
          } else {
            logValue = String(value).substring(0, 100);
          }
          console.log(`  📝 ${key}: ${logValue} (type: ${typeof value})`);
          
          // Handle null/undefined explicitly
          // form-data package doesn't handle null/undefined well, so we need to convert them
          // Also handle string "null" which should not be sent
          if (value === null || value === undefined || (typeof value === "string" && value.trim() === "null")) {
            // For non-critical fields, convert to empty string
            if (value === null) {
              console.warn(`  ⚠️ ${key}: null value converted to empty string for form-data compatibility`);
            } else if (value === undefined) {
              console.warn(`  ⚠️ ${key}: undefined value converted to empty string for form-data compatibility`);
            } else {
              console.warn(`  ⚠️ ${key}: string "null" value converted to empty string for form-data compatibility`);
            }
            forwardFormData.append(key, "");
          } else {
            // For all other types (string, number, boolean), append as-is
            // form-data package will automatically convert to string during transmission
            // This preserves the original value without premature String() conversion
            
            // CRITICAL: Ensure critical fields are sent correctly
            // Based on backend response format:
            // - kategori: "7" (string) - backend expects string
            // - user_input: 11 (number) - backend expects number, but FormData converts to string
            // - assign: "[5]" (string JSON array) - backend expects string JSON
            if (key === "kategori") {
              const stringValue = String(value);
              forwardFormData.append(key, stringValue);
            } else if (key === "user_input") {
              const numValue = typeof value === "number" ? value : Number(value);
              if (!Number.isNaN(numValue)) {
                forwardFormData.append(key, String(numValue));
              } else {
                forwardFormData.append(key, String(value));
              }
            } else if (key === "assign") {
              forwardFormData.append(key, String(value));
            } else {
              forwardFormData.append(key, value);
            }
          }
        }
      }

      const requiredFields = ["kategori", "user_input", "assign", "nama"];
      const missingFields = [];

      for (const field of requiredFields) {
        if (!originalValues.has(field)) {
          missingFields.push(field);
          console.error(`❌ [POST_PRODUK] ${field}: MISSING from incomingFormData`);
          continue;
        }

        const value = originalValues.get(field);
        
        if (field === "kategori") {
          const isValid = value !== null && 
            value !== undefined && 
            value !== "" &&
            String(value).trim() !== "" &&
            String(value).trim() !== "null";
          if (!isValid) {
            missingFields.push(field);
            console.error(`❌ [POST_PRODUK] ${field} is invalid:`, value, `(type: ${typeof value})`);
          }
        } else if (field === "user_input") {
          const isValid = value !== null && 
            value !== undefined && 
            value !== "" &&
            String(value).trim() !== "" &&
            String(value).trim() !== "null";
          if (!isValid) {
            missingFields.push(field);
            console.error(`❌ [POST_PRODUK] ${field} is invalid:`, value, `(type: ${typeof value})`);
          }
        } else if (field === "assign") {
          const isValid = value !== null && 
            value !== undefined && 
            value !== "" &&
            String(value).trim() !== "" &&
            String(value).trim() !== "null" &&
            String(value).trim() !== "[]";
          if (!isValid) {
            missingFields.push(field);
            console.error(`❌ [POST_PRODUK] ${field} is invalid:`, value, `(type: ${typeof value})`);
          }
        } else if (field === "nama") {
          const isValid = value !== null && 
            value !== undefined && 
            String(value).trim() !== "";
          if (!isValid) {
            missingFields.push(field);
            console.error(`❌ [POST_PRODUK] ${field} is invalid:`, value, `(type: ${typeof value})`);
          }
        }
      }

      if (missingFields.length > 0) {
        console.error("❌ [POST_PRODUK] CRITICAL: Missing or invalid required fields in FormData!");
        console.error("  Missing fields:", missingFields);
        console.error("  Full incoming fields:", JSON.stringify(incomingFields, null, 2));
        console.error("  Original values map:", Array.from(originalValues.entries()).map(([k, v]) => ({
          key: k,
          value: v instanceof File ? `[File] ${v.name}` : v,
          type: typeof v
        })));
        
        return NextResponse.json(
          {
            success: false,
            message: `Missing or invalid required fields: ${missingFields.join(", ")}`,
            debug: {
              incomingFields: Object.keys(incomingFields),
              missingFields: missingFields,
              originalValues: Array.from(originalValues.entries()).map(([k, v]) => ({
                key: k,
                hasValue: v !== null && v !== undefined,
                isFile: v instanceof File,
                type: typeof v
              })),
            },
          },
          { status: 400 }
        );
      }

      // Log FormData structure and verify all required fields were appended
      console.log("\n🟢 [POST_PRODUK] FormData structure verification:");
      console.log(`  Total entries processed: ${allEntries.length}`);
      console.log(`  FormData boundary: ${forwardFormData.getBoundary()}`);
      
      // Verify required fields were processed
      console.log("\n🟢 [POST_PRODUK] Required fields verification:");
      for (const field of requiredFields) {
        const wasProcessed = allEntries.some(e => e.key === field);
        const originalValue = originalValues.get(field);
        console.log(`  ${field}: ${wasProcessed ? "✅ Processed" : "❌ NOT PROCESSED"}`);
        if (wasProcessed) {
          console.log(`    Original value: ${originalValue instanceof File ? `[File] ${originalValue.name}` : originalValue}`);
          console.log(`    Original type: ${typeof originalValue}`);
        }
      }

      // Forward FormData to backend with proper headers
      const headers = {
        ...forwardFormData.getHeaders(), // Get proper headers with boundary
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      console.log("\n🟢 [POST_PRODUK] Sending request to backend:");
      console.log(`  URL: ${BACKEND_URL}/api/admin/produk`);
      console.log(`  Method: POST`);
      console.log(`  Content-Type: ${headers["content-type"]}`);
      console.log(`  Has Authorization: ${!!headers.Authorization}`);

      response = await fetch(`${BACKEND_URL}/api/admin/produk`, {
        method: "POST",
        headers,
        body: forwardFormData, // form-data package handles body correctly
      });
    } else {
      // Handle JSON
      const body = await request.json();

      const requiredFields = ["kategori", "user_input", "assign", "nama"];
      const missingFields = [];

      for (const field of requiredFields) {
        if (!body.hasOwnProperty(field) || body[field] === null || body[field] === undefined) {
          missingFields.push(field);
          console.error(`❌ [POST_PRODUK] ${field}: MISSING or null in JSON payload`);
          continue;
        }

        const value = body[field];
        
        if (field === "kategori") {
          const isValid = value !== null && 
            value !== undefined && 
            value !== "" &&
            String(value).trim() !== "" &&
            String(value).trim() !== "null";
          if (!isValid) {
            missingFields.push(field);
            console.error(`❌ [POST_PRODUK] ${field} is invalid:`, value, `(type: ${typeof value})`);
          }
        } else if (field === "user_input") {
          const isValid = value !== null && 
            value !== undefined && 
            (typeof value === "number" || (typeof value === "string" && value.trim() !== "" && value.trim() !== "null"));
          if (!isValid) {
            missingFields.push(field);
            console.error(`❌ [POST_PRODUK] ${field} is invalid:`, value, `(type: ${typeof value})`);
          }
        } else if (field === "assign") {
          const isValid = value !== null && 
            value !== undefined && 
            value !== "" &&
            String(value).trim() !== "" &&
            String(value).trim() !== "null" &&
            String(value).trim() !== "[]";
          if (!isValid) {
            missingFields.push(field);
            console.error(`❌ [POST_PRODUK] ${field} is invalid:`, value, `(type: ${typeof value})`);
          }
        } else if (field === "nama") {
          const isValid = value !== null && 
            value !== undefined && 
            String(value).trim() !== "";
          if (!isValid) {
            missingFields.push(field);
            console.error(`❌ [POST_PRODUK] ${field} is invalid:`, value, `(type: ${typeof value})`);
          }
        }
      }

      if (missingFields.length > 0) {
        console.error("❌ [POST_PRODUK] CRITICAL: Missing or invalid required fields in JSON payload!");
        console.error("  Missing fields:", missingFields);
        console.error("  Full body:", JSON.stringify(body, null, 2));
        
        return NextResponse.json(
          {
            success: false,
            message: `Missing or invalid required fields: ${missingFields.join(", ")}`,
            debug: {
              missingFields: missingFields,
              body: body,
            },
          },
          { status: 400 }
        );
      }

      console.log("🟢 [POST_PRODUK] JSON payload validated:");
      console.log(`    kategori: ✅ (${body.kategori})`);
      console.log(`    user_input: ✅ (${body.user_input})`);
      console.log(`    assign: ✅ (${body.assign})`);
      console.log(`    nama: ✅ (${body.nama})`);

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

    console.log("\n🟢 [POST_PRODUK] Backend response status:", response.status);
    console.log("🟢 [POST_PRODUK] Backend response headers:", JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    // Handle non-JSON responses (e.g., HTML error pages)
    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("❌ [POST_PRODUK] Backend returned non-JSON response:");
      console.error("  Status:", response.status);
      console.error("  Response text (first 1000 chars):", responseText.substring(0, 1000));
      return NextResponse.json(
        {
          success: false,
          message: "Backend error: Response bukan JSON",
          raw_response: responseText.substring(0, 200),
          status: response.status,
        },
        { status: response.status || 500 }
      );
    }

    console.log("🟢 [POST_PRODUK] Backend response data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("❌ [POST_PRODUK] Backend returned error:");
      console.error("  Status:", response.status);
      console.error("  Message:", data?.message);
      console.error("  Errors:", JSON.stringify(data?.errors, null, 2));
      console.error("  Full response:", JSON.stringify(data, null, 2));

      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Gagal membuat produk",
          errors: data?.errors,
          debug: {
            status: response.status,
            backendResponse: data,
          },
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [POST_PRODUK] Unexpected error occurred:");
    console.error("  Error name:", error.name);
    console.error("  Error message:", error.message);
    console.error("  Error stack:", error.stack);
    console.error("  Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Terjadi kesalahan saat membuat produk",
        debug: {
          errorName: error.name,
          errorMessage: error.message,
        },
      },
      { status: 500 }
    );
  }
}
