import { NextResponse } from 'next/server';

const API_KEY = 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';

    const response = await fetch('https://api.rajaongkir.com/starter/city', {
      method: 'GET',
      headers: {
        key: API_KEY
      }
    });

    const json = await response.json();

    // Validate top-level structure
    if (!json || !json.rajaongkir) {
      console.error("[RAJAONGKIR_CITIES] Invalid structure:", json);
      return NextResponse.json(
        {
          success: false,
          message: "Response dari RajaOngkir tidak mengandung data"
        },
        { status: 500 }
      );
    }

    // Validate status object
    const statusCode = json.rajaongkir.status?.code;
    const statusMsg = json.rajaongkir.status?.description || "Gagal mengambil data kota";

    if (statusCode !== 200) {
      console.error("[RAJAONGKIR_CITIES] Status error:", json.rajaongkir.status);
      return NextResponse.json(
        {
          success: false,
          message: statusMsg
        },
        { status: 400 }
      );
    }

    // Check if results exist
    if (!json.rajaongkir.results || !Array.isArray(json.rajaongkir.results)) {
      return NextResponse.json(
        {
          success: false,
          message: "Data kota tidak ditemukan"
        },
        { status: 500 }
      );
    }

    let list = json.rajaongkir.results;

    // Local filter
    if (search) {
      list = list.filter(
        (c) =>
          c.city_name?.toLowerCase().includes(search) ||
          c.province?.toLowerCase().includes(search)
      );
    }

    // Format response sesuai yang diharapkan frontend
    const formattedCities = list.map(city => ({
      city_id: city.city_id,
      city_name: city.city_name,
      province_id: city.province_id,
      province_name: city.province,
      type: city.type || '',
      postal_code: city.postal_code || '',
      label: `${city.city_name}, ${city.province}`.trim(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedCities,
      count: formattedCities.length
    });
  } catch (e) {
    console.error('[RAJAONGKIR_CITIES] Error:', e);
    return NextResponse.json(
      { 
        success: false, 
        message: e.message || 'Terjadi kesalahan saat mengambil data kota' 
      },
      { status: 500 }
    );
  }
}
