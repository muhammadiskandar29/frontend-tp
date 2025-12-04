import { NextResponse } from 'next/server';

const KOMERCE_BASE_URL = 'https://rajaongkir-api.komerce.co.id';
const RAJAONGKIR_KEY = process.env.RAJAONGKIR_KEY;

export async function GET(request) {
  try {
    if (!RAJAONGKIR_KEY) {
      console.error('[KOMERCE_DESTINATION] RAJAONGKIR_KEY tidak ditemukan di environment');
      return NextResponse.json(
        { success: false, message: 'API key tidak dikonfigurasi' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'destination'; // origin atau destination

    // Build URL dengan query parameter
    const url = `${KOMERCE_BASE_URL}/domestic-destination${query ? `?q=${encodeURIComponent(query)}` : ''}`;

    console.log('[KOMERCE_DESTINATION] Requesting:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api-key': RAJAONGKIR_KEY,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (err) {
      console.error('[KOMERCE_DESTINATION] Non-JSON response:', responseText.substring(0, 500));
      return NextResponse.json(
        { success: false, message: 'Response dari Komerce bukan JSON' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('[KOMERCE_DESTINATION] Error response:', data);
      return NextResponse.json(
        {
          success: false,
          message: data?.message || data?.error || 'Gagal mengambil data destinasi',
          error: data,
        },
        { status: response.status }
      );
    }

    // Return response dari Komerce
    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('[KOMERCE_DESTINATION] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal terhubung ke Komerce API',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

