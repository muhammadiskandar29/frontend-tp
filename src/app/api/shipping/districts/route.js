import { NextResponse } from 'next/server';

const API_KEY = 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';
const KOMERCE_BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get('city_id');

    if (!cityId) {
      return NextResponse.json({
        success: false,
        message: 'city_id wajib diisi',
        data: []
      }, { status: 200 });
    }

    // ✅ pakai path param
    const districtsUrl = `${KOMERCE_BASE_URL}/destination/district/${cityId}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(districtsUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'key': API_KEY
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: `Gagal mengambil data (HTTP ${response.status})`,
        data: []
      }, { status: 200 });
    }

    const json = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil data districts',
      data: json.data || []
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `Terjadi kesalahan: ${error.message}`,
      data: []
    }, { status: 200 });
  }
}
