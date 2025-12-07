"use client";

import { useState, useEffect, useRef } from "react";
import { getProvinces, getCities, getDistricts, calculateDomesticCost } from "@/utils/shippingService";
import "@/styles/ongkir.css";

const ORIGIN_DISTRICT_ID = 73655;
const DEFAULT_WEIGHT = 1000;
const DEFAULT_COURIER = "jne:jnt:sicepat:anteraja:pos";

export default function OngkirCalculator({ 
  originId, 
  onSelectOngkir,
  onAddressChange,
  defaultCourier = "jne",
  mode = "dropdown", // "dropdown" untuk cek ongkir page
  compact = false // true untuk UI compact di landing page
}) {
  // State untuk dropdown mode
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingCost, setLoadingCost] = useState(false);
  
  const [costResults, setCostResults] = useState([]);
  const [error, setError] = useState("");

  // Load provinces on mount (untuk dropdown mode)
  useEffect(() => {
    if (mode === "dropdown") {
      loadProvinces();
    }
  }, [mode]);

  // Load cities when province selected
  useEffect(() => {
    if (mode === "dropdown" && selectedProvince) {
      loadCities(selectedProvince);
      setSelectedCity("");
      setSelectedDistrict("");
      setCities([]);
      setDistricts([]);
      setCostResults([]);
    }
  }, [selectedProvince, mode]);

  // Load districts when city selected
  useEffect(() => {
    if (mode === "dropdown" && selectedCity) {
      loadDistricts(selectedCity);
      setSelectedDistrict("");
      setDistricts([]);
      setCostResults([]);
    }
  }, [selectedCity, mode]);

  // Calculate cost when district selected
  useEffect(() => {
    if (mode === "dropdown" && selectedDistrict) {
      calculateCost();
    } else if (!selectedDistrict) {
      setCostResults([]);
    }
  }, [selectedDistrict, mode]);

  const loadProvinces = async () => {
    setLoadingProvinces(true);
    setError("");
    try {
      const data = await getProvinces();
      setProvinces(data);
    } catch (err) {
      setError("Gagal memuat daftar provinsi");
      console.error("Load provinces error:", err);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadCities = async (provinceId) => {
    setLoadingCities(true);
    setError("");
    try {
      const data = await getCities(provinceId);
      setCities(data);
    } catch (err) {
      setError("Gagal memuat daftar kota");
      console.error("Load cities error:", err);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadDistricts = async (cityId) => {
    setLoadingDistricts(true);
    setError("");
    try {
      const data = await getDistricts(cityId);
      setDistricts(data);
    } catch (err) {
      setError("Gagal memuat daftar kecamatan");
      console.error("Load districts error:", err);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const calculateCost = async () => {
    if (!selectedDistrict) {
      return;
    }

    setLoadingCost(true);
    setError("");
    setCostResults([]);

    try {
      const results = await calculateDomesticCost({
        origin: ORIGIN_DISTRICT_ID,
        destination: parseInt(selectedDistrict, 10),
        weight: DEFAULT_WEIGHT,
        courier: DEFAULT_COURIER
      });

      setCostResults(results);
      
      if (results.length === 0) {
        setError("Tidak ada data ongkir untuk rute ini");
      } else {
        // Call callback jika ada onSelectOngkir
        if (onSelectOngkir && results.length > 0) {
          // Ambil harga terendah atau pertama
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

  // Render dropdown mode
  if (mode === "dropdown") {
    return (
      <>
        {/* Form Selection */}
        <div style={{ 
          background: compact ? "transparent" : "white", 
          border: compact ? "none" : "1px solid #e5e7eb", 
          borderRadius: compact ? "0" : "12px", 
          padding: compact ? "0" : "24px",
          marginBottom: compact ? "16px" : "24px"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
            {/* Province Dropdown */}
            <div>
              <label style={{ 
                display: "block", 
                fontSize: "14px", 
                fontWeight: 600, 
                color: "#374151", 
                marginBottom: "8px" 
              }}>
                Provinsi <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                disabled={loadingProvinces}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: loadingProvinces ? "#f9fafb" : "white",
                  cursor: loadingProvinces ? "not-allowed" : "pointer"
                }}
              >
                <option value="">
                  {loadingProvinces ? "Memuat provinsi..." : "Pilih Provinsi"}
                </option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City Dropdown */}
            <div>
              <label style={{ 
                display: "block", 
                fontSize: "14px", 
                fontWeight: 600, 
                color: "#374151", 
                marginBottom: "8px" 
              }}>
                Kota <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedProvince || loadingCities || cities.length === 0}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: (!selectedProvince || loadingCities || cities.length === 0) ? "#f9fafb" : "white",
                  cursor: (!selectedProvince || loadingCities || cities.length === 0) ? "not-allowed" : "pointer"
                }}
              >
                <option value="">
                  {loadingCities ? "Memuat kota..." : !selectedProvince ? "Pilih provinsi terlebih dahulu" : "Pilih Kota"}
                </option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District Dropdown */}
            <div>
              <label style={{ 
                display: "block", 
                fontSize: "14px", 
                fontWeight: 600, 
                color: "#374151", 
                marginBottom: "8px" 
              }}>
                Kecamatan <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedCity || loadingDistricts || districts.length === 0}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: (!selectedCity || loadingDistricts || districts.length === 0) ? "#f9fafb" : "white",
                  cursor: (!selectedCity || loadingDistricts || districts.length === 0) ? "not-allowed" : "pointer"
                }}
              >
                <option value="">
                  {loadingDistricts ? "Memuat kecamatan..." : !selectedCity ? "Pilih kota terlebih dahulu" : "Pilih Kecamatan"}
                </option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info */}
          <div style={{ marginTop: "16px", padding: "12px", background: "#f3f4f6", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
              <strong>Origin:</strong> District ID {ORIGIN_DISTRICT_ID} | 
              <strong> Berat:</strong> {DEFAULT_WEIGHT} gram | 
              <strong> Kurir:</strong> JNE, JNT, SiCepat, AnterAja, POS
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
        {costResults.length === 0 && !loadingCost && selectedDistrict && (
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

  // Default: return empty untuk backward compatibility
  // (bisa ditambahkan mode "search" nanti jika diperlukan)
  return null;
}
