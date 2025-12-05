import { NextResponse } from 'next/server';

const KOMERCE_BASE_URL = 'https://rajaongkir.komerce.id/api/v1';
// Hardcode API key (untuk production, lebih baik pakai environment variable)
const RAJAONGKIR_KEY = process.env.RAJAONGKIR_KEY || 'mT8nGMeZ4cacc72ba9d93fd4g2xH48Gb';

export async function GET(request) {
  try {
    if (!RAJAONGKIR_KEY) {
      console.error('[KOMERCE_DESTINATION] RAJAONGKIR_KEY tidak ditemukan di environment');
      console.error('[KOMERCE_DESTINATION] Pastikan RAJAONGKIR_KEY sudah di-set di Vercel Environment Variables');
      return NextResponse.json(
        { 
          success: false, 
          message: 'API key tidak dikonfigurasi. Silakan hubungi admin untuk mengkonfigurasi RAJAONGKIR_KEY di Vercel.' 
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || searchParams.get('search') || '';
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';

    // Tidak ada validasi minimal karakter - biarkan user ketik bebas
    // Jika search kosong, API Komerce akan return semua data atau error sendiri
    if (!search) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          message: 'Masukkan kata kunci untuk mencari kota tujuan',
        },
        { status: 200 }
      );
    }

    // Build URL sesuai dokumentasi: /api/v1/destination/domestic-destination?search=jakarta&limit=5&offset=0
    const url = `${KOMERCE_BASE_URL}/destination/domestic-destination?search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}`;

    console.log('[KOMERCE_DESTINATION] Requesting:', url);
    console.log('[KOMERCE_DESTINATION] API Key:', RAJAONGKIR_KEY ? 'Set' : 'Not Set');

    let response;
    try {
      // Create AbortController untuk timeout (lebih kompatibel)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout
      
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'key': RAJAONGKIR_KEY, // Dokumentasi menggunakan 'key' bukan 'api-key'
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError) {
      console.error('[KOMERCE_DESTINATION] Fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          message: 'Gagal terhubung ke API Komerce. Periksa koneksi atau API mungkin sedang down.',
          error: 'CONNECTION_FAILED',
          details: fetchError.message,
        },
        { status: 503 }
      );
    }

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (err) {
      console.error('[KOMERCE_DESTINATION] Non-JSON response:', responseText.substring(0, 500));
      return NextResponse.json(
        { success: false, message: 'Response dari Komerce bukan JSON' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('[KOMERCE_DESTINATION] Error response:', data);
      return NextResponse.json(
        {
          success: false,
          message: data?.message || data?.error || 'Gagal mengambil data destinasi',
          error: data,
        },
        { status: response.status }
      );
    }

    // Parse response dari Komerce API
    // Response format: { data: [...], meta: {...} } atau langsung array
    let destinations = [];
    if (data?.data && Array.isArray(data.data)) {
      destinations = data.data;
    } else if (Array.isArray(data)) {
      destinations = data;
    } else if (data?.results && Array.isArray(data.results)) {
      destinations = data.results;
    }

    // Filter untuk hanya mengambil CITY data (untuk RajaOngkir V1 Basic)
    // V1 Basic hanya menerima CITY_ID, bukan subdistrict_id
    // PENTING: Hanya ambil data kota (city), bukan subdistrict/kecamatan/kelurahan
    const cityDestinations = destinations
      .filter(dest => {
        // STRICT FILTER: Hanya ambil data yang:
        // 1. Punya city_id (bukan subdistrict_id)
        // 2. TIDAK punya subdistrict_id sama sekali (atau null/undefined/kosong)
        // 3. TIDAK punya district_id (kecamatan)
        // 4. Type adalah "city" atau tidak ada type (bukan "subdistrict" atau "district")
        
        const hasCityId = !!(dest.city_id || (dest.id && !dest.subdistrict_id && !dest.district_id));
        const noSubdistrictId = !dest.subdistrict_id || dest.subdistrict_id === null || dest.subdistrict_id === undefined || dest.subdistrict_id === '';
        const noDistrictId = !dest.district_id || dest.district_id === null || dest.district_id === undefined || dest.district_id === '';
        const isCityType = !dest.type || 
          dest.type.toLowerCase() === 'city' || 
          dest.type.toLowerCase() === 'kota' ||
          dest.type.toLowerCase() === 'kabupaten';
        const notSubdistrictType = dest.type && 
          dest.type.toLowerCase() !== 'subdistrict' && 
          dest.type.toLowerCase() !== 'kecamatan' &&
          dest.type.toLowerCase() !== 'kelurahan';
        
        // REJECT jika punya subdistrict_id atau district_id
        if (dest.subdistrict_id || dest.district_id) {
          console.log('[KOMERCE_DESTINATION] REJECTING (has subdistrict/district):', {
            city_id: dest.city_id,
            subdistrict_id: dest.subdistrict_id,
            district_id: dest.district_id,
            name: dest.city_name || dest.name || dest.label
          });
          return false;
        }
        
        const isValid = hasCityId && noSubdistrictId && noDistrictId && (isCityType || notSubdistrictType);
        
        if (!isValid) {
          console.log('[KOMERCE_DESTINATION] REJECTING (filter failed):', {
            hasCityId,
            noSubdistrictId,
            noDistrictId,
            isCityType,
            notSubdistrictType,
            dest: dest.city_name || dest.name || dest.label
          });
        }
        
        return isValid;
      })
      .map(dest => {
        // Normalize response untuk memastikan city_id tersedia
        const cityId = dest.city_id || dest.id;
        const cityName = dest.city_name || dest.name || dest.label || '';
        const provinceName = dest.province_name || '';
        
        return {
          city_id: cityId, // Hanya gunakan city_id, jangan gunakan subdistrict_id
          city_name: cityName,
          province_id: dest.province_id || '',
          province_name: provinceName,
          type: dest.type || 'city',
          postal_code: dest.postal_code || '',
          // Untuk display - hanya kota dan provinsi
          label: dest.label || `${cityName}${provinceName ? ', ' + provinceName : ''}`.trim(),
          // Jangan include subdistrict_id atau district_id
          // Keep original data untuk reference (tapi pastikan city_id yang digunakan)
        };
      })
      // Remove duplicates berdasarkan city_id
      .filter((dest, index, self) => 
        index === self.findIndex(d => d.city_id === dest.city_id)
      );

    console.log('[KOMERCE_DESTINATION] Filtered cities:', cityDestinations.length, 'from', destinations.length, 'total results');

    // Return response dari Komerce (hanya city data)
    return NextResponse.json({
      success: true,
      data: cityDestinations,
    });
  } catch (error) {
    console.error('[KOMERCE_DESTINATION] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal terhubung ke Komerce API',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

