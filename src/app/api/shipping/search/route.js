import { NextResponse } from 'next/server';

/**
 * Backend API Route untuk search destination menggunakan Komerce OpenAPI
 * 
 * Endpoint: GET /api/shipping/search?search=...
 * 
 * Hardcode API Key (untuk testing):
 * - x-api-key: mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb
 * 
 * TODO: Pindahkan ke process.env.KOMERCE_API_KEY
 */
const API_KEY = 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';
const KOMERCE_BASE_URL = 'https://api-sandbox.collaborator.komerce.id/tariff/api/v1';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Handle search kosong atau hanya whitespace - return empty array (bukan error)
    // Minimal 1 huruf tanpa error - jadi jika kosong, return empty array
    if (!search || search.trim().length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Search kosong',
        data: []
      });
    }

    // Build URL dengan query parameter
    const keyword = search.trim();
    const searchUrl = `${KOMERCE_BASE_URL}/destination/search?keyword=${encodeURIComponent(keyword)}`;

    console.log('[SHIPPING_SEARCH] Searching destination:', keyword);

    let response;
    try {
      // Fetch dengan timeout 10 detik
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (fetchError) {
      // Tangani timeout dan network error - silent, return empty array
      if (fetchError.name === 'AbortError') {
        console.warn('[SHIPPING_SEARCH] Request timeout (silent)');
      } else {
        console.warn('[SHIPPING_SEARCH] Fetch failed (silent):', fetchError.message);
      }
      return NextResponse.json({
        success: true,
        message: 'Gagal mengambil data',
        data: []
      });
    }

    // Tangani HTTP error (400/401/422/500) - silent, return empty array
    if (!response || !response.ok) {
      const status = response?.status || 0;
      console.warn('[SHIPPING_SEARCH] HTTP error (silent):', status);
      
      // Tangani berbagai status code
      if (status === 400 || status === 401 || status === 422) {
        // Bad request, unauthorized, atau unprocessable entity - silent
        return NextResponse.json({
          success: true,
          message: 'Request tidak valid',
          data: []
        });
      }
      
      // Error lainnya - silent
      return NextResponse.json({
        success: true,
        message: 'Gagal mengambil data',
        data: []
      });
    }

    // Parse response text
    const responseText = await response.text();

    // Tangani response kosong
    if (!responseText || responseText.trim().length === 0) {
      console.warn('[SHIPPING_SEARCH] Empty response (silent)');
      return NextResponse.json({
        success: true,
        message: 'Response kosong',
        data: []
      });
    }

    // Parse JSON - silent error jika gagal
    let json;
    try {
      json = JSON.parse(responseText);
    } catch (parseError) {
      // Silent error - return empty array
      console.warn('[SHIPPING_SEARCH] JSON parse error (silent):', parseError.message);
      return NextResponse.json({
        success: true,
        message: 'Format response tidak valid',
        data: []
      });
    }

    // Handle berbagai format response dari Komerce
    // Format bisa: { data: [...] } atau langsung array atau { results: [...] }
    let results = [];

    if (Array.isArray(json)) {
      // Format: langsung array
      results = json;
    } else if (json.data && Array.isArray(json.data)) {
      // Format: { data: [...] }
      results = json.data;
    } else if (json.results && Array.isArray(json.results)) {
      // Format: { results: [...] }
      results = json.results;
    } else if (json.success && Array.isArray(json.data)) {
      // Format: { success: true, data: [...] }
      results = json.data;
    } else {
      // Format tidak dikenal - silent error, return empty array
      console.warn('[SHIPPING_SEARCH] Unknown response format (silent)');
      return NextResponse.json({
        success: true,
        message: 'Format response tidak dikenal',
        data: []
      });
    }

    // Normalize data untuk frontend
    const normalizedData = results.map(item => ({
      id: item.id || item.destination_id || item.city_id || '',
      destination_id: item.destination_id || item.id || item.city_id || '',
      city_id: item.city_id || item.destination_id || item.id || '',
      city_name: item.city_name || item.name || item.label || '',
      province_name: item.province_name || item.province || '',
      province_id: item.province_id || '',
      type: item.type || '',
      postal_code: item.postal_code || item.postal || '',
      label: item.label || `${item.city_name || item.name || ''}, ${item.province_name || item.province || ''}`.trim()
    }));

    console.log('[SHIPPING_SEARCH] Found', normalizedData.length, 'results');

    // Return normalized data dengan format standar
    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil data',
      data: normalizedData
    });

  } catch (error) {
    // Catch-all error handler - tidak boleh crash
    // Silent error - return empty array
    console.warn('[SHIPPING_SEARCH] Unexpected error (silent):', error.message);
    return NextResponse.json({
      success: true,
      message: 'Terjadi kesalahan',
      data: []
    });
  }
}

