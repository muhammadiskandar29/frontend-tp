import { NextResponse } from 'next/server';

const API_KEY = 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';
const KOMERCE_BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

export async function POST(request) {
  try {
    const body = await request.json();
    const { origin, destination, weight, courier } = body;

    if (!origin || !destination || !weight || !courier) {
      return NextResponse.json({
        success: false,
        message: 'origin, destination, weight, dan courier wajib diisi',
        data: []
      }, { status: 200 });
    }

    // 🔥 Build form-urlencoded
    const formData = new URLSearchParams();
    formData.append('origin', origin);
    formData.append('destination', destination);
    formData.append('weight', weight);
    formData.append('courier', courier.toLowerCase());
    formData.append('price', 'lowest');

    const costUrl = `${KOMERCE_BASE_URL}/calculate/district/domestic-cost`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(costUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'key': API_KEY,
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString(), // 🔥 WAJIB form-encoded string
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = response.status;
      const responseText = await response.text();
      console.error('[SHIPPING_CALCULATE] HTTP Error:', status, responseText);

      return NextResponse.json({
        success: false,
        message: `Gagal menghitung ongkir (HTTP ${status})`,
        data: []
      }, { status: 200 });
    }

    const json = await response.json();

    const results = json.data || [];

    const normalizedData = results.map(item => ({
      courier: item.code || item.courier || '',
      service: item.service || '',
      description: item.description || '',
      etd: item.etd || '',
      cost: item.cost || 0
    }));

    return NextResponse.json({
      success: true,
      message: 'Berhasil menghitung ongkir',
      data: normalizedData
    }, { status: 200 });

  } catch (error) {
    console.error('[SHIPPING_CALCULATE] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: `Terjadi kesalahan: ${error.message}`,
      data: []
    }, { status: 200 });
  }
}
