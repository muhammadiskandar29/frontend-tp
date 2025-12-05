"use client";

import { useState, useEffect, useRef } from "react";
import { getCost, getDestinations } from "@/lib/komerce";
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
  // Hardcode origin CITY_ID Tangerang
  // Contoh: Jakarta Barat = 151, Bandung = 23
  // Untuk Tangerang, perlu city_id yang benar (bukan subdistrict_id 73655)
  // Sementara gunakan 151 (JAKBAR) sebagai contoh, ganti dengan city_id Tangerang yang benar
  const DEFAULT_ORIGIN_ID = "151"; // JAKARTA BARAT (contoh, ganti dengan city_id Tangerang)
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
    // Handle response dari Komerce API
    // Untuk RajaOngkir V1 Basic, gunakan CITY_ID (bukan subdistrict_id)
    const cityId = dest.city_id || dest.id || "";
    const label = dest.label || dest.name || dest.city_name || "";
    
    console.log('[ONGKIR] Selected destination:', { cityId, label, dest });
    
    setDestinationId(String(cityId)); // Simpan city_id untuk cost calculation
    setDestination(label);
    setDestinationSearch(label);
    setDestinationResults([]);
    
    // Auto-fill kecamatan, kelurahan, kode pos dari data yang dipilih (jika ada)
    // Untuk city data, mungkin tidak ada detail kecamatan/kelurahan
    if (dest.district_name) {
      setKecamatan(dest.district_name);
    }
    if (dest.subdistrict_name) {
      setKabupaten(dest.subdistrict_name);
    }
    if (dest.postal_code) {
      setKodePos(dest.postal_code);
    }
    
    // Jika tidak ada field terpisah, parse dari label (jika format lengkap)
    if (!dest.district_name && !dest.subdistrict_name && label) {
      // Parse dari format: "KOTA, PROVINSI" atau format lebih lengkap
      const parts = label.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        // Untuk city data, biasanya format: "KOTA, PROVINSI"
        // Tidak ada detail kecamatan/kelurahan di city level
      }
    }
    
    // Auto-calculate ongkir setelah destination terpilih
    // Menggunakan CITY_ID untuk RajaOngkir V1 Basic
    if (cityId && courier) {
      console.log('[ONGKIR] Auto-calculating with city_id:', cityId);
      autoCalculateOngkir(String(cityId), courier);
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
      console.warn('[ONGKIR] destId atau courier belum terisi:', { destId, selectedCourier });
      return;
    }
    
    console.log('[ONGKIR] Auto-calculating ongkir:', { origin, destId, selectedCourier });

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
                  // Format display untuk city data (RajaOngkir V1 Basic)
                  const label = dest.label || 
                    `${dest.city_name || ''}, ${dest.province_name || ''}`.trim() ||
                    dest.name || dest.city_name || '';
                  const cityId = dest.city_id || dest.id || "";
                  
                  return (
                    <div
                      key={idx}
                      className="ongkir-result-item-compact"
                      onClick={() => {
                        console.log('[ONGKIR] Selected destination:', dest);
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

        {/* Kecamatan - Input Manual */}
        <div className="compact-field">
          <label className="compact-label">Kecamatan</label>
          <input
            type="text"
            className="compact-input"
            placeholder="Masukkan kecamatan"
            value={kecamatan}
            onChange={(e) => setKecamatan(e.target.value)}
          />
        </div>

        {/* Kelurahan/Kabupaten - Input Manual */}
        <div className="compact-field">
          <label className="compact-label">Kelurahan/Kabupaten</label>
          <input
            type="text"
            className="compact-input"
            placeholder="Masukkan kelurahan/kabupaten"
            value={kabupaten}
            onChange={(e) => setKabupaten(e.target.value)}
          />
        </div>

        {/* Kode Pos - Input Manual */}
        <div className="compact-field">
          <label className="compact-label">Kode Pos</label>
          <input
            type="text"
            className="compact-input"
            placeholder="Masukkan kode pos"
            value={kodePos}
            onChange={(e) => setKodePos(e.target.value.replace(/\D/g, ''))}
            maxLength={5}
          />
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

