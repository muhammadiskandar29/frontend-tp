export const runtime = "nodejs";

import { NextResponse } from "next/server";
import FormData from "form-data";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://3.105.234.181:8000";

// Handle PUT request
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
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const contentType = request.headers.get("content-type") || "";

    console.log(`[PRODUK PUT] Product ID: ${id}`);
    console.log(`[PRODUK PUT] Content-Type: ${contentType}`);

    let response;

    if (contentType.includes("multipart/form-data")) {
      // FormData - ada file yang diupload
      const formData = await request.formData();
      
      // Tambahkan _method=PUT untuk Laravel
      formData.append("_method", "PUT");
      
      // Log untuk debug - KHUSUS CEK KODE
      const kodeValue = formData.get("kode");
      const urlValue = formData.get("url");
      console.log(`[PRODUK PUT] ========== KODE DEBUG ==========`);
      console.log(`[PRODUK PUT] 🔧 KODE yang diterima frontend API: "${kodeValue}"`);
      console.log(`[PRODUK PUT] 🔧 URL yang diterima frontend API: "${urlValue}"`);
      console.log(`[PRODUK PUT] 🔧 Kode pakai dash? ${kodeValue?.includes("-") ? "YA ✅" : "TIDAK ❌"}`);
      
      console.log(`[PRODUK PUT] FormData fields:`);
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${String(value).substring(0, 100)}`);
        }
      }

      // Forward ke backend Laravel menggunakan POST dengan _method=PUT (untuk file upload)
      response = await fetch(`${BACKEND_URL}/api/admin/produk/${id}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    } else {
      // JSON body - tidak ada file baru, gunakan PUT langsung
      const jsonBody = await request.json();
      
      // Log untuk debug - KHUSUS CEK KODE
      console.log(`[PRODUK PUT] ========== KODE DEBUG ==========`);
      console.log(`[PRODUK PUT] 🔧 KODE yang diterima frontend API: "${jsonBody.kode}"`);
      console.log(`[PRODUK PUT] 🔧 URL yang diterima frontend API: "${jsonBody.url}"`);
      console.log(`[PRODUK PUT] 🔧 Kode pakai dash? ${jsonBody.kode?.includes("-") ? "YA ✅" : "TIDAK ❌"}`);
      console.log(`[PRODUK PUT] JSON body:`, JSON.stringify(jsonBody).substring(0, 500));

      // Coba PUT dulu, jika tidak work, fallback ke POST dengan _method
      response = await fetch(`${BACKEND_URL}/api/admin/produk/${id}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonBody),
      });

      // Jika PUT tidak supported (405), coba POST dengan _method=PUT
      if (response.status === 405) {
        console.log(`[PRODUK PUT] PUT not supported, trying POST with _method=PUT`);
        response = await fetch(`${BACKEND_URL}/api/admin/produk/${id}`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...jsonBody, _method: "PUT" }),
        });
      }
    }

    const data = await response.json().catch(() => ({}));

    console.log(`[PRODUK PUT] Backend response:`, response.status);
    console.log(`[PRODUK PUT] Response data:`, JSON.stringify(data).substring(0, 500));

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Gagal memperbarui produk",
          error: data?.error || data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[PRODUK PUT] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat memperbarui produk",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Handle POST untuk update produk (sama seperti POST /api/admin/produk tapi dengan id)
export async function POST(request, { params }) {
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
    const contentType = request.headers.get("content-type") || "";

    let response;

    // Handle FormData request (sama seperti POST /api/admin/produk)
    if (contentType.includes("multipart/form-data")) {
      // Forward FormData langsung ke backend Laravel
      const incomingFormData = await request.formData();
      
      // DEBUG: Log incoming FormData
      console.log(`[ROUTE_UPDATE] ========== INCOMING FORMDATA (ID: ${id}) ==========`);
      const incomingEntries = [];
      const incomingJSON = {};
      
      for (const [key, value] of incomingFormData.entries()) {
        if (value instanceof File) {
          incomingEntries.push({ key, type: "File", name: value.name, size: `${(value.size / 1024).toFixed(2)} KB` });
          incomingJSON[key] = {
            type: "File",
            name: value.name,
            size: `${(value.size / 1024).toFixed(2)} KB`,
            sizeBytes: value.size,
            mimeType: value.type
          };
        } else {
          const str = String(value);
          incomingEntries.push({ key, type: "String", value: str.length > 100 ? str.substring(0, 100) + "..." : str });
          
          // Try to parse JSON strings for better readability
          try {
            const parsed = JSON.parse(str);
            incomingJSON[key] = parsed;
          } catch {
            incomingJSON[key] = str.length > 200 ? str.substring(0, 200) + "..." : str;
          }
        }
      }
      console.table(incomingEntries);
      
      // Tampilkan sebagai JSON yang readable
      console.log(`[ROUTE_UPDATE] ========== INCOMING FORMDATA AS JSON (ID: ${id}) ==========`);
      console.log(JSON.stringify(incomingJSON, null, 2));
      console.log(`[ROUTE_UPDATE] ==============================================`);
      
      // Verify kategori exists
      const kategoriValue = incomingFormData.get("kategori");
      console.log(`[ROUTE_UPDATE] Kategori check:`, {
        exists: kategoriValue !== null,
        value: kategoriValue,
        type: typeof kategoriValue,
        stringValue: String(kategoriValue)
      });
      
      if (!kategoriValue || kategoriValue === "" || kategoriValue === "null" || kategoriValue === "undefined") {
        console.error(`[ROUTE_UPDATE] ❌ KATEGORI TIDAK ADA ATAU INVALID!`);
        return NextResponse.json(
          {
            success: false,
            message: "Kategori wajib diisi",
            errors: { kategori: ["Kategori field is required"] },
            errorFields: ["kategori"],
            debug: {
              kategoriValue: kategoriValue,
              kategoriType: typeof kategoriValue,
              allKeys: Array.from(incomingFormData.keys())
            }
          },
          { status: 400 }
        );
      }
      
      // ============================
      // SIMPAN REQUEST DATA KE OBJECT DULU (untuk debugging)
      // ============================
      console.log(`[ROUTE_UPDATE] ========== SAVING REQUEST DATA (ID: ${id}) ==========`);
      const requestDataToLog = {
        timestamp: new Date().toISOString(),
        productId: id,
        incomingFormData: {}
      };
      
      // Convert incoming FormData ke object untuk logging
      for (const [key, value] of incomingFormData.entries()) {
        if (value instanceof File) {
          requestDataToLog.incomingFormData[key] = {
            type: "File",
            name: value.name,
            size: value.size,
            sizeKB: `${(value.size / 1024).toFixed(2)} KB`,
            mimeType: value.type
          };
        } else {
          const strValue = String(value);
          try {
            const parsed = JSON.parse(strValue);
            requestDataToLog.incomingFormData[key] = parsed;
          } catch {
            requestDataToLog.incomingFormData[key] = strValue.length > 200 ? strValue.substring(0, 200) + "..." : strValue;
          }
        }
      }
      
      console.log(`[ROUTE_UPDATE] Request data object:`, JSON.stringify(requestDataToLog, null, 2));
      console.log(`[ROUTE_UPDATE] Fields count:`, Object.keys(requestDataToLog.incomingFormData).length);
      console.log(`[ROUTE_UPDATE] Fields:`, Object.keys(requestDataToLog.incomingFormData));
      console.log(`[ROUTE_UPDATE] ==========================================`);
      
      // Create FormData untuk forward ke backend (menggunakan form-data package)
      const forwardFormData = new FormData();
      
      console.log(`[ROUTE_UPDATE] ========== BUILDING FORWARD FORMDATA (ID: ${id}) ==========`);
      let appendedCount = 0;
      const appendedFields = [];
      
      // Forward all entries ke backend - SIMPLE APPROACH
      for (const [key, value] of incomingFormData.entries()) {
        if (value instanceof File) {
          // Convert File to Buffer untuk form-data package
          const arrayBuffer = await value.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Append dengan options yang benar
          forwardFormData.append(key, buffer, {
            filename: value.name,
            contentType: value.type || "application/octet-stream",
          });
          appendedCount++;
          appendedFields.push({ key, type: "File", name: value.name, size: buffer.length });
          console.log(`[ROUTE_UPDATE] ✅ File appended: ${key} = ${value.name} (${(value.size / 1024).toFixed(2)} KB, buffer: ${buffer.length} bytes)`);
        } else {
          // Forward string values as-is
          const strValue = String(value);
          forwardFormData.append(key, strValue);
          appendedCount++;
          appendedFields.push({ key, type: "String", value: strValue.length > 50 ? strValue.substring(0, 50) + "..." : strValue });
          console.log(`[ROUTE_UPDATE] ✅ String appended: ${key} = ${strValue.length > 50 ? strValue.substring(0, 50) + "..." : strValue}`);
        }
      }
      
      console.log(`[ROUTE_UPDATE] Total appended: ${appendedCount} fields`);
      console.log(`[ROUTE_UPDATE] Appended fields:`, appendedFields.map(f => `${f.key} (${f.type})`).join(", "));
      console.log(`[ROUTE_UPDATE] ==============================================`);
      
      // Verify data di incomingFormData sebelum forward
      console.log(`[ROUTE_UPDATE] ========== VERIFYING INCOMING DATA (ID: ${id}) ==========`);
      const verifyKategori = incomingFormData.get("kategori");
      const verifyNama = incomingFormData.get("nama");
      const verifyAssign = incomingFormData.get("assign");
      const verifyHeader = incomingFormData.get("header");
      
      console.log(`Kategori:`, verifyKategori ? String(verifyKategori) : "NULL");
      console.log(`Nama:`, verifyNama ? String(verifyNama) : "NULL");
      console.log(`Assign:`, verifyAssign ? String(verifyAssign) : "NULL");
      console.log(`Header:`, verifyHeader instanceof File ? `File(${verifyHeader.name}, ${(verifyHeader.size / 1024).toFixed(2)} KB)` : "NULL");
      
      if (!verifyKategori || !verifyNama) {
        console.error(`[ROUTE_UPDATE] ❌ MISSING CRITICAL FIELDS IN INCOMING!`);
        return NextResponse.json(
          {
            success: false,
            message: "Data tidak lengkap",
            errors: {
              kategori: !verifyKategori ? ["Kategori tidak ditemukan"] : [],
              nama: !verifyNama ? ["Nama tidak ditemukan"] : [],
            },
            debug: {
              kategori: verifyKategori ? "OK" : "MISSING",
              nama: verifyNama ? "OK" : "MISSING",
              allKeys: Array.from(incomingFormData.keys())
            }
          },
          { status: 400 }
        );
      }
      console.log(`[ROUTE_UPDATE] ✅ All critical fields present in incoming`);
      console.log(`[ROUTE_UPDATE] ==============================================`);
      
      // Get headers untuk FormData (PENTING: harus dipanggil sebelum fetch)
      const formDataHeaders = forwardFormData.getHeaders();
      
      console.log(`[ROUTE_UPDATE] ========== REQUEST DETAILS (ID: ${id}) ==========`);
      console.log(`URL:`, `${BACKEND_URL}/api/admin/produk/${id}`);
      console.log(`Method:`, "POST");
      console.log(`Content-Type:`, formDataHeaders["content-type"]);
      console.log(`Content-Length:`, formDataHeaders["content-length"] || "not set");
      console.log(`Token:`, token.substring(0, 20) + "...");
      console.log(`Total fields to send:`, appendedCount);
      console.log(`[ROUTE_UPDATE] ======================================`);
      
      // Forward ke backend Laravel dengan FormData menggunakan axios
      try {
        const axiosResponse = await axios.post(
          `${BACKEND_URL}/api/admin/produk/${id}`,
          forwardFormData,
          {
            headers: {
              ...formDataHeaders,
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          }
        );
        
        // Convert axios response ke format yang compatible
        response = {
          ok: axiosResponse.status >= 200 && axiosResponse.status < 300,
          status: axiosResponse.status,
          statusText: axiosResponse.statusText,
          headers: new Headers(axiosResponse.headers),
          text: async () => JSON.stringify(axiosResponse.data),
          json: async () => axiosResponse.data,
        };
        
        console.log(`[ROUTE_UPDATE] ✅ Request sent successfully`);
        console.log(`[ROUTE_UPDATE] Backend response status:`, response.status);
        console.log(`[ROUTE_UPDATE] Backend response ok:`, response.ok);
      } catch (axiosError) {
        console.error(`[ROUTE_UPDATE] ❌ Axios error:`, axiosError);
        
        // Handle axios error response
        if (axiosError.response) {
          // Backend responded with error
          response = {
            ok: false,
            status: axiosError.response.status,
            statusText: axiosError.response.statusText,
            headers: new Headers(axiosError.response.headers),
            json: async () => axiosError.response.data,
            text: async () => JSON.stringify(axiosError.response.data),
          };
        } else if (axiosError.request) {
          // Request sent but no response
          console.error(`[ROUTE_UPDATE] ❌ No response from backend`);
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
          console.error(`[ROUTE_UPDATE] ❌ Request setup error:`, axiosError.message);
          throw axiosError;
        }
      }

    } else {
      // Handle JSON request (untuk backward compatibility)
      const reqBody = await request.json();
      
      console.log(`[ROUTE_UPDATE] ========== INCOMING JSON PAYLOAD (ID: ${id}) ==========`);
      console.log(`Payload keys:`, Object.keys(reqBody));
      console.log(`[ROUTE_UPDATE] ===========================================`);
      
      // Forward JSON ke backend
      response = await fetch(`${BACKEND_URL}/api/admin/produk/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reqBody),
      });
    }
    
    // Handle response
    let data;
    try {
      // Jika response sudah punya method json(), gunakan itu
      if (typeof response.json === "function") {
        data = await response.json();
      } else {
        // Fallback: parse dari text
        const responseText = await response.text();
        data = JSON.parse(responseText);
      }
      
      // Log response untuk debugging
      console.log(`[ROUTE_UPDATE] Backend response:`, {
        status: response.status,
        success: data?.success,
        message: data?.message,
        hasData: !!data?.data
      });
      
      // Jika success dan ada data, pastikan data adalah array
      if (data?.success && data?.data) {
        // Jika data bukan array, wrap dalam array
        if (!Array.isArray(data.data)) {
          data.data = [data.data];
          console.log(`[ROUTE_UPDATE] ✅ Wrapped data in array`);
        }
        console.log(`[ROUTE_UPDATE] ✅ Data received:`, Array.isArray(data.data) ? `Array(${data.data.length})` : "Not array");
      }
    } catch (parseError) {
      console.error(`[ROUTE_UPDATE] ❌ Failed to parse response:`, parseError);
      return NextResponse.json(
        {
          success: false,
          message: "Backend error: Response bukan JSON",
          error: parseError.message,
          status: response.status,
        },
        { status: response.status || 500 }
      );
    }

    if (!response.ok) {
      // Extract errors dengan detail
      console.error(`[ROUTE_UPDATE] ========== BACKEND ERROR RESPONSE (ID: ${id}) ==========`);
      console.error(`Status:`, response.status);
      console.error(`Response data:`, JSON.stringify(data, null, 2));
      
      let extractedErrors = {};
      let extractedErrorFields = [];

      // Method 1: Check data.errors
      if (data?.errors && typeof data.errors === "object" && Object.keys(data.errors).length > 0) {
        extractedErrors = data.errors;
        extractedErrorFields = Object.keys(data.errors);
        console.error(`Errors found in data.errors:`, extractedErrors);
      } 
      // Method 2: Check data.data.errors
      else if (data?.data?.errors && typeof data.data.errors === "object") {
        extractedErrors = data.data.errors;
        extractedErrorFields = Object.keys(data.data.errors);
        console.error(`Errors found in data.data.errors:`, extractedErrors);
      }
      // Method 3: Parse from message
      else if (data?.message) {
        console.error(`Parsing errors from message:`, data.message);
        const message = data.message;
        
        // Extract field names from message
        const fieldPatterns = [
          /The\s+(\w+)\s+field\s+is\s+required/gi,
          /(\w+)\s+field\s+is\s+required/gi,
          /(\w+)\s+is\s+required/gi,
        ];
        
        for (const pattern of fieldPatterns) {
          const matches = message.matchAll(pattern);
          for (const match of matches) {
            const fieldName = match[1]?.toLowerCase();
            if (fieldName && !extractedErrorFields.includes(fieldName)) {
              extractedErrorFields.push(fieldName);
              extractedErrors[fieldName] = ["Field ini wajib diisi"];
            }
          }
        }
        
        // Check for "and X more errors"
        const moreErrorsMatch = message.match(/and\s+(\d+)\s+more\s+errors?/i);
        if (moreErrorsMatch) {
          console.error(`⚠️ Ada ${moreErrorsMatch[1]} error lainnya yang tidak terdeteksi`);
        }
      }
      
      console.error(`Extracted errors:`, extractedErrors);
      console.error(`Extracted error fields:`, extractedErrorFields);
      console.error(`[ROUTE_UPDATE] ===========================================`);

      // Build detailed error message
      let detailedMessage = data?.message || "Gagal memperbarui produk";
      if (extractedErrorFields.length > 0) {
        detailedMessage += `\n\n📋 Field yang error (${extractedErrorFields.length}):`;
        for (const field of extractedErrorFields) {
          const errors = Array.isArray(extractedErrors[field]) 
            ? extractedErrors[field] 
            : [extractedErrors[field] || "Field ini wajib diisi"];
          errors.forEach((err) => {
            detailedMessage += `\n  ❌ ${field}: ${err}`;
          });
        }
      } else {
        detailedMessage += "\n\n⚠️ Detail error tidak tersedia dari backend.";
      }

      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Gagal memperbarui produk",
          detailedMessage: detailedMessage,
          errors: extractedErrors,
          errorFields: extractedErrorFields,
          debug: {
            status: response.status,
            backendResponse: data,
            extractedErrors: extractedErrors,
            extractedErrorFields: extractedErrorFields,
          }
        },
        { status: response.status }
      );
    }

    // Success response - return sesuai format yang diharapkan
    if (data.success && data.data) {
      // Pastikan data adalah array
      const responseData = Array.isArray(data.data) ? data.data : [data.data];
      
      console.log(`[ROUTE_UPDATE] ✅ Returning success response with data array:`, responseData.length, "items");
      
      return NextResponse.json({
        success: true,
        message: data.message || "Produk berhasil diperbarui",
        data: responseData,
      });
    }

    // Fallback jika format berbeda
    console.log(`[ROUTE_UPDATE] ⚠️ Returning fallback response`);
    return NextResponse.json(data);

  } catch (error) {
    console.error(`❌ [POST_PRODUK_UPDATE] Error:`, error.message);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Terjadi kesalahan saat memperbarui produk",
      },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || "";

    const response = await fetch(`${BACKEND_URL}/api/admin/produk/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Produk tidak ditemukan",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[PRODUK GET] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil data produk",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Get query params to check for force delete
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get("force") === "true";

    console.log(`[PRODUK DELETE] Product ID: ${id}, Force: ${forceDelete}`);

    // Coba DELETE dengan parameter force untuk hard delete
    const deleteUrl = forceDelete 
      ? `${BACKEND_URL}/api/admin/produk/${id}?force=true`
      : `${BACKEND_URL}/api/admin/produk/${id}`;

    const response = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      // Juga kirim force di body untuk backend yang menerima dari body
      body: JSON.stringify({ force: forceDelete }),
    });

    const data = await response.json().catch(() => ({}));

    console.log(`[PRODUK DELETE] Backend response:`, response.status, data);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Gagal menghapus produk",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ...data,
      success: true,
      message: data?.message || "Produk berhasil dihapus permanen"
    }, { status: response.status });
  } catch (error) {
    console.error("[PRODUK DELETE] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat menghapus produk",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

