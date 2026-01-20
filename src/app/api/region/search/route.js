import { NextResponse } from 'next/server';
import districtData from '@/data/indonesia-districts.json';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 3) {
        return NextResponse.json({ success: true, data: [] });
    }

    const lowerTerm = query.toLowerCase();

    // Filter logic sama dengan yang ada di client sebelumnya
    // Struktur data: { id, kecamatan, kota, provinsi }
    const results = districtData.filter(item =>
        (item.kecamatan && item.kecamatan.toLowerCase().includes(lowerTerm))
    ).slice(0, 50); // Limit 50 results

    return NextResponse.json({ success: true, data: results });
}
