import { NextResponse } from 'next/server';

const RAJAONGKIR_API_KEY = mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb;
const RAJAONGKIR_BASE_URL = 'https://api.rajaongkir.com/starter';

export async function GET(request) {
  try {
    if (!RAJAONGKIR_API_KEY) {
      console.error('[RAJAONGKIR_CITIES] RAJAONGKIR_API_KEY tidak ditemukan di environment');
      return NextResponse.json(
        {
          success: false,
          message: 'API key tidak dikonfigurasi'
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search') || '';

    console.log('[RAJAONGKIR_CITIES] Requesting cities, search:', searchQuery);

    let response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // RajaOngkir API: GET /starter/city?key=API_KEY
      response = await fetch(`${RAJAONGKIR_BASE_URL}/city?key=${RAJAONGKIR_API_KEY}`, {
        method: 'GET',
        headers: {
          'key': RAJAONGKIR_API_KEY,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (fetchError) {
      console.error('[RAJAONGKIR_CITIES] Fetch error:', fetchError);
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
      console.error('[RAJAONGKIR_CITIES] JSON parse error:', err.message);
      console.error('[RAJAONGKIR_CITIES] Raw response:', responseText.substring(0, 500));
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
      const errorMsg = data.rajaongkir?.status?.description || 'Gagal mengambil data kota';
      return NextResponse.json(
        {
          success: false,
          message: errorMsg
        },
        { status: response.status }
      );
    }

    // Check if response is valid
    if (!data.rajaongkir || !data.rajaongkir.results) {
      return NextResponse.json(
        {
          success: false,
          message: 'Format response tidak valid dari RajaOngkir'
        },
        { status: 500 }
      );
    }

    // Filter by search query if provided (local filtering)
    let cities = data.rajaongkir.results;
    if (searchQuery && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      cities = cities.filter(city => {
        const cityName = (city.city_name || '').toLowerCase();
        const provinceName = (city.province || '').toLowerCase();
        return cityName.includes(searchLower) || provinceName.includes(searchLower);
      });
    }

    // Format response: { city_id, city_name, province }
    const formattedCities = cities.map(city => ({
      city_id: city.city_id,
      city_name: city.city_name,
      province_id: city.province_id,
      province_name: city.province,
      type: city.type || '',
      postal_code: city.postal_code || '',
      label: `${city.city_name}, ${city.province}`.trim(),
    }));

    // Return formatted response
    return NextResponse.json({
      success: true,
      data: formattedCities,
      count: formattedCities.length,
    });
  } catch (error) {
    console.error('[RAJAONGKIR_CITIES] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengambil data kota'
      },
      { status: 500 }
    );
  }
}

