/**
 * RajaOngkir V1 Basic API Helper
 * Helper functions untuk berinteraksi dengan RajaOngkir API via Next.js API routes
 */

/**
 * Hitung ongkir menggunakan RajaOngkir V1 Basic API
 * @param {Object} params
 * @param {string} params.origin - City ID origin (kota asal)
 * @param {string} params.destination - City ID destination (kota tujuan)
 * @param {number} params.weight - Berat dalam gram (1-50000)
 * @param {string} params.courier - Kode kurir (jne, jnt, tiki)
 * @returns {Promise<{price: number, etd: string, raw: any}>}
 */
export async function getCost({ origin, destination, weight, courier }) {
  // Validasi input
  if (!origin || !destination || !weight || !courier) {
    throw new Error('origin, destination, weight, dan courier wajib diisi');
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

  // Check cache di sessionStorage
  const cacheKey = `rajaongkir_cost_${origin}_${destination}_${weight}_${courier}`;
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
    const response = await fetch('/api/rajaongkir/cost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: String(origin),
        destination: String(destination),
        weight: weightNum,
        courier: String(courier).toLowerCase(),
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      const errorMsg = json.rajaongkir?.status?.description || json.message || 'Gagal menghitung ongkir';
      throw new Error(errorMsg);
    }

    // Parse response dari RajaOngkir
    // Format: { rajaongkir: { status: {...}, results: [{ costs: [{ value, etd }] }] } }
    const rajaongkir = json.rajaongkir;
    
    if (!rajaongkir || !rajaongkir.results || rajaongkir.results.length === 0) {
      throw new Error('Tidak ada hasil ongkir untuk rute ini');
    }

    const result = rajaongkir.results[0];
    if (!result.costs || result.costs.length === 0) {
      throw new Error('Ongkir tidak tersedia untuk rute ini');
    }

    // Ambil cost pertama (biasanya REG)
    const cost = result.costs[0];
    const price = parseInt(cost.value || 0, 10);
    const etd = cost.etd || '';

    if (price === 0) {
      throw new Error('Ongkir tidak tersedia untuk rute ini');
    }

    const resultData = {
      price,
      etd: etd || 'Estimasi pengiriman akan diinformasikan',
      raw: json,
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

