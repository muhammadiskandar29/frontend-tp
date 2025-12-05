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
if (!data || !data.rajaongkir) {
  console.error("[RAJAONGKIR_CITIES] Invalid structure:", data);
  return NextResponse.json(
    {
      success: false,
      message: "Response dari RajaOngkir tidak mengandung data"
    },
    { status: 500 }
  );
}

// Validate status object
const statusCode = data.rajaongkir.status?.code;
const statusMsg = data.rajaongkir.status?.description || "Gagal mengambil data kota";

if (statusCode !== 200) {
  console.error("[RAJAONGKIR_CITIES] Status error:", data.rajaongkir.status);

  return NextResponse.json(
    {
      success: false,
      message: statusMsg
    },
    { status: 400 }
  );
}


    let list = json.rajaongkir.results;

    // local filter
    if (search) {
      list = list.filter(
        (c) =>
          c.city_name.toLowerCase().includes(search) ||
          c.province.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: list
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e.message },
      { status: 500 }
    );
  }
}
