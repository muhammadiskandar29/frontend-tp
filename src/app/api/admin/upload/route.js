import { NextResponse } from "next/server";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// Upload directory configuration
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Generate unique filename with category prefix
const generateFilename = (originalName, category = "img") => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const baseName = originalName
    .replace(/\.[^/.]+$/, "") // Remove extension
    .replace(/[^a-zA-Z0-9]/g, "-") // Replace non-alphanumeric with dash
    .toLowerCase()
    .substring(0, 30); // Limit length
  return `${category}-${baseName}-${timestamp}-${random}.webp`;
};

// Ensure upload directory exists
const ensureUploadDir = async (subDir = "") => {
  const dir = subDir ? path.join(UPLOAD_DIR, subDir) : UPLOAD_DIR;
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  return dir;
};

// Convert image to WebP
const convertToWebP = async (buffer, quality = 75, options = {}) => {
  let sharpInstance = sharp(buffer);

  // Optional resize
  if (options.width || options.height) {
    sharpInstance = sharpInstance.resize({
      width: options.width,
      height: options.height,
      fit: options.fit || "inside",
      withoutEnlargement: true
    });
  }

  return await sharpInstance
    .webp({ quality })
    .toBuffer();
};

export async function POST(request) {
  try {
    // Validate authorization
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, message: "Content-Type harus multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    
    // Get category for organizing uploads (header, gallery, testimoni, etc.)
    const category = formData.get("category") || "img";
    const quality = parseInt(formData.get("quality") || "75", 10);
    const maxWidth = formData.get("max_width") ? parseInt(formData.get("max_width"), 10) : null;
    const maxHeight = formData.get("max_height") ? parseInt(formData.get("max_height"), 10) : null;

    // Support multiple field names for files
    const fileFields = ["file", "files", "image", "images", "header", "gambar", "foto"];
    const filesToProcess = [];

    for (const fieldName of fileFields) {
      const fieldValue = formData.get(fieldName);
      const fieldValues = formData.getAll(fieldName);

      if (fieldValue && fieldValue instanceof File) {
        filesToProcess.push({ file: fieldValue, fieldName });
      }

      for (const f of fieldValues) {
        if (f instanceof File && !filesToProcess.some(p => p.file === f)) {
          filesToProcess.push({ file: f, fieldName });
        }
      }
    }

    if (filesToProcess.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada file yang di-upload" },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    const uploadDir = await ensureUploadDir(category);

    const uploadedFiles = [];
    const errors = [];

    for (const { file: uploadFile, fieldName } of filesToProcess) {
      try {
        // Validate file type (only images)
        const validTypes = [
          "image/jpeg", 
          "image/jpg", 
          "image/png", 
          "image/gif", 
          "image/webp", 
          "image/bmp", 
          "image/tiff",
          "image/svg+xml"
        ];
        
        if (!validTypes.includes(uploadFile.type)) {
          errors.push({
            filename: uploadFile.name,
            field: fieldName,
            error: `Tipe file tidak didukung: ${uploadFile.type}. Hanya gambar yang diperbolehkan.`
          });
          continue;
        }

        // Skip SVG conversion (can't convert to WebP)
        if (uploadFile.type === "image/svg+xml") {
          errors.push({
            filename: uploadFile.name,
            field: fieldName,
            error: "File SVG tidak dapat dikonversi ke WebP"
          });
          continue;
        }

        // Get file buffer
        const arrayBuffer = await uploadFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convert to WebP
        console.log(`🖼️ [ADMIN_UPLOAD] Converting ${uploadFile.name} to WebP (quality: ${quality})...`);
        
        const webpBuffer = await convertToWebP(buffer, quality, {
          width: maxWidth,
          height: maxHeight,
          fit: "inside"
        });

        // Generate filename and save
        const filename = generateFilename(uploadFile.name, category);
        const filePath = path.join(uploadDir, filename);

        await writeFile(filePath, webpBuffer);

        const publicUrl = category ? `/uploads/${category}/${filename}` : `/uploads/${filename}`;
        
        console.log(`✅ [ADMIN_UPLOAD] Saved: ${filename} (${webpBuffer.length} bytes)`);

        uploadedFiles.push({
          field: fieldName,
          original_name: uploadFile.name,
          original_type: uploadFile.type,
          original_size: uploadFile.size,
          filename: filename,
          path: publicUrl,
          size: webpBuffer.length,
          mime_type: "image/webp",
          category: category
        });
      } catch (fileError) {
        console.error(`❌ [ADMIN_UPLOAD] Error processing ${uploadFile.name}:`, fileError);
        errors.push({
          filename: uploadFile.name,
          field: fieldName,
          error: fileError.message || "Gagal memproses file"
        });
      }
    }

    // Return response
    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Semua file gagal di-upload", 
          errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedFiles.length} file berhasil di-upload dan dikonversi ke WebP`,
      data: uploadedFiles.length === 1 ? uploadedFiles[0] : uploadedFiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("❌ [ADMIN_UPLOAD] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan saat upload" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

