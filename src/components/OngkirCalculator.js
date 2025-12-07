"use client";

import { useState, useEffect, useRef } from "react";
import { searchDestinations, calculateCost } from "@/lib/shipping";
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
  const [errorMessage, setErrorMessage] = useState("");
  const [searchError, setSearchError] = useState("");
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
        setSearchError("");
        // Fetch via backend API route (Komerce)
        const results = await searchDestinations(query);
        // Error handling - jika error, results akan empty array
        if (Array.isArray(results) && results.length > 0) {
          setDestinationResults(results);
          setSearchError("");
        } else {
          setDestinationResults([]);
          // Hanya tampilkan error jika query cukup panjang (minimal 2 karakter)
          // Untuk menghindari error spam saat user baru mulai mengetik
          if (query.trim().length >= 2) {
            setSearchError("Kota tidak ditemukan. Coba dengan kata kunci lain.");
          }
        }
      } catch (error) {
        // Error handling - hanya log, tidak tampilkan ke user kecuali error serius
        console.warn('[ONGKIR] Search warning:', error.message || error);
        setDestinationResults([]);
        // Hanya tampilkan error jika query cukup panjang
        if (query.trim().length >= 2) {
          setSearchError("Gagal mencari kota. Silakan coba lagi.");
        }
      }
    }, 300);
  };

  const handleSelectDestination = (dest) => {
    // Handle response dari Komerce API
    // User memilih destination (kota/subdistrict)
    // Auto-fill kecamatan, kelurahan, kode pos dari data yang dipilih
    
    const destinationId = dest.destination_id || dest.id || dest.city_id || "";
    // Label: "Kota, Provinsi" atau label lengkap dari API
    const label = dest.label || `${dest.city_name || ''}${dest.province_name ? ', ' + dest.province_name : ''}`.trim();
    
    // Simpan destination_id untuk cost calculation
    setDestinationId(String(destinationId));
    setDestination(label);
    setDestinationSearch(label);
    setDestinationResults([]);
    
    // Auto-fill kecamatan, kelurahan, kode pos dari data yang dipilih
    // Format dari Komerce API: district_name (kecamatan), subdistrict_name (kelurahan), zip_code (kode pos)
    if (dest.district_name) {
      setKecamatan(dest.district_name);
    } else if (dest.district) {
      setKecamatan(dest.district);
    } else {
      setKecamatan("");
    }
    
    if (dest.subdistrict_name) {
      setKabupaten(dest.subdistrict_name);
    } else if (dest.subdistrict) {
      setKabupaten(dest.subdistrict);
    } else {
      setKabupaten("");
    }
    
    if (dest.zip_code) {
      setKodePos(dest.zip_code);
    } else if (dest.postal_code) {
      setKodePos(dest.postal_code);
    } else if (dest.postal) {
      setKodePos(dest.postal);
    } else {
      setKodePos("");
    }
    
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
      setErrorMessage("");

      try {
        // Fetch via backend API route (Komerce)
        const result = await calculateCost({
          shipper_destination_id: ORIGIN_DESTINATION_ID, // Hardcode origin
          receiver_destination_id: receiverDestId,
          weight: DEFAULT_WEIGHT,
          item_value: 0,
          cod: 0,
          courier: selectedCourier
        });

        // Update state hanya jika ada hasil
        if (result && result.price > 0) {
          setPrice(result.price);
          setEtd(result.etd || '');
          setErrorMessage("");

          // Call callback untuk update grand total di parent
          if (onSelectOngkir) {
            onSelectOngkir(result.price);
          }

          // Set cooldown
          localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
          checkCooldown();
        } else {
          // Error handling - tampilkan error ke user
          const errorMsg = result?.error || "Ongkir tidak tersedia untuk rute ini. Silakan coba kota lain atau kurir lain.";
          setErrorMessage(errorMsg);
          setPrice(null);
          setEtd("");
          console.error('[ONGKIR] Calculate failed:', errorMsg);
        }
      } catch (error) {
        // Error handling - tampilkan error ke user
        console.error('[ONGKIR] Calculate error:', error);
        setErrorMessage("Gagal menghitung ongkir. Silakan coba lagi.");
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
                  // Format display: Gunakan label dari API atau format manual
                  const label = dest.label || (dest.city_name && dest.province_name
                    ? `${dest.city_name}, ${dest.province_name}`
                    : dest.city_name || dest.name || '');
                  const destinationId = dest.destination_id || dest.id || dest.city_id || "";
                  
                  return (
                    <div
                      key={idx}
                      className="ongkir-result-item-compact"
                      onClick={() => {
                        handleSelectDestination(dest);
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>{label || `ID: ${destinationId}`}</div>
                      {dest.district_name && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          {dest.district_name}{dest.subdistrict_name ? `, ${dest.subdistrict_name}` : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {destination && (
            <p className="text-sm text-gray-500 mt-1">Dipilih: {destination}</p>
          )}
          {searchError && (
            <p className="text-sm text-red-600 mt-1">{searchError}</p>
          )}
        </div>

        {/* Kecamatan - Auto-fill dari pilihan kota */}
        <div className="compact-field">
          <label className="compact-label">Kecamatan</label>
          <input
            type="text"
            className="compact-input"
            placeholder="Akan terisi otomatis saat memilih kota"
            value={kecamatan}
            onChange={(e) => setKecamatan(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            {kecamatan ? 'Terisi otomatis dari pilihan kota (bisa diedit)' : 'Akan terisi otomatis saat memilih kota'}
          </p>
        </div>

        {/* Kelurahan/Kabupaten - Auto-fill dari pilihan kota */}
        <div className="compact-field">
          <label className="compact-label">Kelurahan/Kabupaten</label>
          <input
            type="text"
            className="compact-input"
            placeholder="Akan terisi otomatis saat memilih kota"
            value={kabupaten}
            onChange={(e) => setKabupaten(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            {kabupaten ? 'Terisi otomatis dari pilihan kota (bisa diedit)' : 'Akan terisi otomatis saat memilih kota'}
          </p>
        </div>

        {/* Kode Pos - Auto-fill dari pilihan kota */}
        <div className="compact-field">
          <label className="compact-label">Kode Pos</label>
          <input
            type="text"
            className="compact-input"
            placeholder="Akan terisi otomatis saat memilih kota"
            value={kodePos}
            onChange={(e) => setKodePos(e.target.value.replace(/\D/g, ''))}
            maxLength={5}
          />
          <p className="text-xs text-gray-500 mt-1">
            {kodePos ? 'Terisi otomatis dari pilihan kota (bisa diedit)' : 'Akan terisi otomatis saat memilih kota'}
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

        {/* Error Message */}
        {errorMessage && !loading && (
          <div className="compact-field">
            <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
          </div>
        )}

        {/* Success Message */}
        {price && price > 0 && !loading && (
          <div className="compact-field">
            <p className="text-sm text-green-600 mt-1">
              Ongkir: Rp {price.toLocaleString("id-ID")} {etd ? `(${etd} hari)` : ''}
            </p>
          </div>
        )}
    </>
  );
}

