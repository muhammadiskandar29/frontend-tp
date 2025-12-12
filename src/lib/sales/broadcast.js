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
 *     produk: [integer],           // array wajib
 *     status_order?: string,        // optional string
 *     status_pembayaran?: string    // optional string
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

  // Status Order: only include if selected (string) - OPTIONAL
  // Use explicit check to handle edge cases
  const so = payload.target?.status_order;
  if (so !== null && so !== undefined && so !== "") {
    let statusValue = null;
    
    if (typeof so === "string" && so.trim()) {
      statusValue = so.trim();
    } else if (Array.isArray(so) && so.length > 0) {
      // If array provided, take first element
      statusValue = String(so[0]).trim();
    } else {
      // Handle other types - convert to string
      statusValue = String(so).trim();
    }
    
    // Only include if we have a valid non-empty string
    if (statusValue !== null && statusValue !== undefined && statusValue !== "") {
      normalized.target.status_order = statusValue;
    }
    // If empty string, null, or undefined, don't include it (will be absent from target)
  }

  // Status Pembayaran: only include if selected (string) - OPTIONAL
  // Handle 0 as valid value (Unpaid) - use explicit check instead of truthy check
  const sp = payload.target?.status_pembayaran;
  if (sp !== null && sp !== undefined && sp !== "") {
    let statusValue = null;
    
    if (typeof sp === "string" && sp.trim()) {
      statusValue = sp.trim();
    } else if (Array.isArray(sp) && sp.length > 0) {
      // If array provided, take first element
      statusValue = String(sp[0]).trim();
    } else {
      // Handle number 0 as valid value - convert to string
      statusValue = String(sp).trim();
    }
    
    // Only include if we have a valid non-empty string (0 becomes "0" which is valid)
    if (statusValue !== null && statusValue !== undefined && statusValue !== "") {
      normalized.target.status_pembayaran = statusValue;
    }
    // If empty string, null, or undefined, don't include it (will be absent from target)
  }

  return normalized;
}
