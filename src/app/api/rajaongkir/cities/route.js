import { NextResponse } from 'next/server'

const API_KEY = process.env.RAJAONGKIR_API_KEY
const BASE_URL = 'https://rajaongkir.komerce.id/api/v1'

export async function GET(request) {
  try {
    // Validate API key
    if (!API_KEY) {
      console.error('[RAJAONGKIR/CITIES] API_KEY is not set')
      return NextResponse.json({ success: false, message: 'API key not configured', data: [] }, { status: 200 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''
    const limit = Number(searchParams.get('limit') || 10)
    const offset = Number(searchParams.get('offset') || 0)

    const url = `${BASE_URL}/destination/domestic-destination?search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        key: API_KEY
      }
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return NextResponse.json({ success: false, message: `Upstream HTTP ${response.status}`, debug: text, data: [] }, { status: 200 })
    }

    const json = await response.json().catch(() => null)
    if (!json || !json.success) {
      return NextResponse.json({ success: false, message: json?.message || 'Invalid upstream response', debug: json, data: [] }, { status: 200 })
    }

    const list = Array.isArray(json.data) ? json.data : []

    const formatted = list.map(item => ({
      subdistrict_id: item.subdistrict_id,
      subdistrict_name: item.subdistrict_name || item.subdistrict,
      district_id: item.district_id,
      district_name: item.district_name,
      city_id: item.city_id,
      city_name: item.city_name,
      province_id: item.province_id,
      province_name: item.province_name,
      label: `${item.subdistrict_name || item.subdistrict}, ${item.city_name}, ${item.province_name}`
    }))

    return NextResponse.json({ success: true, data: formatted, count: formatted.length }, { status: 200 })
  } catch (err) {
    console.error('[RAJAONGKIR/CITIES] Error:', err)
    return NextResponse.json({ success: false, message: err.message || 'Internal error', data: [] }, { status: 200 })
  }
}
