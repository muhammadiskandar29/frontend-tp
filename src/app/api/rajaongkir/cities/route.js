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

    if (json.rajaongkir.status.code !== 200) {
      return NextResponse.json(
        {
          success: false,
          message: json.rajaongkir.status.description || 'Gagal mengambil data kota'
        },
        { status: json.rajaongkir.status.code }
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
