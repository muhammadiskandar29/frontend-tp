"use client";

import { useState, useEffect, useRef } from "react";
import { searchDestinations, calculateCost } from "@/lib/komerce-backend";
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

  // Search destination - bisa mulai dari 1 huruf
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
        // Fetch via backend API route (Komerce)
        const results = await searchDestinations(query);
        // Silent error handling - jika error, results akan empty array
        setDestinationResults(Array.isArray(results) ? results : []);
      } catch (error) {
        // Silent error - tidak tampilkan ke user, cukup reset dropdown
        setDestinationResults([]);
      }
    }, 300);
  };

  const handleSelectDestination = (dest) => {
    // Handle response dari Komerce API
    // User memilih destination (kota/subdistrict)
    // Detail kecamatan/kelurahan/kode pos diinput manual untuk alamat lengkap
    
    const destinationId = dest.destination_id || dest.id || dest.city_id || "";
    // Label: "Kota, Provinsi"
    const label = dest.label || `${dest.city_name || ''}${dest.province_name ? ', ' + dest.province_name : ''}`.trim();
    
    // Simpan destination_id untuk cost calculation
    setDestinationId(String(destinationId));
    setDestination(label);
    setDestinationSearch(label);
    setDestinationResults([]);
    
    // CATATAN: Field kecamatan, kelurahan, kode pos TIDAK diisi otomatis
    // User harus input manual untuk detail alamat lengkap
    // Field-field ini hanya untuk alamat lengkap, TIDAK digunakan untuk cost calculation
    // Cost calculation menggunakan destination_id dari Komerce
    
    // Clear field detail (user akan input manual)
    setKecamatan("");
    setKabupaten("");
    setKodePos("");
    
    // Auto-calculate ongkir setelah destination terpilih
    if (destinationId && courier) {
      autoCalculateOngkir(String(destinationId), courier);
    }
  };
  
  // Hardcode origin destination ID (alamat kantor)
  const ORIGIN_DESTINATION_ID = '73655'; // Kelapa Dua, Tangerang, Banten

  // Auto-calculate ongkir ketika destination + kurir sudah terpilih
  // Fetch via backend API route (Komerce)
  const autoCalculateOngkir = async (receiverDestId, selectedCourier) => {
    if (!receiverDestId || !selectedCourier) {
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
        // Fetch via backend API route (Komerce)
        // Silent error handling - jika error, price akan 0
        const result = await calculateCost({
          shipper_destination_id: ORIGIN_DESTINATION_ID, // Hardcode origin
          receiver_destination_id: receiverDestId,
          weight: DEFAULT_WEIGHT,
          item_value: 0,
          cod: 0
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
                  // Format display: Kota dan provinsi dari Komerce response
                  const cityName = dest.city_name || dest.name || '';
                  const provinceName = dest.province_name || dest.province || '';
                  const label = dest.label || (cityName && provinceName
                    ? `${cityName}, ${provinceName}`
                    : cityName || '');
                  const destinationId = dest.destination_id || dest.id || dest.city_id || "";
                  
                  return (
                    <div
                      key={idx}
                      className="ongkir-result-item-compact"
                      onClick={() => {
                        handleSelectDestination(dest);
                      }}
                    >
                      {label || `ID: ${destinationId}`}
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

