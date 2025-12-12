/**
 * Normalize broadcast payload to match backend format
 * 
 * @param {Object} payload - Raw payload from form
 * @returns {Object} Normalized payload
 * 
 * Format:
 * {
 *   nama: string,
 *   pesan: string,
 *   tanggal_kirim: null | "yyyy-mm-dd hh:mm:ss",
 *   langsung_kirim: boolean,
 *   target: {
 *     produk: [integer],                    // array wajib
 *     status_order?: [string],              // optional array
 *     status_pembayaran?: [string]          // optional array
 *   }
 * }
 */
export function normalizeBroadcastPayload(payload) {
  const normalized = {
    nama: String(payload.nama || "").trim(),
    pesan: String(payload.pesan || "").trim(),
    langsung_kirim: Boolean(payload.langsung_kirim),
    tanggal_kirim: null,
    target: {
      produk: [],
    },
  };

  // Format tanggal_kirim: "yyyy-mm-dd hh:mm:ss" or null
  if (!normalized.langsung_kirim && payload.tanggal_kirim) {
    let date = payload.tanggal_kirim;
    
    // If it's a Date object, convert to format
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      
      normalized.tanggal_kirim = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } else if (typeof date === "string") {
      // If it's already a string, try to parse and reformat
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
        const day = String(parsedDate.getDate()).padStart(2, "0");
        const hours = String(parsedDate.getHours()).padStart(2, "0");
        const minutes = String(parsedDate.getMinutes()).padStart(2, "0");
        const seconds = String(parsedDate.getSeconds()).padStart(2, "0");
        
        normalized.tanggal_kirim = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      } else {
        // If it's already in correct format, use as is
        normalized.tanggal_kirim = date;
      }
    } else {
      normalized.tanggal_kirim = null;
    }
  }

  // Normalize produk: always array of integers (wajib, minimal 1 item)
  if (payload.target?.produk) {
    if (Array.isArray(payload.target.produk)) {
      normalized.target.produk = payload.target.produk
        .map((id) => Number(id))
        .filter((id) => !isNaN(id) && id > 0);
    } else {
      // If single value, convert to array
      const id = Number(payload.target.produk);
      if (!isNaN(id) && id > 0) {
        normalized.target.produk = [id];
      }
    }
  }

  // Ensure produk is always an array (wajib)
  if (!normalized.target.produk || normalized.target.produk.length === 0) {
    normalized.target.produk = [];
  }

  // Status Order: only include if array is not empty - OPTIONAL (multi-select)
  if (payload.target?.status_order) {
    if (Array.isArray(payload.target.status_order) && payload.target.status_order.length > 0) {
      // Convert to array of strings, filter out empty values
      const statusArray = payload.target.status_order
        .map((s) => String(s).trim())
        .filter((s) => s && s !== "");
      
      if (statusArray.length > 0) {
        normalized.target.status_order = statusArray;
      }
      // If array becomes empty after filtering, don't include it
    } else if (typeof payload.target.status_order === "string" && payload.target.status_order.trim()) {
      // Legacy: single string value, convert to array
      normalized.target.status_order = [payload.target.status_order.trim()];
    }
    // If empty array or null/undefined, don't include it (will be absent from target)
  }

  // Status Pembayaran: only include if array is not empty - OPTIONAL (multi-select)
  if (payload.target?.status_pembayaran) {
    if (Array.isArray(payload.target.status_pembayaran) && payload.target.status_pembayaran.length > 0) {
      // Convert to array of strings, filter out empty values
      const statusArray = payload.target.status_pembayaran
        .map((s) => String(s).trim())
        .filter((s) => s && s !== "");
      
      if (statusArray.length > 0) {
        normalized.target.status_pembayaran = statusArray;
      }
      // If array becomes empty after filtering, don't include it
    } else if (typeof payload.target.status_pembayaran === "string" && payload.target.status_pembayaran.trim()) {
      // Legacy: single string value, convert to array
      normalized.target.status_pembayaran = [payload.target.status_pembayaran.trim()];
    }
    // If empty array or null/undefined, don't include it (will be absent from target)
  }

  return normalized;
}
