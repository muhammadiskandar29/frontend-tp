export const runtime = "nodejs";

import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://3.105.234.181:8000";

// Image compression settings
const IMAGE_CONFIG = {
  maxWidth: 1600,
  maxHeight: 1600,
  targetSizeKB: 1000, // 1MB
  initialQuality: 85,
  minQuality: 50,
  qualityStep: 5,
};

// Allowed file extensions
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
 * Compress image buffer while maintaining original format
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

      sharpInstance = sharpInstance.resize({
        width: IMAGE_CONFIG.maxWidth,
        height: IMAGE_CONFIG.maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      });

      if (extension === "png") {
        compressedBuffer = await sharpInstance
          .png({ quality, compressionLevel: 9 })
          .toBuffer();
      } else {
        compressedBuffer = await sharpInstance
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
      }

      const sizeKB = (compressedBuffer.length / 1024).toFixed(2);
      console.log(`  🔄 Attempt ${attempts}: Quality ${quality} → ${sizeKB} KB`);

      if (compressedBuffer.length <= targetSizeBytes || attempts >= maxAttempts) {
        break;
      }

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

/**
 * Utility: Convert File to base64 string
 */
const convertFileToBase64 = async (file) => {
  if (!file || !(file instanceof File) || file.size === 0) {
    return null;
  }

  try {
    const extension = getFileExtension(file.name);
    
    // Validate extension
    if (!isValidExtension(extension)) {
      console.error(`  ❌ Invalid file extension: ${extension}`);
      throw new Error(`File "${file.name}" has invalid extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
    }

    // Get file buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // Compress if it's an image
    if (file.type.startsWith("image/")) {
      console.log(`  🔄 Compressing ${file.name}...`);
      const compressedBuffer = await compressImage(buffer, extension, file.name);
      if (compressedBuffer) {
        buffer = compressedBuffer;
      }
    }

    // Convert to base64
    const base64 = buffer.toString("base64");
    const mimeType = file.type || MIME_TYPES[extension] || "image/jpeg";
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`  ❌ Failed to convert file to base64: ${error.message}`);
    throw error;
  }
};

/**
 * Utility: Safe JSON parse with fallback
 */
const safeParseJSON = (input, fallback = null) => {
  if (input === null || input === undefined || input === "") {
    return fallback;
  }

  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch {
      return fallback;
    }
  }

  if (Array.isArray(input) || typeof input === "object") {
    return input;
  }

  return fallback;
};

/**
 * Utility: Normalize number value
 */
const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  return isNaN(num) ? null : num;
};

/**
 * Extract and structure payload from FormData
 */
const extractPayloadFromFormData = async (formData) => {
  const payload = {
    kategori: null,
    user_input: null,
    nama: "",
    kode: "",
    url: "",
    deskripsi: "",
    harga_asli: null,
    harga_coret: null,
    tanggal_event: null,
    landingpage: null,
    status: 1,
    assign: [],
    list_point: [],
    custom_field: [],
    event_fb_pixel: [],
    fb_pixel: [],
    gtm: [],
    video: [],
    gambar: [],
    testimoni: [],
    header: null,
  };

  // Collect all entries
  const entries = {};
  for (const [key, value] of formData.entries()) {
    if (!entries[key]) {
      entries[key] = [];
    }
    entries[key].push(value);
  }

  // Process header (single file)
  if (entries.header && entries.header[0] instanceof File) {
    const headerBase64 = await convertFileToBase64(entries.header[0]);
    if (headerBase64) {
      payload.header = headerBase64;
    }
  }

  // Process kategori
  if (entries.kategori && entries.kategori[0]) {
    payload.kategori = normalizeNumber(entries.kategori[0]);
  }

  // Process user_input
  if (entries.user_input && entries.user_input[0]) {
    payload.user_input = normalizeNumber(entries.user_input[0]);
  }

  // Process nama
  if (entries.nama && entries.nama[0]) {
    payload.nama = String(entries.nama[0]).trim();
  }

  // Process kode
  if (entries.kode && entries.kode[0]) {
    payload.kode = String(entries.kode[0]).trim();
  }

  // Process url
  if (entries.url && entries.url[0]) {
    payload.url = String(entries.url[0]).trim();
  }

  // Process deskripsi
  if (entries.deskripsi && entries.deskripsi[0]) {
    payload.deskripsi = String(entries.deskripsi[0]);
  }

  // Process harga_asli
  if (entries.harga_asli && entries.harga_asli[0]) {
    payload.harga_asli = normalizeNumber(entries.harga_asli[0]);
  }

  // Process harga_coret
  if (entries.harga_coret && entries.harga_coret[0]) {
    payload.harga_coret = normalizeNumber(entries.harga_coret[0]);
  }

  // Process tanggal_event
  if (entries.tanggal_event && entries.tanggal_event[0]) {
    payload.tanggal_event = String(entries.tanggal_event[0]).trim();
  }

  // Process landingpage
  if (entries.landingpage && entries.landingpage[0]) {
    payload.landingpage = normalizeNumber(entries.landingpage[0]);
  }

  // Process status
  if (entries.status && entries.status[0]) {
    payload.status = normalizeNumber(entries.status[0]) || 1;
  }

  // Process assign
  if (entries.assign && entries.assign[0]) {
    const assignParsed = safeParseJSON(entries.assign[0], []);
    payload.assign = Array.isArray(assignParsed) 
      ? assignParsed.map(normalizeNumber).filter(n => n !== null) 
      : [];
  }

  // Process list_point
  if (entries.list_point && entries.list_point[0]) {
    const listPointParsed = safeParseJSON(entries.list_point[0], []);
    if (Array.isArray(listPointParsed)) {
      payload.list_point = listPointParsed
        .filter(item => item && typeof item === "object")
        .map(item => ({
          nama: typeof item.nama === "string" ? item.nama.trim() : "",
        }));
    }
  }

  // Process custom_field
  if (entries.custom_field && entries.custom_field[0]) {
    const customFieldParsed = safeParseJSON(entries.custom_field[0], []);
    if (Array.isArray(customFieldParsed)) {
      payload.custom_field = customFieldParsed
        .filter(item => item && typeof item === "object")
        .map((item, idx) => ({
          nama_field: typeof item.nama_field === "string" ? item.nama_field.trim() : "",
          urutan: normalizeNumber(item.urutan) || (idx + 1),
        }));
    }
  }

  // Process event_fb_pixel
  if (entries.event_fb_pixel && entries.event_fb_pixel[0]) {
    const eventFbPixelParsed = safeParseJSON(entries.event_fb_pixel[0], []);
    if (Array.isArray(eventFbPixelParsed)) {
      payload.event_fb_pixel = eventFbPixelParsed
        .filter(item => item && typeof item === "object")
        .map(item => ({
          event: typeof item.event === "string" ? item.event.trim() : "",
        }));
    }
  }

  // Process fb_pixel
  if (entries.fb_pixel && entries.fb_pixel[0]) {
    const fbPixelParsed = safeParseJSON(entries.fb_pixel[0], []);
    payload.fb_pixel = Array.isArray(fbPixelParsed) 
      ? fbPixelParsed.map(normalizeNumber).filter(n => n !== null) 
      : [];
  }

  // Process gtm
  if (entries.gtm && entries.gtm[0]) {
    const gtmParsed = safeParseJSON(entries.gtm[0], []);
    payload.gtm = Array.isArray(gtmParsed) 
      ? gtmParsed.map(normalizeNumber).filter(n => n !== null) 
      : [];
  }

  // Process video
  if (entries.video && entries.video[0]) {
    const videoParsed = safeParseJSON(entries.video[0], []);
    payload.video = Array.isArray(videoParsed) 
      ? videoParsed.filter(v => typeof v === "string" && v.trim() !== "").map(v => v.trim())
      : [];
  }

  // Process gambar (array with files)
  const gambarKeys = Object.keys(entries).filter(k => k.startsWith("gambar["));
  const gambarIndices = new Set();
  gambarKeys.forEach(key => {
    const match = key.match(/gambar\[(\d+)\]/);
    if (match) gambarIndices.add(parseInt(match[1]));
  });

  for (const idx of Array.from(gambarIndices).sort((a, b) => a - b)) {
    const pathKey = `gambar[${idx}][path]`;
    const captionKey = `gambar[${idx}][caption]`;
    
    let pathBase64 = null;
    if (entries[pathKey] && entries[pathKey][0] instanceof File) {
      pathBase64 = await convertFileToBase64(entries[pathKey][0]);
    }

    const caption = entries[captionKey] && entries[captionKey][0] 
      ? String(entries[captionKey][0]).trim() 
      : "";

    payload.gambar.push({
      path: pathBase64,
      caption: caption,
    });
  }

  // Process testimoni (array with files)
  const testimoniKeys = Object.keys(entries).filter(k => k.startsWith("testimoni["));
  const testimoniIndices = new Set();
  testimoniKeys.forEach(key => {
    const match = key.match(/testimoni\[(\d+)\]/);
    if (match) testimoniIndices.add(parseInt(match[1]));
  });

  for (const idx of Array.from(testimoniIndices).sort((a, b) => a - b)) {
    const gambarKey = `testimoni[${idx}][gambar]`;
    const namaKey = `testimoni[${idx}][nama]`;
    const deskripsiKey = `testimoni[${idx}][deskripsi]`;
    
    let gambarBase64 = null;
    if (entries[gambarKey] && entries[gambarKey][0] instanceof File) {
      gambarBase64 = await convertFileToBase64(entries[gambarKey][0]);
    }

    const nama = entries[namaKey] && entries[namaKey][0] 
      ? String(entries[namaKey][0]).trim() 
      : "";
    
    const deskripsi = entries[deskripsiKey] && entries[deskripsiKey][0] 
      ? String(entries[deskripsiKey][0]).trim() 
      : "";

    payload.testimoni.push({
      gambar: gambarBase64,
      nama: nama,
      deskripsi: deskripsi,
    });
  }

  return payload;
};

/**
 * Validate required fields
 */
const validatePayload = (payload) => {
  const errors = [];

  if (payload.kategori === null || payload.kategori === undefined) {
    errors.push("kategori wajib diisi (number)");
  }

  if (payload.user_input === null || payload.user_input === undefined) {
    errors.push("user_input wajib diisi (number)");
  }

  if (typeof payload.nama !== "string" || payload.nama.trim() === "") {
    errors.push("nama wajib diisi (string)");
  }

  if (typeof payload.url !== "string" || payload.url.trim() === "") {
    errors.push("url wajib diisi (string)");
  }

  if (typeof payload.kode !== "string" || payload.kode.trim() === "") {
    errors.push("kode wajib diisi (string)");
  }

  // Header validation - must be provided and must be a valid image
  if (!payload.header || typeof payload.header !== "string" || payload.header.trim() === "" || !payload.header.startsWith("data:image/")) {
    errors.push("The header must be an image.");
  }

  return errors;
};

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

    let payload;

    // Handle FormData
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      payload = await extractPayloadFromFormData(formData);
    } else {
      // Handle JSON request
      const reqBody = await request.json();
      
      // For JSON, we still need to process it similarly
      payload = {
        kategori: normalizeNumber(reqBody.kategori),
        user_input: normalizeNumber(reqBody.user_input),
        nama: typeof reqBody.nama === "string" ? reqBody.nama.trim() : "",
        kode: typeof reqBody.kode === "string" ? reqBody.kode.trim() : "",
        url: typeof reqBody.url === "string" ? reqBody.url.trim() : "",
        deskripsi: typeof reqBody.deskripsi === "string" ? reqBody.deskripsi : "",
        harga_asli: normalizeNumber(reqBody.harga_asli),
        harga_coret: normalizeNumber(reqBody.harga_coret),
        tanggal_event: typeof reqBody.tanggal_event === "string" ? reqBody.tanggal_event : null,
        landingpage: normalizeNumber(reqBody.landingpage),
        status: normalizeNumber(reqBody.status) || 1,
        assign: [],
        list_point: [],
        custom_field: [],
        event_fb_pixel: [],
        fb_pixel: [],
        gtm: [],
        video: [],
        gambar: [],
        testimoni: [],
        header: null,
      };

      // Handle header (base64 string)
      if (reqBody.header && typeof reqBody.header === "string" && reqBody.header.trim() !== "") {
        let headerValue = reqBody.header.trim();
        if (!headerValue.startsWith("data:")) {
          headerValue = `data:image/jpeg;base64,${headerValue}`;
        }
        payload.header = headerValue;
      }

      // Parse arrays
      const assignParsed = safeParseJSON(reqBody.assign, []);
      payload.assign = Array.isArray(assignParsed) ? assignParsed.map(normalizeNumber).filter(n => n !== null) : [];

      const listPointParsed = safeParseJSON(reqBody.list_point, []);
      if (Array.isArray(listPointParsed)) {
        payload.list_point = listPointParsed
          .filter(item => item && typeof item === "object")
          .map(item => ({
            nama: typeof item.nama === "string" ? item.nama.trim() : "",
          }));
      }

      const customFieldParsed = safeParseJSON(reqBody.custom_field, []);
      if (Array.isArray(customFieldParsed)) {
        payload.custom_field = customFieldParsed
          .filter(item => item && typeof item === "object")
          .map((item, idx) => ({
            nama_field: typeof item.nama_field === "string" ? item.nama_field.trim() : "",
            urutan: normalizeNumber(item.urutan) || (idx + 1),
          }));
      }

      const eventFbPixelParsed = safeParseJSON(reqBody.event_fb_pixel, []);
      if (Array.isArray(eventFbPixelParsed)) {
        payload.event_fb_pixel = eventFbPixelParsed
          .filter(item => item && typeof item === "object")
          .map(item => ({
            event: typeof item.event === "string" ? item.event.trim() : "",
          }));
      }

      const fbPixelParsed = safeParseJSON(reqBody.fb_pixel, []);
      payload.fb_pixel = Array.isArray(fbPixelParsed) ? fbPixelParsed.map(normalizeNumber).filter(n => n !== null) : [];

      const gtmParsed = safeParseJSON(reqBody.gtm, []);
      payload.gtm = Array.isArray(gtmParsed) ? gtmParsed.map(normalizeNumber).filter(n => n !== null) : [];

      const videoParsed = safeParseJSON(reqBody.video, []);
      payload.video = Array.isArray(videoParsed) 
        ? videoParsed.filter(v => typeof v === "string" && v.trim() !== "").map(v => v.trim())
        : [];

      // Handle gambar
      const gambarParsed = safeParseJSON(reqBody.gambar, []);
      if (Array.isArray(gambarParsed)) {
        for (const item of gambarParsed) {
          if (item && typeof item === "object") {
            payload.gambar.push({
              caption: typeof item.caption === "string" ? item.caption.trim() : "",
              path: typeof item.path === "string" && item.path.trim() !== "" ? item.path : null,
            });
          }
        }
      }

      // Handle testimoni
      const testimoniParsed = safeParseJSON(reqBody.testimoni, []);
      if (Array.isArray(testimoniParsed)) {
        for (const item of testimoniParsed) {
          if (item && typeof item === "object") {
            let gambarBase64 = null;
            if (typeof item.gambar === "string" && item.gambar.trim() !== "") {
              gambarBase64 = item.gambar;
            }

            payload.testimoni.push({
              nama: typeof item.nama === "string" ? item.nama.trim() : "",
              deskripsi: typeof item.deskripsi === "string" ? item.deskripsi.trim() : "",
              gambar: gambarBase64,
            });
          }
        }
      }
    }

    // Validate payload
    const validationErrors = validatePayload(payload);

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: validationErrors.join(". "),
          errors: {},
          errorFields: [],
        },
        { status: 400 }
      );
    }

    // Hapus header jika null sebelum dikirim ke backend
    const payloadToSend = { ...payload };
    if (payloadToSend.header === null || payloadToSend.header === undefined || payloadToSend.header === "") {
      delete payloadToSend.header;
    }

    // Log payload untuk debugging (tanpa base64 yang panjang)
    const logPayload = { ...payloadToSend };
    if (logPayload.header) {
      logPayload.header = logPayload.header.substring(0, 50) + "... (base64 truncated)";
    }
    if (logPayload.gambar) {
      logPayload.gambar = logPayload.gambar.map(g => ({
        ...g,
        path: g.path ? (g.path.substring(0, 50) + "... (base64 truncated)") : null
      }));
    }
    if (logPayload.testimoni) {
      logPayload.testimoni = logPayload.testimoni.map(t => ({
        ...t,
        gambar: t.gambar ? (t.gambar.substring(0, 50) + "... (base64 truncated)") : null
      }));
    }
    console.log("📤 [POST_PRODUK2] Sending payload to backend:", JSON.stringify(logPayload, null, 2));

    // Send to backend
    const response = await fetch(`${BACKEND_URL}/api/admin/produk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payloadToSend),
    });

    // Handle response
    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
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

    if (!response.ok) {
      // Extract errors
      let extractedErrors = {};
      let extractedErrorFields = [];

      if (data?.errors && typeof data.errors === "object") {
        extractedErrors = data.errors;
        extractedErrorFields = Object.keys(data.errors);
      } else if (data?.data?.errors && typeof data.data.errors === "object") {
        extractedErrors = data.data.errors;
        extractedErrorFields = Object.keys(data.data.errors);
      }

      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Gagal membuat produk",
          errors: extractedErrors,
          errorFields: extractedErrorFields,
        },
        { status: response.status }
      );
    }

    // Success response - return as is from backend
    return NextResponse.json(data);

  } catch (error) {
    console.error("❌ [POST_PRODUK2] Error:", error.message);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Terjadi kesalahan saat membuat produk",
      },
      { status: 500 }
    );
  }
}
