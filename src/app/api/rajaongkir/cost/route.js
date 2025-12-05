import { NextResponse } from 'next/server';

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
const RAJAONGKIR_BASE_URL = 'https://api.rajaongkir.com/starter';

export async function POST(request) {
  try {
    if (!RAJAONGKIR_API_KEY) {
      console.error('[RAJAONGKIR_COST] RAJAONGKIR_API_KEY tidak ditemukan di environment');
      return NextResponse.json(
        { 
          rajaongkir: {
            status: {
              code: 400,
              description: 'API key tidak dikonfigurasi'
            }
          }
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { origin, destination, weight, courier } = body;

    // Validasi input
    if (!origin || !destination || !weight || !courier) {
      return NextResponse.json(
        {
          rajaongkir: {
            status: {
              code: 400,
              description: 'origin, destination, weight, dan courier wajib diisi'
            }
          }
        },
        { status: 400 }
      );
    }

    // Validasi destination harus angka (city_id)
    if (isNaN(parseInt(destination, 10))) {
      return NextResponse.json(
        {
          rajaongkir: {
            status: {
              code: 400,
              description: 'destination harus berupa city_id (angka)'
            }
          }
        },
        { status: 400 }
      );
    }

    // Validasi weight
    const weightNum = parseInt(weight, 10);
    if (isNaN(weightNum) || weightNum < 1 || weightNum > 50000) {
      return NextResponse.json(
        {
          rajaongkir: {
            status: {
              code: 400,
              description: 'weight harus antara 1 dan 50000 gram'
            }
          }
        },
        { status: 400 }
      );
    }

    // Build URL-encoded body (RajaOngkir requires form-urlencoded, NOT JSON)
    const params = new URLSearchParams();
    params.append('origin', String(origin));
    params.append('destination', String(destination));
    params.append('weight', String(weightNum));
    params.append('courier', String(courier).toLowerCase());

    console.log('[RAJAONGKIR_COST] Requesting cost:', {
      origin,
      destination,
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
          'key': RAJAONGKIR_API_KEY,
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
          rajaongkir: {
            status: {
              code: 503,
              description: 'Gagal terhubung ke API RajaOngkir'
            }
          }
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
          rajaongkir: {
            status: {
              code: 500,
              description: 'Response dari RajaOngkir bukan JSON'
            }
          }
        },
        { status: 500 }
      );
    }

    // Return response exactly from RajaOngkir
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[RAJAONGKIR_COST] Unexpected error:', error);
    return NextResponse.json(
      {
        rajaongkir: {
          status: {
            code: 500,
            description: error.message || 'Terjadi kesalahan saat menghitung ongkir'
          }
        }
      },
      { status: 500 }
    );
  }
}

