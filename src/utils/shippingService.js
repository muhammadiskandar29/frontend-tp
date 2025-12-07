/**
 * Shipping Service - Helper functions untuk API calls
 * 
 * SOLUSI A: Menggunakan search-based approach
 * Endpoint: GET /api/shipping/search?search=xxx
 */

/**
 * Search destination (kecamatan/kelurahan/nama tempat)
 * Menggunakan endpoint domestic-destination dengan search parameter
 * @param {string} search - Search keyword
 * @returns {Promise<Array>} Array of destination objects dengan lengkap: id, province_name, city_name, district_name, subdistrict_name, zip_code
 */
export async function searchDestinations(search = '') {
  try {
    if (!search || search.trim().length === 0) {
      return [];
    }

    const response = await fetch(`/api/shipping/search?search=${encodeURIComponent(search.trim())}`);
    
    if (!response || !response.ok) {
      return [];
    }

    const json = await response.json();
    
    if (!json || !json.success) {
      return [];
    }

    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error('[SHIPPING_SERVICE] searchDestinations error:', error);
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
