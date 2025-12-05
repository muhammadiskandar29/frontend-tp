"use client";

import { useState, useEffect, useRef } from "react";
import { getCost, getDestinations } from "@/lib/shipping";
import { toast } from "react-hot-toast";
import "@/styles/ongkir.css";

const COOLDOWN_DURATION = 20 * 1000; // 20 detik dalam milliseconds
const COOLDOWN_KEY = "ongkir_last_call";
const DEFAULT_WEIGHT = 1000; // Hardcode berat 1000 gram

export default function OngkirCalculator({ 
  originId, 
  onSelectOngkir,
  onAddressChange, // Callback untuk update alamat lengkap
  defaultCourier = "jne"
}) {
  const [destination, setDestination] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [destinationSearch, setDestinationSearch] = useState("");
  const [destinationResults, setDestinationResults] = useState([]);
  const [kecamatan, setKecamatan] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [kodePos, setKodePos] = useState("");
  const [courier, setCourier] = useState(defaultCourier);
  const [price, setPrice] = useState(null);
  const [etd, setEtd] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const searchTimeoutRef = useRef(null);
  const cooldownIntervalRef = useRef(null);
  const calculateTimeoutRef = useRef(null);

  // Get origin dari env atau prop
  // Origin bisa dari prop, env variable, atau hardcode fallback
  // Priority: prop > env > hardcode fallback
  // CATATAN: RajaOngkir V1 Basic hanya menerima CITY_ID (bukan subdistrict_id)
  // Contoh: Jakarta Barat = 151, Bandung = 23, Tangerang = 456
  const DEFAULT_ORIGIN_ID = "151"; // JAKARTA BARAT (contoh, ganti dengan city_id yang benar)
  const origin = originId || process.env.NEXT_PUBLIC_RAJAONGKIR_ORIGIN || DEFAULT_ORIGIN_ID;

  // Check cooldown on mount
  useEffect(() => {
    checkCooldown();
  }, []);

  // Cleanup intervals
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const checkCooldown = () => {
    const lastCall = localStorage.getItem(COOLDOWN_KEY);
    if (lastCall) {
      const timeSinceLastCall = Date.now() - parseInt(lastCall, 10);
      if (timeSinceLastCall < COOLDOWN_DURATION) {
        const remaining = Math.ceil((COOLDOWN_DURATION - timeSinceLastCall) / 1000);
        setCooldownActive(true);
        setCooldownTime(remaining);
        
        // Start countdown
        cooldownIntervalRef.current = setInterval(() => {
          const newTimeSinceLastCall = Date.now() - parseInt(lastCall, 10);
          if (newTimeSinceLastCall >= COOLDOWN_DURATION) {
            setCooldownActive(false);
            setCooldownTime(0);
            clearInterval(cooldownIntervalRef.current);
          } else {
            const remaining = Math.ceil((COOLDOWN_DURATION - newTimeSinceLastCall) / 1000);
            setCooldownTime(remaining);
          }
        }, 1000);
      } else {
        setCooldownActive(false);
        setCooldownTime(0);
      }
    }
  };

  const handleDestinationSearch = async (query) => {
    setDestinationSearch(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Tidak ada filter minimal karakter - biarkan user ketik bebas
    // Jika query kosong, clear results
    if (!query || query.trim().length === 0) {
      setDestinationResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('[ONGKIR] Searching destination with query:', query);
        const results = await getDestinations(query);
        console.log('[ONGKIR] Destination results:', results);
        setDestinationResults(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error("Error searching destination:", error);
        setDestinationResults([]);
        
        // Jangan tampilkan error toast - biarkan user terus mengetik tanpa gangguan
        // Hanya log ke console untuk debugging
        console.log('[ONGKIR] Search error (silent):', error.message);
        
        // Hanya tampilkan error untuk masalah kritis (API key)
        if (error.message && error.message.includes('API key tidak dikonfigurasi')) {
          toast.error("API key tidak dikonfigurasi. Silakan hubungi admin.");
        }
        // Untuk error lain, tidak tampilkan toast - biarkan user terus mengetik
      }
    }, 300);
  };

  const handleSelectDestination = (dest) => {
    // Handle response dari RajaOngkir API
    // PENTING: Untuk RajaOngkir V1 Basic, HANYA gunakan CITY_ID (bukan subdistrict_id)
    // User memilih KOTA (Jakarta Barat, Jakarta Timur, dll) - BUKAN detail subdistrict
    // Detail kecamatan/kelurahan/kode pos diinput manual untuk alamat lengkap, TIDAK untuk cost calculation
    
    const cityId = dest.city_id || dest.id || "";
    // Label hanya kota dan provinsi: "Jakarta Barat, DKI Jakarta"
    const label = dest.label || `${dest.city_name || ''}${dest.province_name ? ', ' + dest.province_name : ''}`.trim();
    
    console.log('[ONGKIR] Selected destination (CITY ONLY):', { 
      cityId, 
      label, 
      city_name: dest.city_name,
      province_name: dest.province_name,
      // Pastikan tidak ada subdistrict_id
      has_subdistrict_id: !!dest.subdistrict_id,
      dest 
    });
    
    // VALIDASI: Pastikan ini adalah city_id, bukan subdistrict_id
    if (dest.subdistrict_id && !dest.city_id) {
      console.error('[ONGKIR] ERROR: Selected item has subdistrict_id but no city_id!', dest);
      toast.error("Data yang dipilih bukan kota. Silakan pilih kota yang benar.");
      return;
    }
    
    // Simpan city_id untuk cost calculation (HANYA city_id, bukan subdistrict_id)
    setDestinationId(String(cityId));
    setDestination(label); // Hanya nama kota dan provinsi
    setDestinationSearch(label);
    setDestinationResults([]);
    
    // CATATAN: Field kecamatan, kelurahan, kode pos TIDAK diisi otomatis
    // User harus input manual untuk detail alamat lengkap
    // Field-field ini hanya untuk alamat lengkap, TIDAK digunakan untuk cost calculation
    // Cost calculation HANYA menggunakan city_id dari kota yang dipilih
    
    // Clear field detail (user akan input manual)
    setKecamatan("");
    setKabupaten("");
    setKodePos("");
    
    // Auto-calculate ongkir setelah destination terpilih
    // PENTING: Menggunakan CITY_ID untuk RajaOngkir V1 Basic (bukan subdistrict_id)
    if (cityId && courier) {
      console.log('[ONGKIR] Auto-calculating with city_id (NOT subdistrict_id):', cityId);
      autoCalculateOngkir(String(cityId), courier);
    } else {
      console.warn('[ONGKIR] Cannot calculate: missing cityId or courier', { cityId, courier });
    }
  };
  
  // Auto-calculate ongkir ketika kota + kurir sudah terpilih
  const autoCalculateOngkir = async (destId, selectedCourier) => {
    if (!origin) {
      console.warn('[ONGKIR] Origin tidak dikonfigurasi. Pastikan NEXT_PUBLIC_RAJAONGKIR_ORIGIN sudah di-set di .env.local');
      toast.error("Origin tidak dikonfigurasi. Silakan hubungi admin.");
      return;
    }

    if (!destId || !selectedCourier) {
      console.warn('[ONGKIR] destId (city_id) atau courier belum terisi:', { destId, selectedCourier });
      return;
    }
    
    // VALIDASI: Pastikan destId adalah city_id (bukan subdistrict_id)
    // City_id biasanya lebih kecil dari subdistrict_id (contoh: 151 vs 17523)
    // Tapi lebih baik validasi dari data yang dipilih, bukan dari angka
    console.log('[ONGKIR] Auto-calculating ongkir dengan CITY_ID:', { 
      origin, 
      destination_city_id: destId, 
      courier: selectedCourier,
      note: 'Menggunakan CITY_ID untuk RajaOngkir V1 Basic'
    });

    if (cooldownActive) {
      return;
    }

    // Debounce untuk menghindari terlalu banyak request
    if (calculateTimeoutRef.current) {
      clearTimeout(calculateTimeoutRef.current);
    }

    calculateTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setPrice(null);
      setEtd("");

      try {
        const result = await getCost({
          origin,
          destination: destId,
          weight: DEFAULT_WEIGHT,
          courier: selectedCourier,
        });

        setPrice(result.price);
        setEtd(result.etd);

        // Call callback - PASTIKAN dipanggil untuk update grand total
        if (onSelectOngkir && result.price) {
          console.log('[ONGKIR] Calling onSelectOngkir with price:', result.price);
          onSelectOngkir(result.price);
        }

        // Set cooldown
        localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
        checkCooldown();

        toast.success("Ongkir berhasil dihitung");
      } catch (error) {
        console.error("Error calculating cost:", error);
        
        if (error.message.includes("rate limit") || error.message.includes("Terlalu banyak")) {
          toast.error("Terlalu banyak request. Silakan coba lagi dalam beberapa saat.");
        } else {
          toast.error(error.message || "Gagal menghitung ongkir");
        }
        
        setPrice(null);
        setEtd("");
      } finally {
        setLoading(false);
      }
    }, 500); // Debounce 500ms
  };

  // Auto-calculate ketika kurir berubah
  useEffect(() => {
    if (destinationId && courier && origin) {
      autoCalculateOngkir(destinationId, courier);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courier]);

  // Update alamat lengkap ke parent component
  useEffect(() => {
    if (onAddressChange) {
      onAddressChange({
        kota: destination,
        kecamatan,
        kelurahan: kabupaten, // Kelurahan/Kabupaten
        kode_pos: kodePos,
      });
    }
  }, [destination, kecamatan, kabupaten, kodePos, onAddressChange]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (calculateTimeoutRef.current) {
        clearTimeout(calculateTimeoutRef.current);
      }
    };
  }, []);

  const couriers = [
    { value: "jne", label: "JNE" },
    { value: "tiki", label: "TIKI" },
    { value: "pos", label: "POS Indonesia" },
  ];

  return (
    <>
        {/* Kota Tujuan - Search */}
        <div className="compact-field">
          <label className="compact-label">
            Kota Tujuan <span className="required">*</span>
          </label>
          <div className="ongkir-search-wrapper-compact">
            <input
              type="text"
              className="compact-input"
              placeholder="Cari kota tujuan..."
              value={destinationSearch}
              onChange={(e) => handleDestinationSearch(e.target.value)}
              disabled={loading || cooldownActive}
            />
            {destinationResults.length > 0 && (
              <div className="ongkir-results-compact">
                {destinationResults.map((dest, idx) => {
                  // Format display: Hanya kota dan provinsi
                  // Contoh: "Jakarta Barat, DKI Jakarta" (BUKAN detail subdistrict)
                  const cityName = dest.city_name || dest.name || '';
                  const provinceName = dest.province_name || '';
                  const label = cityName && provinceName
                    ? `${cityName}, ${provinceName}`
                    : cityName || dest.label || '';
                  const cityId = dest.city_id || dest.id || "";
                  
                  return (
                    <div
                      key={idx}
                      className="ongkir-result-item-compact"
                      onClick={() => {
                        console.log('[ONGKIR] Selected destination (CITY):', { cityId, label, dest });
                        handleSelectDestination(dest);
                      }}
                    >
                      {label || `ID: ${cityId}`}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {destination && (
            <p className="text-sm text-gray-500 mt-1">Dipilih: {destination}</p>
          )}
        </div>

        {/* Kecamatan - Input Manual (untuk alamat lengkap) */}
        <div className="compact-field">
          <label className="compact-label">Kecamatan</label>
          <input
            type="text"
            className="compact-input"
            placeholder="Masukkan kecamatan (contoh: Kalideres)"
            value={kecamatan}
            onChange={(e) => setKecamatan(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Detail alamat untuk pengiriman (tidak mempengaruhi ongkir)
          </p>
        </div>

        {/* Kelurahan/Kabupaten - Input Manual (untuk alamat lengkap) */}
        <div className="compact-field">
          <label className="compact-label">Kelurahan/Kabupaten</label>
          <input
            type="text"
            className="compact-input"
            placeholder="Masukkan kelurahan/kabupaten (contoh: Pegadungan)"
            value={kabupaten}
            onChange={(e) => setKabupaten(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Detail alamat untuk pengiriman (tidak mempengaruhi ongkir)
          </p>
        </div>

        {/* Kode Pos - Input Manual (untuk alamat lengkap) */}
        <div className="compact-field">
          <label className="compact-label">Kode Pos</label>
          <input
            type="text"
            className="compact-input"
            placeholder="Masukkan kode pos (contoh: 11830)"
            value={kodePos}
            onChange={(e) => setKodePos(e.target.value.replace(/\D/g, ''))}
            maxLength={5}
          />
          <p className="text-xs text-gray-500 mt-1">
            Detail alamat untuk pengiriman (tidak mempengaruhi ongkir)
          </p>
        </div>

        {/* Kurir */}
        <div className="compact-field">
          <label className="compact-label">
            Kurir <span className="required">*</span>
          </label>
          <select
            className="compact-input"
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            disabled={loading || cooldownActive}
            style={{ appearance: 'auto', cursor: 'pointer' }}
          >
            {couriers.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="compact-field">
            <p className="text-sm text-blue-600 mt-1">Menghitung ongkir...</p>
          </div>
        )}

        {/* Cooldown Warning */}
        {cooldownActive && !loading && (
          <div className="compact-field">
            <p className="text-sm text-red-600 mt-1">Tunggu {cooldownTime} detik sebelum cek ongkir lagi</p>
          </div>
        )}
    </>
  );
}

