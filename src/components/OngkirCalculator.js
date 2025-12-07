"use client";

import { useState, useEffect, useRef } from "react";
import { getProvinces, getCities, getDistricts, calculateDomesticCost } from "@/utils/shippingService";
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
  // State untuk cascading dropdown
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCourier, setSelectedCourier] = useState(defaultCourier || "jne");
  const [weight, setWeight] = useState(DEFAULT_WEIGHT);
  
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingCost, setLoadingCost] = useState(false);
  
  const [costResults, setCostResults] = useState([]);
  const [error, setError] = useState("");

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

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Load cities when province selected
  useEffect(() => {
    if (selectedProvince) {
      loadCities(selectedProvince);
      // Reset city and district
      setSelectedCity("");
      setSelectedDistrict("");
      setCities([]);
      setDistricts([]);
    } else {
      setCities([]);
      setDistricts([]);
      setSelectedCity("");
      setSelectedDistrict("");
    }
  }, [selectedProvince]);

  // Load districts when city selected
  useEffect(() => {
    if (selectedCity) {
      loadDistricts(selectedCity);
      // Reset district
      setSelectedDistrict("");
      setDistricts([]);
    } else {
      setDistricts([]);
      setSelectedDistrict("");
    }
  }, [selectedCity]);

  // Auto calculate when district, courier, or weight changes
  useEffect(() => {
    if (selectedDistrict && selectedCourier && weight > 0) {
      calculateCost(selectedDistrict, selectedCourier, weight);
    } else {
      setCostResults([]);
    }
  }, [selectedDistrict, selectedCourier, weight]);

  const loadProvinces = async () => {
    setLoadingProvinces(true);
    setError("");
    try {
      const data = await getProvinces();
      setProvinces(data);
    } catch (err) {
      console.error("Load provinces error:", err);
      setError("Gagal memuat daftar provinsi");
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
      console.error("Load cities error:", err);
      setError("Gagal memuat daftar kota");
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
      console.error("Load districts error:", err);
      setError("Gagal memuat daftar kecamatan");
    } finally {
      setLoadingDistricts(false);
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

  // Get selected names for display
  const selectedProvinceName = provinces.find(p => p.id === selectedProvince)?.name || '';
  const selectedCityName = cities.find(c => c.id === selectedCity)?.name || '';
  const selectedDistrictName = districts.find(d => d.id === selectedDistrict || d.district_id === selectedDistrict)?.name || '';

  return (
    <>
      {/* Cascading Dropdown Form */}
      <div style={{ 
        background: compact ? "transparent" : "white", 
        border: compact ? "none" : "1px solid #e5e7eb", 
        borderRadius: compact ? "0" : "12px", 
        padding: compact ? "0" : "24px",
        marginBottom: compact ? "16px" : "24px"
      }}>
        {/* Province Dropdown */}
        <div className="compact-field">
          <label className="compact-label">
            Provinsi <span className="required">*</span>
          </label>
          <select
            className="compact-input"
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            disabled={loadingProvinces || loadingCost}
            style={{ 
              appearance: 'auto', 
              cursor: (loadingProvinces || loadingCost) ? 'not-allowed' : 'pointer',
              backgroundColor: (loadingProvinces || loadingCost) ? '#f9fafb' : 'white'
            }}
          >
            <option value="">Pilih Provinsi</option>
            {provinces.map((province) => (
              <option key={province.id} value={province.id}>
                {province.name}
              </option>
            ))}
          </select>
          {loadingProvinces && (
            <p className="text-sm text-blue-600 mt-1">Memuat provinsi...</p>
          )}
        </div>

        {/* City Dropdown */}
        <div className="compact-field" style={{ marginTop: "16px" }}>
          <label className="compact-label">
            Kota/Kabupaten <span className="required">*</span>
          </label>
          <select
            className="compact-input"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            disabled={!selectedProvince || loadingCities || loadingCost}
            style={{ 
              appearance: 'auto', 
              cursor: (!selectedProvince || loadingCities || loadingCost) ? 'not-allowed' : 'pointer',
              backgroundColor: (!selectedProvince || loadingCities || loadingCost) ? '#f9fafb' : 'white'
            }}
          >
            <option value="">Pilih Kota/Kabupaten</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          {loadingCities && (
            <p className="text-sm text-blue-600 mt-1">Memuat kota...</p>
          )}
        </div>

        {/* District Dropdown */}
        <div className="compact-field" style={{ marginTop: "16px" }}>
          <label className="compact-label">
            Kecamatan <span className="required">*</span>
          </label>
          <select
            className="compact-input"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={!selectedCity || loadingDistricts || loadingCost}
            style={{ 
              appearance: 'auto', 
              cursor: (!selectedCity || loadingDistricts || loadingCost) ? 'not-allowed' : 'pointer',
              backgroundColor: (!selectedCity || loadingDistricts || loadingCost) ? '#f9fafb' : 'white'
            }}
          >
            <option value="">Pilih Kecamatan</option>
            {districts.map((district) => (
              <option key={district.id || district.district_id} value={district.id || district.district_id}>
                {district.name}
              </option>
            ))}
          </select>
          {loadingDistricts && (
            <p className="text-sm text-blue-600 mt-1">Memuat kecamatan...</p>
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
            disabled={loadingCost || !selectedDistrict}
            style={{ 
              appearance: 'auto', 
              cursor: (loadingCost || !selectedDistrict) ? 'not-allowed' : 'pointer',
              backgroundColor: (loadingCost || !selectedDistrict) ? '#f9fafb' : 'white'
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
          {selectedDistrict && (
            <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" }}>
              <strong>Destination:</strong> {selectedDistrictName}, {selectedCityName}, {selectedProvinceName}
            </p>
          )}
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
