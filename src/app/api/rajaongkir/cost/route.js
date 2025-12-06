import { NextResponse } from 'next/server';

/**
 * Backend API Route untuk menghitung ongkir menggunakan Komerce RajaOngkir V2
 * 
 * Endpoint: GET /api/rajaongkir/cost?shipper_destination_id=...&receiver_destination_id=...&weight=...&item_value=...&cod=...
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
        data: {}
      });
    }

    // Build URL dengan query parameters
    const params = new URLSearchParams();
    params.append('shipper_destination_id', shipper_destination_id);
    params.append('receiver_destination_id', receiver_destination_id);
    params.append('weight', weight);
    params.append('item_value', item_value);
    params.append('cod', cod);

    const costUrl = `${KOMERCE_BASE_URL}/calculate?${params.toString()}`;

    console.log('[KOMERCE_COST] Calculating cost:', {
      shipper_destination_id,
      receiver_destination_id,
      weight,
      item_value,
      cod
    });

    let response;
    try {
      response = await fetch(costUrl, {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
    } catch (fetchError) {
      // Silent error - tidak crash, return empty object
      console.warn('[KOMERCE_COST] Fetch failed (silent):', fetchError.message);
      return NextResponse.json({
        success: true,
        data: {}
      });
    }

    // Handle HTTP error - silent, return empty object
    if (!response || !response.ok) {
      console.warn('[KOMERCE_COST] HTTP error (silent):', response?.status);
      return NextResponse.json({
        success: true,
        data: {}
      });
    }

    const responseText = await response.text();

    // Parse JSON - silent error jika gagal
    let json;
    try {
      json = JSON.parse(responseText);
    } catch (parseError) {
      // Silent error - return empty object
      console.warn('[KOMERCE_COST] JSON parse error (silent):', parseError.message);
      return NextResponse.json({
        success: true,
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
      console.warn('[KOMERCE_COST] Unknown response format (silent)');
      return NextResponse.json({
        success: true,
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

    console.log('[KOMERCE_COST] Calculated cost:', normalizedData.price);

    // Return normalized data
    return NextResponse.json({
      success: true,
      price: normalizedData.price,
      etd: normalizedData.etd,
      data: normalizedData
    });

  } catch (error) {
    // Catch-all error handler - tidak boleh crash
    // Silent error - return empty object
    console.warn('[KOMERCE_COST] Unexpected error (silent):', error.message);
    return NextResponse.json({
      success: true,
      data: {}
    });
  }
}
