"use client";

import { useState, useEffect, useRef } from "react";
import { getCost, getDestinations } from "@/lib/komerce";
import { toast } from "react-hot-toast";
import "@/styles/ongkir.css";

const COOLDOWN_DURATION = 20 * 1000; // 20 detik dalam milliseconds
const COOLDOWN_KEY = "ongkir_last_call";

export default function OngkirCalculator({ 
  originId, 
  onSelectOngkir,
  defaultWeight = 1000,
  defaultCourier = "jne"
}) {
  const [destination, setDestination] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [destinationSearch, setDestinationSearch] = useState("");
  const [destinationResults, setDestinationResults] = useState([]);
  const [weight, setWeight] = useState(defaultWeight);
  const [courier, setCourier] = useState(defaultCourier);
  const [price, setPrice] = useState(null);
  const [etd, setEtd] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const searchTimeoutRef = useRef(null);
  const cooldownIntervalRef = useRef(null);

  // Get origin dari env atau prop
  const origin = originId || process.env.NEXT_PUBLIC_RAJAONGKIR_ORIGIN || "";

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
        const results = await getDestinations(query);
        setDestinationResults(results || []);
      } catch (error) {
        console.error("Error searching destination:", error);
        setDestinationResults([]);
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
  };

  const handleCalculate = async () => {
    if (!origin) {
      toast.error("Origin tidak dikonfigurasi");
      return;
    }

    if (!destinationId) {
      toast.error("Silakan pilih destinasi");
      return;
    }

    if (!weight || weight < 1 || weight > 50000) {
      toast.error("Berat harus antara 1 dan 50000 gram");
      return;
    }

    if (cooldownActive) {
      toast.error(`Tunggu ${cooldownTime} detik sebelum cek ongkir lagi`);
      return;
    }

    setLoading(true);
    setPrice(null);
    setEtd("");

    try {
      const result = await getCost({
        origin,
        destination: destinationId,
        weight,
        courier,
      });

      setPrice(result.price);
      setEtd(result.etd);

      // Call callback
      if (onSelectOngkir) {
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
  };

  const couriers = [
    { value: "jne", label: "JNE" },
    { value: "tiki", label: "TIKI" },
    { value: "pos", label: "POS Indonesia" },
  ];

  return (
    <div className="ongkir-calculator">
      <h3 className="ongkir-title">Cek Ongkir</h3>
      
      <div className="ongkir-form">
        {/* Destination Search */}
        <div className="ongkir-field">
          <label className="ongkir-label">
            Kota Tujuan <span className="required">*</span>
          </label>
          <div className="ongkir-search-wrapper">
            <input
              type="text"
              className="ongkir-input"
              placeholder="Cari kota tujuan..."
              value={destinationSearch}
              onChange={(e) => handleDestinationSearch(e.target.value)}
              disabled={loading || cooldownActive}
            />
            {destinationResults.length > 0 && (
              <div className="ongkir-results">
                {destinationResults.map((dest, idx) => {
                  const id = dest.id || dest.city_id || dest.destination_id || "";
                  const name = dest.name || dest.city_name || dest.destination_name || dest.text || "";
                  return (
                    <div
                      key={idx}
                      className="ongkir-result-item"
                      onClick={() => handleSelectDestination(dest)}
                    >
                      {name} {id ? `(ID: ${id})` : ""}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {destination && (
            <p className="ongkir-selected">Dipilih: {destination}</p>
          )}
        </div>

        {/* Weight */}
        <div className="ongkir-field">
          <label className="ongkir-label">
            Berat (gram) <span className="required">*</span>
          </label>
          <input
            type="number"
            className="ongkir-input"
            min="1"
            max="50000"
            value={weight}
            onChange={(e) => setWeight(parseInt(e.target.value, 10) || 1)}
            disabled={loading || cooldownActive}
            placeholder="Contoh: 1000"
          />
          <p className="ongkir-hint">Minimal 1 gram, maksimal 50000 gram</p>
        </div>

        {/* Courier */}
        <div className="ongkir-field">
          <label className="ongkir-label">
            Kurir <span className="required">*</span>
          </label>
          <select
            className="ongkir-select"
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            disabled={loading || cooldownActive}
          >
            {couriers.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Calculate Button */}
        <button
          type="button"
          className="ongkir-button"
          onClick={handleCalculate}
          disabled={loading || cooldownActive || !destinationId}
        >
          {loading
            ? "Menghitung..."
            : cooldownActive
            ? `Tunggu ${cooldownTime}s`
            : "Hitung Ongkir"}
        </button>

        {/* Result */}
        {price !== null && (
          <div className="ongkir-result">
            <div className="ongkir-result-price">
              <span className="ongkir-result-label">Ongkir:</span>
              <span className="ongkir-result-value">
                Rp {price.toLocaleString("id-ID")}
              </span>
            </div>
            {etd && (
              <div className="ongkir-result-etd">
                <span className="ongkir-result-label">Estimasi:</span>
                <span className="ongkir-result-value">{etd}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

