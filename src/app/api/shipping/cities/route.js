import { NextResponse } from 'next/server'

const API_KEY = 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';
const KOMERCE_BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceId = searchParams.get('province_id');

    if (!provinceId) {
      return NextResponse.json({
        success: false,
        message: 'province_id wajib diisi',
        data: []
      }, { status: 200 });
    }

    // ✅ Pakai path parameter, bukan query
    const citiesUrl = `${KOMERCE_BASE_URL}/destination/city/${provinceId}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(citiesUrl, {
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
      message: 'Berhasil mengambil data cities',
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
