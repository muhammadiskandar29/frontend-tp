/**
 * Komerce API Helper
 * Helper functions untuk berinteraksi dengan Komerce API via Next.js API routes
 */

/**
 * Hitung ongkir menggunakan Komerce API
 * @param {Object} params
 * @param {string} params.origin - ID origin (kota asal)
 * @param {string} params.destination - ID destination (kota tujuan)
 * @param {number} params.weight - Berat dalam gram (1-50000)
 * @param {string} params.courier - Kode kurir (jne, tiki, pos, dll)
 * @returns {Promise<{price: number, etd: string, raw: any}>}
 */
export async function getCost({ origin, destination, weight, courier }) {
  // Validasi input
  if (!origin || !destination || !weight || !courier) {
    throw new Error('origin, destination, weight, dan courier wajib diisi');
  }

  // Validasi destination harus angka
  if (isNaN(parseInt(destination, 10))) {
    throw new Error('destination harus berupa ID (angka)');
  }

  // Validasi weight
  const weightNum = parseInt(weight, 10);
  if (isNaN(weightNum) || weightNum < 1 || weightNum > 50000) {
    throw new Error('weight harus antara 1 dan 50000 gram');
  }

  // Check cache di sessionStorage
  const cacheKey = `komerce_cost_${origin}_${destination}_${weight}_${courier}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const cachedData = JSON.parse(cached);
      const now = Date.now();
      // Cache valid selama 60 detik
      if (now - cachedData.timestamp < 60000) {
        console.log('[KOMERCE] Using cached result');
        return cachedData.data;
      }
    } catch (err) {
      // Invalid cache, continue to fetch
    }
  }

  try {
    const response = await fetch('/api/komerce/cost', {
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
      // Handle rate limit
      if (json.error === 'RATE_LIMIT' || response.status === 429) {
        throw new Error('Terlalu banyak request. Silakan coba lagi dalam beberapa saat.');
      }
      throw new Error(json.message || 'Gagal menghitung ongkir');
    }

    if (!json.success || !json.data) {
      throw new Error('Response tidak valid dari server');
    }

    // Parse response dari Komerce
    // Format response Komerce bisa bervariasi, sesuaikan dengan struktur actual
    const data = json.data;
    
    // Extract price dan etd dari response
    // Asumsi struktur: { results: [{ costs: [{ value: price, etd: etd }] }] }
    let price = 0;
    let etd = '';
    let raw = data;

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      if (result.costs && result.costs.length > 0) {
        const cost = result.costs[0];
        price = parseInt(cost.value || cost.cost || 0, 10);
        etd = cost.etd || cost.etd_text || '';
      }
    } else if (data.cost) {
      // Alternatif struktur response
      price = parseInt(data.cost.value || data.cost || 0, 10);
      etd = data.cost.etd || '';
    } else if (typeof data === 'number') {
      // Jika response langsung angka
      price = data;
    }

    if (price === 0) {
      throw new Error('Ongkir tidak tersedia untuk rute ini');
    }

    const result = {
      price,
      etd: etd || 'Estimasi pengiriman akan diinformasikan',
      raw: data,
    };

    // Cache hasil
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: result,
      }));
    } catch (err) {
      // Ignore cache error
    }

    return result;
  } catch (error) {
    console.error('[KOMERCE] getCost error:', error);
    throw error;
  }
}

/**
 * Get destination list (untuk autocomplete/search)
 * @param {string} query - Search query
 * @returns {Promise<Array>}
 */
export async function getDestinations(query = '') {
  try {
    // Gunakan parameter 'search' sesuai dokumentasi API V2
    const url = `/api/komerce/destination${query ? `?search=${encodeURIComponent(query)}` : ''}`;
    const response = await fetch(url);
    const json = await response.json();

    if (!response.ok || !json.success) {
      const errorMsg = json.message || 'Gagal mengambil data destinasi';
      console.error('[KOMERCE] getDestinations API error:', errorMsg);
      throw new Error(errorMsg);
    }

    const data = json.data || [];
    console.log('[KOMERCE] getDestinations success, found:', data.length, 'results');
    return data;
  } catch (error) {
    console.error('[KOMERCE] getDestinations error:', error);
    throw error;
  }
}

