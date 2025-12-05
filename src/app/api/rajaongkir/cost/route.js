import { NextResponse } from 'next/server';

const API_KEY = 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';
const RAJAONGKIR_BASE_URL = 'https://api.rajaongkir.com/starter';

export async function POST(request) {
  try {

    const body = await request.json();
    const { origin, destination, weight, courier } = body;

    // Validasi input
    if (!origin || !destination || !weight || !courier) {
      return NextResponse.json(
        {
          success: false,
          message: 'origin, destination, weight, dan courier wajib diisi'
        },
        { status: 400 }
      );
    }

    // Validasi origin dan destination harus angka (city_id) - RajaOngkir V1 Basic hanya menerima city_id
    if (isNaN(parseInt(origin, 10))) {
      return NextResponse.json(
        {
          success: false,
          message: 'origin harus berupa city_id (angka)'
        },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(destination, 10))) {
      return NextResponse.json(
        {
          success: false,
          message: 'destination harus berupa city_id (angka)'
        },
        { status: 400 }
      );
    }

    // Validasi weight
    const weightNum = parseInt(weight, 10);
    if (isNaN(weightNum) || weightNum < 1 || weightNum > 50000) {
      return NextResponse.json(
        {
          success: false,
          message: 'weight harus antara 1 dan 50000 gram'
        },
        { status: 400 }
      );
    }

    // Build URL-encoded body (RajaOngkir V1 Basic requires form-urlencoded)
    // CATATAN: RajaOngkir V1 Basic hanya menerima CITY_ID (bukan subdistrict_id)
    // Format: origin="151" (city_id), destination="23" (city_id), weight=1000, courier="jne"
    const params = new URLSearchParams();
    params.append('origin', String(origin));      // city_id (contoh: "151" untuk Jakarta Barat)
    params.append('destination', String(destination)); // city_id (contoh: "23" untuk Bandung)
    params.append('weight', String(weightNum));
    params.append('courier', String(courier).toLowerCase());

    console.log('[RAJAONGKIR_COST] Requesting cost (V1 Basic - CITY_ID only):', {
      origin: String(origin),      // city_id
      destination: String(destination), // city_id
      weight: weightNum,
      courier: courier.toLowerCase()
    });

    let response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      response = await fetch(`${RAJAONGKIR_BASE_URL}/cost`, {
        method: 'POST',
        headers: {
          'key': API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (fetchError) {
      console.error('[RAJAONGKIR_COST] Fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          message: 'Gagal terhubung ke API RajaOngkir'
        },
        { status: 503 }
      );
    }

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (err) {
      console.error('[RAJAONGKIR_COST] JSON parse error:', err.message);
      console.error('[RAJAONGKIR_COST] Raw response:', responseText.substring(0, 500));
      return NextResponse.json(
        {
          success: false,
          message: 'Response dari RajaOngkir bukan JSON'
        },
        { status: 500 }
      );
    }

    // Check if RajaOngkir returned an error
    if (data.rajaongkir?.status?.code !== 200) {
      const errorMsg = data.rajaongkir?.status?.description || 'Gagal menghitung ongkir';
      return NextResponse.json(
        {
          success: false,
          message: errorMsg,
          raw: data
        },
        { status: response.status }
      );
    }

    // Parse RajaOngkir response and normalize
    const rajaongkir = data.rajaongkir;
    if (!rajaongkir || !rajaongkir.results || rajaongkir.results.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tidak ada hasil ongkir untuk rute ini',
          raw: data
        },
        { status: 200 }
      );
    }

    const result = rajaongkir.results[0];
    if (!result.costs || result.costs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Ongkir tidak tersedia untuk rute ini',
          raw: data
        },
        { status: 200 }
      );
    }

    // Ambil cost pertama (biasanya REG)
    const cost = result.costs[0];
    const price = parseInt(cost.value || 0, 10);
    const etd = cost.etd || '';

    // Return normalized JSON
    return NextResponse.json({
      success: true,
      data: {
        price,
        etd,
        raw: data
      }
    });
  } catch (error) {
    console.error('[RAJAONGKIR_COST] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Terjadi kesalahan saat menghitung ongkir'
      },
      { status: 500 }
    );
  }
}

