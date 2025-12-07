import { NextResponse } from 'next/server';

/**
 * Next.js API Route untuk menghitung ongkir domestic menggunakan Komerce API
 * 
 * Endpoint: POST /api/shipping/calculate-domestic
 * 
 * Payload:
 * {
 *   "origin": 73655,
 *   "destination": <district_id>,
 *   "weight": 1000,
 *   "courier": "jne:jnt:sicepat:anteraja:pos"
 * }
 */
const API_KEY = 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';
const KOMERCE_BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

export async function POST(request) {
  try {
    const body = await request.json();
    const { origin, destination, weight, courier } = body;

    // Validasi input
    if (!origin || !destination || !weight || !courier) {
      return NextResponse.json({
        success: false,
        message: 'origin, destination, weight, dan courier wajib diisi',
        data: []
      }, { status: 200 });
    }

    // Build URL dengan query parameters
    const params = new URLSearchParams();
    params.append('origin', String(origin));
    params.append('destination', String(destination));
    params.append('weight', String(weight));
    params.append('courier', String(courier));

    const costUrl = `${KOMERCE_BASE_URL}/cost/domestic?${params.toString()}`;

    let response;
    try {
      // Fetch dengan timeout 15 detik
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      response = await fetch(costUrl, {
        method: 'GET',
        headers: {
          'key': API_KEY,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (fetchError) {
      // Tangani timeout dan network error
      if (fetchError.name === 'AbortError') {
        console.error('[SHIPPING_CALCULATE_DOMESTIC] Request timeout:', costUrl);
      } else {
        console.error('[SHIPPING_CALCULATE_DOMESTIC] Fetch failed:', fetchError.message, 'URL:', costUrl);
      }
      return NextResponse.json({
        success: false,
        message: 'Gagal terhubung ke server. Silakan coba lagi.',
        data: []
      }, { status: 200 });
    }

    // Tangani HTTP error
    if (!response || !response.ok) {
      const status = response?.status || 0;
      const responseTextPreview = await response.text().catch(() => '');
      console.error('[SHIPPING_CALCULATE_DOMESTIC] HTTP error:', status, 'Response:', responseTextPreview.substring(0, 500));
      
      return NextResponse.json({
        success: false,
        message: `Gagal menghitung ongkir (HTTP ${status}). Silakan coba lagi.`,
        data: []
      }, { status: 200 });
    }

    // Parse response text
    const responseText = await response.text();

    // Tangani response kosong
    if (!responseText || responseText.trim().length === 0) {
      console.error('[SHIPPING_CALCULATE_DOMESTIC] Empty response from API');
      return NextResponse.json({
        success: false,
        message: 'Tidak ada data ongkir yang ditemukan',
        data: []
      }, { status: 200 });
    }

    // Parse JSON
    let json;
    try {
      json = JSON.parse(responseText);
      console.log('[SHIPPING_CALCULATE_DOMESTIC] Response parsed successfully');
    } catch (parseError) {
      console.error('[SHIPPING_CALCULATE_DOMESTIC] JSON parse error:', parseError.message);
      console.error('[SHIPPING_CALCULATE_DOMESTIC] Raw response (first 500 chars):', responseText.substring(0, 500));
      return NextResponse.json({
        success: false,
        message: 'Format response tidak valid dari server',
        data: []
      }, { status: 200 });
    }

    // Handle response dari Komerce API
    // Format: { meta: {...}, data: [...] }
    let results = [];

    if (json.data && Array.isArray(json.data)) {
      results = json.data;
    } else if (json.results && Array.isArray(json.results)) {
      results = json.results;
    } else if (Array.isArray(json)) {
      results = json;
    } else {
      console.error('[SHIPPING_CALCULATE_DOMESTIC] Unknown response format. Response:', JSON.stringify(json).substring(0, 1000));
      return NextResponse.json({
        success: false,
        message: 'Format response tidak dikenal dari server',
        data: []
      }, { status: 200 });
    }

    // Normalize data untuk frontend
    // Format: array of { courier, service, description, etd, cost }
    const normalizedData = results.flatMap(item => {
      // Jika item memiliki costs array, flatten
      if (item.costs && Array.isArray(item.costs)) {
        return item.costs.map(cost => ({
          courier: item.courier || item.code || '',
          service: cost.service || cost.name || '',
          description: cost.description || '',
          etd: cost.etd || cost.etd_days || '',
          cost: cost.cost || cost.price || 0
        }));
      }
      // Jika langsung object
      return [{
        courier: item.courier || item.code || '',
        service: item.service || item.name || '',
        description: item.description || '',
        etd: item.etd || item.etd_days || '',
        cost: item.cost || item.price || 0
      }];
    });

    // Return normalized data
    return NextResponse.json({
      success: true,
      message: 'Berhasil menghitung ongkir',
      data: normalizedData
    }, { status: 200 });

  } catch (error) {
    // Catch-all error handler
    console.error('[SHIPPING_CALCULATE_DOMESTIC] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: `Terjadi kesalahan: ${error.message || 'Unknown error'}`,
      data: []
    }, { status: 200 });
  }
}
