import { NextResponse } from 'next/server'

const API_KEY = process.env.RAJAONGKIR_API_KEY
const BASE_URL = 'https://rajaongkir.komerce.id/api/v1'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = searchParams.get('limit') || 20
    const offset = searchParams.get('offset') || 0

    const url = `${BASE_URL}/destination/domestic-destination?search=${search}&limit=${limit}&offset=${offset}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        key: API_KEY
      }
    })

    const json = await response.json()

    if (!json.success) {
      return NextResponse.json(
        {
          success: false,
          message: json.message || 'Gagal mengambil data dari API',
          data: []
        },
        { status: 200 }
      )
    }

    const list = json.data || []

    // format ulang biar rapi
    const formatted = list.map(item => ({
      subdistrict_id: item.subdistrict_id,
      subdistrict_name: item.subdistrict_name,
      district_name: item.district_name,
      city_name: item.city_name,
      province_name: item.province_name,
      label: `${item.city_name}, ${item.province_name}`
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
        message: err.message,
        data: []
      },
      { status: 200 }
    )
  }
}
