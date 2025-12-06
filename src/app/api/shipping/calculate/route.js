import { NextResponse } from 'next/server';

/**
 * Backend API Route untuk menghitung ongkir menggunakan Komerce OpenAPI
 * 
 * Endpoint: GET /api/shipping/calculate?shipper_destination_id=...&receiver_destination_id=...&weight=...&item_value=...&cod=...
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
    
    // Get query parameters
    const shipper_destination_id = searchParams.get('shipper_destination_id') || '';
    const receiver_destination_id = searchParams.get('receiver_destination_id') || '';
    const weight = searchParams.get('weight') || '1000';
    const item_value = searchParams.get('item_value') || '0';
    const cod = searchParams.get('cod') || '0';

    // Validasi minimal - shipper dan receiver wajib
    if (!shipper_destination_id || !receiver_destination_id) {
      // Silent error - return empty object
      return NextResponse.json({
        success: true,
        message: 'Parameter tidak lengkap',
        price: 0,
        etd: '',
        data: {}
      }, { status: 200 });
    }

    // Build URL dengan query parameters
    const params = new URLSearchParams();
    params.append('shipper_destination_id', shipper_destination_id);
    params.append('receiver_destination_id', receiver_destination_id);
    params.append('weight', weight);
    params.append('item_value', item_value);
    params.append('cod', cod);

    const costUrl = `${KOMERCE_BASE_URL}/calculate?${params.toString()}`;

    console.log('[SHIPPING_CALCULATE] Calculating cost:', {
      shipper_destination_id,
      receiver_destination_id,
      weight,
      item_value,
      cod
    });

    let response;
    try {
      // Fetch dengan timeout 15 detik
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      response = await fetch(costUrl, {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (fetchError) {
      // Tangani timeout dan network error - silent, return empty object
      if (fetchError.name === 'AbortError') {
        console.warn('[SHIPPING_CALCULATE] Request timeout (silent)');
      } else {
        console.warn('[SHIPPING_CALCULATE] Fetch failed (silent):', fetchError.message);
      }
      return NextResponse.json({
        success: true,
        message: 'Gagal menghitung ongkir',
        data: {}
      });
    }

    // Tangani HTTP error (400/401/422/500) - silent, return empty object
    if (!response || !response.ok) {
      const status = response?.status || 0;
      console.warn('[SHIPPING_CALCULATE] HTTP error (silent):', status);
      
      // Tangani berbagai status code
      if (status === 400 || status === 401 || status === 422) {
        // Bad request, unauthorized, atau unprocessable entity - silent
        return NextResponse.json({
          success: true,
          message: 'Request tidak valid',
          data: {}
        });
      }
      
      // Error lainnya - silent
      return NextResponse.json({
        success: true,
        message: 'Gagal menghitung ongkir',
        data: {}
      });
    }

    // Parse response text
    const responseText = await response.text();

    // Tangani response kosong
    if (!responseText || responseText.trim().length === 0) {
      console.warn('[SHIPPING_CALCULATE] Empty response (silent)');
      return NextResponse.json({
        success: true,
        message: 'Response kosong',
        data: {}
      });
    }

    // Parse JSON - silent error jika gagal
    let json;
    try {
      json = JSON.parse(responseText);
    } catch (parseError) {
      // Silent error - return empty object
      console.warn('[SHIPPING_CALCULATE] JSON parse error (silent):', parseError.message);
      return NextResponse.json({
        success: true,
        message: 'Format response tidak valid',
        data: {}
      });
    }

    // Handle berbagai format response dari Komerce
    // Format bisa: { data: {...} } atau langsung object atau { result: {...} }
    let costData = {};

    if (json.data && typeof json.data === 'object') {
      // Format: { data: {...} }
      costData = json.data;
    } else if (json.result && typeof json.result === 'object') {
      // Format: { result: {...} }
      costData = json.result;
    } else if (json.success && json.data && typeof json.data === 'object') {
      // Format: { success: true, data: {...} }
      costData = json.data;
    } else if (typeof json === 'object' && !Array.isArray(json)) {
      // Format: langsung object
      costData = json;
    } else {
      // Format tidak dikenal - silent error, return empty object
      console.warn('[SHIPPING_CALCULATE] Unknown response format (silent)');
      return NextResponse.json({
        success: true,
        message: 'Format response tidak dikenal',
        data: {}
      });
    }

    // Normalize data untuk frontend
    // Extract price/cost dari berbagai kemungkinan field
    const normalizedData = {
      price: costData.price || costData.cost || costData.total_cost || costData.ongkir || 0,
      etd: costData.etd || costData.estimated_delivery || costData.delivery_time || '',
      courier: costData.courier || costData.shipping_method || '',
      service: costData.service || costData.service_type || '',
      raw: costData // Include raw data untuk debugging
    };

    console.log('[SHIPPING_CALCULATE] Calculated cost:', normalizedData.price);

    // Return normalized data dengan format standar
    // Pastikan selalu return price dan etd di level atas untuk kompatibilitas frontend
    return NextResponse.json({
      success: true,
      message: 'Berhasil menghitung ongkir',
      price: normalizedData.price || 0,
      etd: normalizedData.etd || '',
      data: normalizedData
    }, { status: 200 });

  } catch (error) {
    // Catch-all error handler - tidak boleh crash
    // Silent error - return empty object
    console.warn('[SHIPPING_CALCULATE] Unexpected error (silent):', error.message);
    return NextResponse.json({
      success: true,
      message: 'Terjadi kesalahan',
      data: {}
    });
  }
}

