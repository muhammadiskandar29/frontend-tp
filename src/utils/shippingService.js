/**
 * Shipping Service - Helper functions untuk API calls
 */

/**
 * Ambil daftar provinsi
 * @returns {Promise<Array>} Array of province objects { id, name }
 */
export async function getProvinces() {
  try {
    const response = await fetch('/api/shipping/provinces');
    
    if (!response || !response.ok) {
      return [];
    }

    const json = await response.json();
    
    if (!json || !json.success) {
      return [];
    }

    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error('[SHIPPING_SERVICE] getProvinces error:', error);
    return [];
  }
}

/**
 * Ambil daftar kota berdasarkan province_id
 * @param {string|number} provinceId - ID provinsi
 * @returns {Promise<Array>} Array of city objects { id, name, province_id }
 */
export async function getCities(provinceId) {
  try {
    if (!provinceId) {
      return [];
    }

    const response = await fetch(`/api/shipping/cities?province_id=${encodeURIComponent(provinceId)}`);
    
    if (!response || !response.ok) {
      return [];
    }

    const json = await response.json();
    
    if (!json || !json.success) {
      return [];
    }

    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error('[SHIPPING_SERVICE] getCities error:', error);
    return [];
  }
}

/**
 * Ambil daftar district berdasarkan city_id
 * @param {string|number} cityId - ID kota
 * @returns {Promise<Array>} Array of district objects { id, name, city_id }
 */
export async function getDistricts(cityId) {
  try {
    if (!cityId) {
      return [];
    }

    const response = await fetch(`/api/shipping/districts?city_id=${encodeURIComponent(cityId)}`);
    
    if (!response || !response.ok) {
      return [];
    }

    const json = await response.json();
    
    if (!json || !json.success) {
      return [];
    }

    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error('[SHIPPING_SERVICE] getDistricts error:', error);
    return [];
  }
}

/**
 * Hitung ongkir domestic
 * @param {Object} params
 * @param {number} params.origin - Origin district ID
 * @param {number} params.destination - Destination district ID
 * @param {number} params.weight - Berat dalam gram
 * @param {string} params.courier - Courier codes (format: "jne:jnt:sicepat:anteraja:pos")
 * @returns {Promise<Array>} Array of shipping cost objects { courier, service, description, etd, cost }
 */
export async function calculateDomesticCost({ origin, destination, weight, courier }) {
  try {
    if (!origin || !destination || !weight || !courier) {
      return [];
    }

    const response = await fetch('/api/shipping/calculate-domestic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        origin,
        destination,
        weight,
        courier
      })
    });

    if (!response || !response.ok) {
      return [];
    }

    const json = await response.json();
    
    if (!json || !json.success) {
      return [];
    }

    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error('[SHIPPING_SERVICE] calculateDomesticCost error:', error);
    return [];
  }
}
