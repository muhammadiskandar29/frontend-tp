"use client";

import { useState, useEffect, useRef } from "react";
import { searchDestinations, calculateDomesticCost } from "@/utils/shippingService";
import "@/styles/ongkir.css";

const ORIGIN_DISTRICT_ID = 6204; // Kelapa Dua, Kabupaten Tangerang
const DEFAULT_WEIGHT = 1000;

export default function OngkirCalculator({ 
  originId, 
  onSelectOngkir,
  onAddressChange,
  defaultCourier = "jne",
  mode = "dropdown",
  compact = false
}) {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState(defaultCourier || "jne");
  const [weight, setWeight] = useState(DEFAULT_WEIGHT);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingCost, setLoadingCost] = useState(false);
  const [costResults, setCostResults] = useState([]);
  const [error, setError] = useState("");
  const searchTimeoutRef = useRef(null);

  // Courier options - 12 opsi sesuai ketentuan
  const couriers = [
    { value: "jne", label: "JNE" },
    { value: "sicepat", label: "SiCepat" },
    { value: "jnt", label: "JNT" },
    { value: "ninja", label: "Ninja Express" },
    { value: "anteraja", label: "AnterAja" },
    { value: "tiki", label: "TIKI" },
    { value: "pos", label: "POS Indonesia" },
    { value: "lion", label: "Lion Parcel" },
    { value: "wahana", label: "Wahana" },
    { value: "ide", label: "IDE" },
    { value: "sap", label: "SAP Express" },
    { value: "ncs", label: "NCS" },
  ];

  // Auto calculate when destination, courier, or weight changes
  useEffect(() => {
    if (selectedDestination && selectedDestination.district_id && selectedCourier && weight > 0) {
      calculateCost(selectedDestination.district_id, selectedCourier, weight);
    } else {
      setCostResults([]);
    }
  }, [selectedDestination, selectedCourier, weight]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Clear results if query is empty
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setSelectedDestination(null);
      return;
    }

    // Debounce search (300ms)
    searchTimeoutRef.current = setTimeout(async () => {
      setLoadingSearch(true);
      setError("");
      
      try {
        const results = await searchDestinations(query.trim());
        
        if (Array.isArray(results) && results.length > 0) {
          setSearchResults(results);
          setError("");
        } else {
          setSearchResults([]);
          // Jangan tampilkan error saat masih mengetik
        }
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
        // Jangan tampilkan error saat masih mengetik
      } finally {
        setLoadingSearch(false);
      }
    }, 300);
  };

  const handleSelectDestination = (dest) => {
    setSelectedDestination(dest);
    // Format: district.name, city.name, province.name
    const displayText = `${dest.district_name || ''}, ${dest.city_name || ''}, ${dest.province_name || ''}`.trim().replace(/^,\s*|,\s*$/g, '');
    setSearchQuery(displayText);
    setSearchResults([]);
    
    // Update address if callback exists
    if (onAddressChange) {
      onAddressChange({
        kota: dest.city_name || '',
        kecamatan: dest.district_name || '',
        kelurahan: dest.subdistrict_name || '',
        kode_pos: dest.zip_code || dest.postal_code || '',
      });
    }
  };

  const calculateCost = async (districtId, courier, weightInGrams) => {
    if (!districtId || !courier || !weightInGrams || weightInGrams <= 0) {
      return;
    }

    setLoadingCost(true);
    setError("");
    setCostResults([]);

    try {
      const results = await calculateDomesticCost({
        origin: ORIGIN_DISTRICT_ID,
        destination: parseInt(districtId, 10), // Pastikan numeric
        weight: parseInt(weightInGrams, 10),
        courier: courier.toLowerCase() // Single courier string, lowercase
      });

      setCostResults(results);
      
      if (results.length === 0) {
        setError("Tidak ada data ongkir untuk rute ini");
      } else {
        // Call callback jika ada onSelectOngkir
        if (onSelectOngkir && results.length > 0) {
          // Ambil harga terendah
          const lowestCost = Math.min(...results.map(r => r.cost || 0));
          onSelectOngkir(lowestCost);
        }
      }
    } catch (err) {
      setError("Gagal menghitung ongkir");
      console.error("Calculate cost error:", err);
    } finally {
      setLoadingCost(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(price);
  };

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Search Field */}
      <div style={{ 
        background: compact ? "transparent" : "white", 
        border: compact ? "none" : "1px solid #e5e7eb", 
        borderRadius: compact ? "0" : "12px", 
        padding: compact ? "0" : "24px",
        marginBottom: compact ? "16px" : "24px"
      }}>
        <div className="compact-field">
          <label className="compact-label">
            Cari Kecamatan <span className="required">*</span>
          </label>
          <div className="ongkir-search-wrapper-compact">
            <input
              type="text"
              className="compact-input"
              placeholder="Contoh: Kelapa Dua, Curug, dll..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={loadingCost}
            />
            {searchResults.length > 0 && (
              <div className="ongkir-results-compact">
                {searchResults.map((dest, idx) => {
                  // Format: district.name, city.name, province.name
                  const displayText = `${dest.district_name || ''}, ${dest.city_name || ''}, ${dest.province_name || ''}`.trim().replace(/^,\s*|,\s*$/g, '');
                  
                  return (
                    <div
                      key={idx}
                      className="ongkir-result-item-compact"
                      onClick={() => handleSelectDestination(dest)}
                    >
                      <div style={{ fontWeight: 500 }}>
                        {displayText || `ID: ${dest.district_id || dest.id}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {selectedDestination && (
            <p className="text-sm text-gray-500 mt-1">
              Dipilih: {`${selectedDestination.district_name || ''}, ${selectedDestination.city_name || ''}, ${selectedDestination.province_name || ''}`.trim().replace(/^,\s*|,\s*$/g, '')}
            </p>
          )}
          {loadingSearch && (
            <p className="text-sm text-blue-600 mt-1">Mencari kecamatan...</p>
          )}
        </div>

        {/* Weight Input */}
        <div className="compact-field" style={{ marginTop: "16px" }}>
          <label className="compact-label">
            Berat (gram) <span className="required">*</span>
          </label>
          <input
            type="number"
            className="compact-input"
            placeholder="1000"
            value={weight}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 0;
              setWeight(val > 0 ? val : DEFAULT_WEIGHT);
            }}
            min="1"
            disabled={loadingCost}
          />
        </div>

        {/* Courier Dropdown */}
        <div className="compact-field" style={{ marginTop: "16px" }}>
          <label className="compact-label">
            Kurir <span className="required">*</span>
          </label>
          <select
            className="compact-input"
            value={selectedCourier}
            onChange={(e) => setSelectedCourier(e.target.value)}
            disabled={loadingCost || !selectedDestination}
            style={{ 
              appearance: 'auto', 
              cursor: (loadingCost || !selectedDestination) ? 'not-allowed' : 'pointer',
              backgroundColor: (loadingCost || !selectedDestination) ? '#f9fafb' : 'white'
            }}
          >
            {couriers.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Info */}
        <div style={{ marginTop: "16px", padding: "12px", background: "#f3f4f6", borderRadius: "8px" }}>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
            <strong>Origin:</strong> District ID {ORIGIN_DISTRICT_ID} (Kelapa Dua)
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: "12px 16px",
          background: "#fee2e2",
          border: "1px solid #fca5a5",
          borderRadius: "8px",
          marginBottom: "24px"
        }}>
          <p style={{ fontSize: "14px", color: "#991b1b", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Loading Cost */}
      {loadingCost && (
        <div style={{
          padding: "24px",
          textAlign: "center",
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          marginBottom: "24px"
        }}>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>Menghitung ongkir...</p>
        </div>
      )}

      {/* Cost Results Table */}
      {costResults.length > 0 && !loadingCost && (
        <div style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "hidden"
        }}>
          <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", margin: 0 }}>
              Hasil Ongkir
            </h2>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #e5e7eb"
                  }}>
                    Kurir
                  </th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #e5e7eb"
                  }}>
                    Layanan
                  </th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #e5e7eb"
                  }}>
                    Deskripsi
                  </th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #e5e7eb"
                  }}>
                    Estimasi
                  </th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #e5e7eb"
                  }}>
                    Ongkir
                  </th>
                </tr>
              </thead>
              <tbody>
                {costResults.map((item, index) => (
                  <tr 
                    key={index}
                    style={{
                      borderBottom: index < costResults.length - 1 ? "1px solid #f3f4f6" : "none"
                    }}
                  >
                    <td style={{
                      padding: "12px 16px",
                      fontSize: "14px",
                      color: "#111827",
                      fontWeight: 500
                    }}>
                      {item.courier?.toUpperCase() || "-"}
                    </td>
                    <td style={{
                      padding: "12px 16px",
                      fontSize: "14px",
                      color: "#374151"
                    }}>
                      {item.service || "-"}
                    </td>
                    <td style={{
                      padding: "12px 16px",
                      fontSize: "14px",
                      color: "#6b7280"
                    }}>
                      {item.description || "-"}
                    </td>
                    <td style={{
                      padding: "12px 16px",
                      fontSize: "14px",
                      color: "#374151"
                    }}>
                      {item.etd ? `${item.etd}` : "-"}
                    </td>
                    <td style={{
                      padding: "12px 16px",
                      fontSize: "14px",
                      color: "#111827",
                      fontWeight: 600,
                      textAlign: "right"
                    }}>
                      {formatPrice(item.cost || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {costResults.length === 0 && !loadingCost && selectedDestination && (
        <div style={{
          padding: "24px",
          textAlign: "center",
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px"
        }}>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            Tidak ada data ongkir untuk rute ini
          </p>
        </div>
      )}
    </>
  );
}
