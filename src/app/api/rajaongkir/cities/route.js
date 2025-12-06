import { NextResponse } from 'next/server'

const API_KEY = process.env.RAJAONGKIR_API_KEY
const BASE_URL = 'https://api.rajaongkir.com/starter'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase() || ''

    const response = await fetch(`${BASE_URL}/city`, {
      method: 'GET',
      headers: {
        key: API_KEY
      }
    })

    const text = await response.text()

    // Cek valid JSON
    let json
    try {
      json = JSON.parse(text)
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          message: 'Response dari RajaOngkir bukan JSON',
          debug: text,
          data: []
        },
        { status: 200 }
      )
    }

    // Struktur resmi Starter:
    // { rajaongkir: { status: { code, description }, results: [] } }
    if (!json.rajaongkir) {
      return NextResponse.json(
        {
          success: false,
          message: 'Format tidak valid dari RajaOngkir',
          debug: json,
          data: []
        },
        { status: 200 }
      )
    }

    const { status, results } = json.rajaongkir

    if (status.code !== 200) {
      return NextResponse.json(
        {
          success: false,
          message: status.description || 'Gagal mengambil data kota',
          data: []
        },
        { status: 200 }
      )
    }

    if (!Array.isArray(results)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Data kota tidak ditemukan',
          data: []
        },
        { status: 200 }
      )
    }

    // Filter search (jika ada)
    let list = results
    if (search) {
      list = list.filter(
        c =>
          c.city_name.toLowerCase().includes(search) ||
          c.province.toLowerCase().includes(search)
      )
    }

    const formatted = list.map(c => ({
      city_id: c.city_id,
      city_name: c.city_name,
      province_id: c.province_id,
      province_name: c.province,
      type: c.type || '',
      postal_code: c.postal_code || '',
      label: `${c.city_name}, ${c.province}`
    }))

    return NextResponse.json(
      {
        success: true,
        data: formatted,
        count: formatted.length
      },
      { status: 200 }
    )
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Terjadi kesalahan saat mengambil data kota',
        data: []
      },
      { status: 200 }
    )
  }
}
