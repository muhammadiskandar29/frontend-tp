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
  // Origin bisa dari prop, env variable, atau hardcode
  // Priority: prop > env > hardcode fallback
  // Hardcode origin ID Kabupaten Tangerang
  // Cari ID-nya dulu pakai endpoint: /api/komerce/find-origin?q=tangerang
  // Setelah dapat ID-nya, ganti nilai di bawah ini
  const DEFAULT_ORIGIN_ID = ""; // TODO: Ganti dengan ID Kabupaten Tangerang (contoh: "456")
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

    if (query.length < 2) {
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
        // Tampilkan error ke user jika API key tidak dikonfigurasi
        if (error.message && error.message.includes('API key tidak dikonfigurasi')) {
          toast.error("API key tidak dikonfigurasi. Silakan hubungi admin.");
        } else {
          toast.error(error.message || "Gagal mencari kota tujuan");
        }
      }
    }, 300);
  };

  const handleSelectDestination = (dest) => {
    // Handle berbagai format response dari Komerce
    const id = dest.id || dest.city_id || dest.destination_id || "";
    const name = dest.name || dest.city_name || dest.destination_name || dest.text || "";
    
    setDestinationId(String(id));
    setDestination(name);
    setDestinationSearch(name);
    setDestinationResults([]);
    
    // Auto-calculate ongkir setelah kota terpilih
    if (id && courier) {
      autoCalculateOngkir(String(id), courier);
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
                  const id = dest.id || dest.city_id || dest.destination_id || "";
                  const name = dest.name || dest.city_name || dest.destination_name || dest.text || "";
                  const province = dest.province || dest.province_name || "";
                  return (
                    <div
                      key={idx}
                      className="ongkir-result-item-compact"
                      onClick={() => {
                        console.log('[ONGKIR] Selected destination:', dest);
                        handleSelectDestination(dest);
                      }}
                    >
                      {name} {province ? `(${province})` : ''}
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

