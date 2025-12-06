import { NextResponse } from 'next/server'

const API_KEY = process.env.RAJAONGKIR_API_KEY
const BASE_URL = 'https://rajaongkir.komerce.id/api/v1/cost/domestic-cost'

async function callUpstreamCost(bodyObj) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      key: API_KEY
    },
    body: JSON.stringify(bodyObj)
  })
  const text = await res.text().catch(() => '')
  if (!res.ok) return { ok: false, status: res.status, text }
  let json = null
  try { json = JSON.parse(text) } catch(e) { return { ok: false, status: res.status, text } }
  return { ok: true, json }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const origin = searchParams.get('origin') || searchParams.get('shipper_destination_id')
    const destination = searchParams.get('destination') || searchParams.get('receiver_destination_id')
    const weight = Number(searchParams.get('weight') || '1000')
    const courier = searchParams.get('courier') || 'jne'

    if (!origin || !destination) return NextResponse.json({ success: true, data: {} }, { status: 200 })

    const upstream = await callUpstreamCost({ origin: Number(origin), destination: Number(destination), weight, courier })
    if (!upstream.ok) return NextResponse.json({ success: false, message: `Upstream error ${upstream.status}`, debug: upstream.text || upstream.json }, { status: 200 })

    const data = upstream.json?.data || upstream.json || {}
    const price = data.price || data.cost || 0
    const etd = data.etd || data.estimated_delivery || ''

    return NextResponse.json({ success: true, price, etd, data }, { status: 200 })
  } catch (err) {
    console.error('[RAJAONGKIR/COST] Error:', err)
    return NextResponse.json({ success: false, message: err.message, data: {} }, { status: 200 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const origin = body.origin
    const destination = body.destination
    const weight = Number(body.weight || 1000)
    const courier = body.courier || 'jne'

    if (!origin || !destination) return NextResponse.json({ success: true, data: {} }, { status: 200 })

    const upstream = await callUpstreamCost({ origin: Number(origin), destination: Number(destination), weight, courier })
    if (!upstream.ok) return NextResponse.json({ success: false, message: `Upstream error ${upstream.status}`, debug: upstream.text || upstream.json }, { status: 200 })

    const data = upstream.json?.data || upstream.json || {}
    const price = data.price || data.cost || 0
    const etd = data.etd || data.estimated_delivery || ''

    return NextResponse.json({ success: true, price, etd, data }, { status: 200 })
  } catch (err) {
    console.error('[RAJAONGKIR/COST] Error:', err)
    return NextResponse.json({ success: false, message: err.message, data: {} }, { status: 200 })
  }
}
