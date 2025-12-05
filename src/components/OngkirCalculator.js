"use client";

import { useState, useEffect, useRef } from "react";
import { searchCities, calculateCost } from "@/lib/rajaongkir-backend";
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

  // Hardcode origin city/subdistrict ID: 73655 (Kelapa Dua, Tangerang, Banten)
  // Origin sudah di-hardcode di rajaongkir-direct.js, tidak perlu di sini

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

  // Search kota tujuan - bisa mulai dari 1 huruf
  const handleDestinationSearch = async (query) => {
    setDestinationSearch(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Jika query kosong, clear results
    if (!query || query.trim().length === 0) {
      setDestinationResults([]);
      return;
    }

    // Debounce search untuk menghindari terlalu banyak request
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Fetch langsung ke RajaOngkir API (tanpa backend)
        const results = await searchCities(query);
        // Silent error handling - jika error, results akan empty array
        setDestinationResults(Array.isArray(results) ? results : []);
      } catch (error) {
        // Silent error - tidak tampilkan ke user, cukup reset dropdown
        console.warn('[ONGKIR] Search error (silent):', error.message);
        setDestinationResults([]);
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
    // Silent error - jika tidak valid, cukup return tanpa menampilkan error
    if (dest.subdistrict_id && !dest.city_id) {
      console.warn('[ONGKIR] Invalid selection: subdistrict_id without city_id (silent)');
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
  // Fetch langsung ke RajaOngkir API (tanpa backend)
  const autoCalculateOngkir = async (destId, selectedCourier) => {
    if (!destId || !selectedCourier) {
      return;
    }

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
        // Fetch langsung ke RajaOngkir API (tanpa backend)
        // Silent error handling - jika error, price akan 0
        const result = await calculateCost({
          destination: destId,
          weight: DEFAULT_WEIGHT,
          courier: selectedCourier,
        });

        // Update state hanya jika ada hasil
        if (result && result.price > 0) {
          setPrice(result.price);
          setEtd(result.etd || '');

          // Call callback untuk update grand total di parent
          if (onSelectOngkir) {
            onSelectOngkir(result.price);
          }

          // Set cooldown
          localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
          checkCooldown();
        } else {
          // Silent error - reset state tanpa menampilkan error
          setPrice(null);
          setEtd("");
        }
      } catch (error) {
        // Silent error - tidak tampilkan ke user, cukup reset state
        console.warn('[ONGKIR] Calculate error (silent):', error.message);
        setPrice(null);
        setEtd("");
      } finally {
        setLoading(false);
      }
    }, 500); // Debounce 500ms
  };

  // Auto-calculate ketika kurir berubah
  useEffect(() => {
    if (destinationId && courier) {
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

