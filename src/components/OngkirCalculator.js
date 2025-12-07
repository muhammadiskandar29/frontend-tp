"use client";

import { useState, useEffect, useRef } from "react";
import { searchDestinations, calculateDomesticCost } from "@/utils/shippingService";
import "@/styles/ongkir.css";

const ORIGIN_DISTRICT_ID = 6204; // Kelapa Dua, Kabupaten Tangerang
const DEFAULT_WEIGHT = 1000;
const DEFAULT_COURIER = "jne:jnt:sicepat:anteraja:pos";

export default function OngkirCalculator({ 
  originId, 
  onSelectOngkir,
  onAddressChange,
  defaultCourier = "jne",
  mode = "dropdown",
  compact = false
}) {
  // State untuk search mode (SOLUSI A)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState("all");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingCost, setLoadingCost] = useState(false);
  const [costResults, setCostResults] = useState([]);
  const [error, setError] = useState("");
  const searchTimeoutRef = useRef(null);

  // Courier options
  const couriers = [
    { value: "jne", label: "JNE" },
    { value: "jnt", label: "JNT" },
    { value: "sicepat", label: "SiCepat" },
    { value: "anteraja", label: "AnterAja" },
    { value: "pos", label: "POS Indonesia" },
  ];

  // Auto calculate when destination or courier selected
  useEffect(() => {
    if (selectedDestination && selectedDestination.id && selectedCourier) {
      calculateCost(selectedDestination.id, selectedCourier);
    } else {
      setCostResults([]);
    }
  }, [selectedDestination, selectedCourier]);

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

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      setLoadingSearch(true);
      setError("");
      
      try {
        const results = await searchDestinations(query.trim());
        
        if (Array.isArray(results) && results.length > 0) {
          setSearchResults(results);
          setError(""); // Clear error jika ada hasil
        } else {
          setSearchResults([]);
          // Jangan tampilkan error saat masih mengetik, biarkan user ketik sampai selesai
          // Error hanya muncul jika user sudah selesai mengetik dan tidak ada hasil
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
    setSearchQuery(dest.label || `${dest.district_name || dest.city_name || ''}, ${dest.province_name || ''}`.trim());
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

  const calculateCost = async (destinationId, courier = selectedCourier) => {
    if (!destinationId || !courier) {
      return;
    }

    setLoadingCost(true);
    setError("");
    setCostResults([]);

    try {
      // Build courier string dari dropdown selection
      // Jika "all" pakai semua kurir, jika single pakai kurir itu saja
      const courierString = courier === "all" 
        ? DEFAULT_COURIER 
        : courier;

      const results = await calculateDomesticCost({
        origin: ORIGIN_DISTRICT_ID,
        destination: parseInt(destinationId, 10),
        weight: DEFAULT_WEIGHT,
        courier: courierString
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
      {/* Search Field - SOLUSI A */}
      <div style={{ 
        background: compact ? "transparent" : "white", 
        border: compact ? "none" : "1px solid #e5e7eb", 
        borderRadius: compact ? "0" : "12px", 
        padding: compact ? "0" : "24px",
        marginBottom: compact ? "16px" : "24px"
      }}>
        <div className="compact-field">
          <label className="compact-label">
            Cari Kecamatan / Kelurahan / Nama Tempat <span className="required">*</span>
          </label>
          <div className="ongkir-search-wrapper-compact">
            <input
              type="text"
              className="compact-input"
              placeholder="Contoh: Kelapa Dua, Jakarta Pusat, dll..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={loadingCost}
            />
            {searchResults.length > 0 && (
              <div className="ongkir-results-compact">
                {searchResults.map((dest, idx) => {
                  const label = dest.label || `${dest.district_name || dest.city_name || ''}, ${dest.city_name || ''}, ${dest.province_name || ''}`.trim();
                  
                  return (
                    <div
                      key={idx}
                      className="ongkir-result-item-compact"
                      onClick={() => handleSelectDestination(dest)}
                    >
                      <div style={{ fontWeight: 500 }}>{label || `ID: ${dest.id}`}</div>
                      {dest.district_name && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          {dest.district_name}{dest.subdistrict_name ? `, ${dest.subdistrict_name}` : ''}
                          {dest.zip_code ? ` - ${dest.zip_code}` : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {selectedDestination && (
            <p className="text-sm text-gray-500 mt-1">
              Dipilih: {selectedDestination.label || `${selectedDestination.district_name || selectedDestination.city_name || ''}, ${selectedDestination.province_name || ''}`.trim()}
            </p>
          )}
          {loadingSearch && (
            <p className="text-sm text-blue-600 mt-1">Mencari lokasi...</p>
          )}
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
            <option value="all">Semua Kurir (JNE, JNT, SiCepat, AnterAja, POS)</option>
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
            <strong>Origin:</strong> District ID {ORIGIN_DISTRICT_ID} | 
            <strong> Berat:</strong> {DEFAULT_WEIGHT} gram
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
                        {item.etd ? `${item.etd} hari` : "-"}
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
