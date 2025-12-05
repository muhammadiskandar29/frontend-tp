/**
 * RajaOngkir V2 Basic API Helper
 * Helper functions untuk berinteraksi dengan RajaOngkir API via Next.js API routes
 * Origin hardcode: 73655 (Kelapa Dua, Kabupaten Tangerang, Banten)
 */

/**
 * Hitung ongkir menggunakan RajaOngkir V2 Basic API
 * @param {Object} params
 * @param {string} params.destination - City ID destination (kota tujuan) - REQUIRED
 * @param {number} params.weight - Berat dalam gram (1-50000) - REQUIRED
 * @param {string} params.courier - Kode kurir (jne, jnt, tiki) - REQUIRED
 * @param {string} params.origin - City ID origin (OPTIONAL, akan di-hardcode di API route)
 * @returns {Promise<{price: number, etd: string, raw: any}>}
 */
export async function getCost({ destination, weight, courier, origin }) {
  // Validasi input (origin tidak wajib, akan di-hardcode di API route)
  if (!destination || !weight || !courier) {
    throw new Error('destination, weight, dan courier wajib diisi');
  }

  // Validasi destination harus angka (city_id)
  if (isNaN(parseInt(destination, 10))) {
    throw new Error('destination harus berupa city_id (angka)');
  }

  // Validasi weight
  const weightNum = parseInt(weight, 10);
  if (isNaN(weightNum) || weightNum < 1 || weightNum > 50000) {
    throw new Error('weight harus antara 1 dan 50000 gram');
  }

  // Check cache di sessionStorage (origin hardcode 73655)
  const ORIGIN_HARDCODE = '73655';
  const cacheKey = `rajaongkir_cost_${ORIGIN_HARDCODE}_${destination}_${weight}_${courier}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const cachedData = JSON.parse(cached);
      const now = Date.now();
      // Cache valid selama 60 detik
      if (now - cachedData.timestamp < 60000) {
        console.log('[RAJAONGKIR] Using cached result');
        return cachedData.data;
      }
    } catch (err) {
      // Invalid cache, continue to fetch
    }
  }

  try {
    // Origin hardcode di API route, tidak perlu dikirim dari frontend
    const response = await fetch('/api/rajaongkir/cost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination: String(destination),
        weight: weightNum,
        courier: String(courier).toLowerCase(),
        // Origin tidak perlu dikirim, akan di-hardcode di API route
      }),
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      const errorMsg = json.message || 'Gagal menghitung ongkir';
      throw new Error(errorMsg);
    }

    // Parse normalized response from our API
    // Format: { success: true, data: { price, etd, raw } }
    if (!json.data) {
      throw new Error('Response tidak valid dari server');
    }

    const resultData = {
      price: json.data.price,
      etd: json.data.etd || 'Estimasi pengiriman akan diinformasikan',
      raw: json.data.raw,
    };

    // Cache hasil
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: resultData,
      }));
    } catch (err) {
      // Ignore cache error
    }

    return resultData;
  } catch (error) {
    console.error('[RAJAONGKIR] getCost error:', error);
    throw error;
  }
}

/**
 * Get city list (untuk autocomplete/search)
 * @param {string} query - Search query (optional)
 * @returns {Promise<Array>}
 */
export async function getDestinations(query = '') {
  try {
    const url = `/api/rajaongkir/cities${query ? `?search=${encodeURIComponent(query)}` : ''}`;
    const response = await fetch(url);
    const json = await response.json();

    if (!response.ok || !json.success) {
      const errorMsg = json.rajaongkir?.status?.description || json.message || 'Gagal mengambil data kota';
      console.error('[RAJAONGKIR] getDestinations API error:', errorMsg);
      throw new Error(errorMsg);
    }

    const data = json.data || [];
    console.log('[RAJAONGKIR] getDestinations success, found:', data.length, 'results');
    return data;
  } catch (error) {
    console.error('[RAJAONGKIR] getDestinations error:', error);
    throw error;
  }
}

