"use client";

import { useState, useEffect } from "react";
import "@/styles/sales/customer.css";
import { toastSuccess, toastError } from "@/lib/toast";
import { getProvinces, getCities, getDistricts } from "@/utils/shippingService";

// Use Next.js proxy to avoid CORS
const BASE_URL = "/api";

export default function AddCustomerModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nama: "",
    nama_panggilan: "",
    email: "",
    wa: "",
    instagram: "",
    profesi: "",
    pendapatan_bln: "",
    industri_pekerjaan: "",
    jenis_kelamin: "l",
    tanggal_lahir: "",
  });

  // State untuk form wilayah (cascading dropdown)
  const [regionForm, setRegionForm] = useState({
    provinsi: "", // Nama provinsi (string)
    kabupaten: "", // Nama kabupaten/kota (string)
    kecamatan: "", // Nama kecamatan (string)
    kode_pos: "" // Kode pos (string)
  });
  
  // State untuk cascading dropdown (internal - untuk fetch)
  const [regionData, setRegionData] = useState({
    provinces: [],
    cities: [],
    districts: []
  });
  
  // State untuk selected IDs (internal - hanya untuk fetch, tidak disimpan)
  const [selectedRegionIds, setSelectedRegionIds] = useState({
    provinceId: "",
    cityId: "",
    districtId: ""
  });
  
  // Loading states
  const [loadingRegion, setLoadingRegion] = useState({
    provinces: false,
    cities: false,
    districts: false
  });

  const [loading, setLoading] = useState(false);

  const validatePhone = (phone) => {
    const digitsOnly = phone.replace(/\D/g, "");
    return digitsOnly.length >= 10;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // format tanggal lahir otomatis dd-mm-yyyy dengan pemisah
    if (name === "tanggal_lahir") {
      let digits = value.replace(/\D/g, ""); // hanya angka
      let formatted = "";
      
      if (digits.length > 0) {
        formatted = digits.slice(0, 2); // hari
        if (digits.length > 2) {
          formatted += "-" + digits.slice(2, 4); // bulan
        }
        if (digits.length > 4) {
          formatted += "-" + digits.slice(4, 8); // tahun (maks 4 digit)
        }
      }
      
      setFormData({ ...formData, [name]: formatted });
      return;
    }

    // format instagram otomatis ada @
    if (name === "instagram") {
      let val = value;
      if (val && !val.startsWith("@")) val = "@" + val.replace(/^@+/, "");
      setFormData({ ...formData, instagram: val });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  // ==========================================================
  // LOGIC FORM WILAYAH (CASCADING DROPDOWN)
  // ==========================================================
  
  // Load provinces
  const loadProvinces = async () => {
    setLoadingRegion(prev => ({ ...prev, provinces: true }));
    try {
      const data = await getProvinces();
      setRegionData(prev => ({ ...prev, provinces: data }));
    } catch (err) {
      console.error("Load provinces error:", err);
    } finally {
      setLoadingRegion(prev => ({ ...prev, provinces: false }));
    }
  };
  
  // Load cities
  const loadCities = async (provinceId) => {
    setLoadingRegion(prev => ({ ...prev, cities: true }));
    try {
      const data = await getCities(provinceId);
      setRegionData(prev => ({ ...prev, cities: data }));
    } catch (err) {
      console.error("Load cities error:", err);
    } finally {
      setLoadingRegion(prev => ({ ...prev, cities: false }));
    }
  };
  
  // Load districts
  const loadDistricts = async (cityId) => {
    setLoadingRegion(prev => ({ ...prev, districts: true }));
    try {
      const data = await getDistricts(cityId);
      setRegionData(prev => ({ ...prev, districts: data }));
    } catch (err) {
      console.error("Load districts error:", err);
    } finally {
      setLoadingRegion(prev => ({ ...prev, districts: false }));
    }
  };
  
  // Handler untuk update region form (HANYA NAMA)
  const handleRegionChange = (field, value) => {
    if (field === "provinsi") {
      const province = regionData.provinces.find(p => p.id === value);
      setSelectedRegionIds(prev => ({ ...prev, provinceId: value || "", cityId: "", districtId: "" }));
      setRegionForm(prev => ({ 
        ...prev, 
        provinsi: province?.name || "",
        kabupaten: "",
        kecamatan: "",
        kode_pos: ""
      }));
    } else if (field === "kabupaten") {
      const city = regionData.cities.find(c => c.id === value);
      setSelectedRegionIds(prev => ({ ...prev, cityId: value || "", districtId: "" }));
      setRegionForm(prev => ({ 
        ...prev, 
        kabupaten: city?.name || "",
        kecamatan: "",
        kode_pos: ""
      }));
    } else if (field === "kecamatan") {
      const district = regionData.districts.find(d => d.id === value || d.district_id === value);
      setSelectedRegionIds(prev => ({ ...prev, districtId: value || "" }));
      setRegionForm(prev => ({ 
        ...prev, 
        kecamatan: district?.name || "",
        // Ambil kode pos dari district jika ada, jika tidak kosongkan agar user bisa isi manual
        kode_pos: district?.postal_code || prev.kode_pos || ""
      }));
    } else if (field === "kode_pos") {
      setRegionForm(prev => ({ ...prev, kode_pos: value }));
    }
  };
  
  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Load cities when province selected
  useEffect(() => {
    if (selectedRegionIds.provinceId) {
      loadCities(selectedRegionIds.provinceId);
      // Reset child selections
      setSelectedRegionIds(prev => ({ ...prev, cityId: "", districtId: "" }));
      setRegionForm(prev => ({ ...prev, kabupaten: "", kecamatan: "", kode_pos: "" }));
      setRegionData(prev => ({ ...prev, cities: [], districts: [] }));
    } else {
      setRegionData(prev => ({ ...prev, cities: [], districts: [] }));
      setSelectedRegionIds(prev => ({ ...prev, cityId: "", districtId: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegionIds.provinceId]);
  
  // Load districts when city selected
  useEffect(() => {
    if (selectedRegionIds.cityId) {
      loadDistricts(selectedRegionIds.cityId);
      // Reset child selections
      setSelectedRegionIds(prev => ({ ...prev, districtId: "" }));
      setRegionForm(prev => ({ ...prev, kecamatan: "", kode_pos: "" }));
      setRegionData(prev => ({ ...prev, districts: [] }));
    } else {
      setRegionData(prev => ({ ...prev, districts: [] }));
      setSelectedRegionIds(prev => ({ ...prev, districtId: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegionIds.cityId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePhone(formData.wa)) {
      toastError("Nomor WA minimal 10 angka!");
      return;
    }

    // Validasi form wilayah - pastikan semua field terisi dengan trim
    const provinsi = regionForm.provinsi?.trim() || "";
    const kabupaten = regionForm.kabupaten?.trim() || "";
    const kecamatan = regionForm.kecamatan?.trim() || "";
    const kode_pos = regionForm.kode_pos?.trim() || "";

    // Validasi lengkap dengan pesan yang lebih spesifik
    if (!provinsi) {
      toastError("Pilih Provinsi terlebih dahulu!");
      return;
    }
    if (!kabupaten) {
      toastError("Pilih Kabupaten/Kota terlebih dahulu!");
      return;
    }
    if (!kecamatan) {
      toastError("Pilih Kecamatan terlebih dahulu!");
      return;
    }
    if (!kode_pos) {
      toastError("Kode Pos wajib diisi! Pilih Kecamatan untuk auto-fill atau isi manual.");
      return;
    }

    // Validasi kode pos harus angka
    if (!/^\d+$/.test(kode_pos)) {
      toastError("Kode Pos harus berupa angka!");
      return;
    }

    // Pastikan selectedRegionIds juga terisi (untuk memastikan dropdown sudah dipilih)
    if (!selectedRegionIds.provinceId || !selectedRegionIds.cityId || !selectedRegionIds.districtId) {
      toastError("Pastikan semua dropdown alamat sudah dipilih dengan benar!");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      // Prepare payload dengan format alamat baru - pastikan semua string
      const payload = {
        ...formData,
        provinsi: provinsi,
        kabupaten: kabupaten,
        kecamatan: kecamatan,
        kode_pos: kode_pos,
      };

      const res = await fetch(`${BASE_URL}/sales/customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Gagal menambahkan customer");

      toastSuccess(data.message || "Customer berhasil ditambahkan");
      setTimeout(() => {
        onSuccess(data.message || "Customer berhasil ditambahkan");
        onClose();
      }, 1000);
    } catch (err) {
      toastError("Gagal menambahkan customer: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* HEADER */}
        <div className="modal-header">
          <h2>Tambah Customer Baru</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="pi pi-times"></i>
          </button>
        </div>

        {/* BODY */}
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Nama</label>
              <input name="nama" value={formData.nama} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Nama Panggilan</label>
              <input
                name="nama_panggilan"
                value={formData.nama_panggilan}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>

            {/* Form Wilayah - Cascading Dropdown */}
            <div className="form-group">
              <label>Provinsi <span style={{ color: "#ef4444" }}>*</span></label>
              <select
                name="provinsi"
                value={selectedRegionIds.provinceId}
                onChange={(e) => handleRegionChange("provinsi", e.target.value)}
                disabled={loadingRegion.provinces}
                required
                style={{ 
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: loadingRegion.provinces ? 'not-allowed' : 'pointer',
                  backgroundColor: loadingRegion.provinces ? '#f9fafb' : 'white'
                }}
              >
                <option value="">Pilih Provinsi</option>
                {regionData.provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
              {loadingRegion.provinces && (
                <small style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  Memuat provinsi...
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Kabupaten/Kota <span style={{ color: "#ef4444" }}>*</span></label>
              <select
                name="kabupaten"
                value={selectedRegionIds.cityId}
                onChange={(e) => handleRegionChange("kabupaten", e.target.value)}
                disabled={!selectedRegionIds.provinceId || loadingRegion.cities}
                required
                style={{ 
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: (!selectedRegionIds.provinceId || loadingRegion.cities) ? 'not-allowed' : 'pointer',
                  backgroundColor: (!selectedRegionIds.provinceId || loadingRegion.cities) ? '#f9fafb' : 'white'
                }}
              >
                <option value="">Pilih Kabupaten/Kota</option>
                {regionData.cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              {loadingRegion.cities && (
                <small style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  Memuat kabupaten/kota...
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Kecamatan <span style={{ color: "#ef4444" }}>*</span></label>
              <select
                name="kecamatan"
                value={selectedRegionIds.districtId}
                onChange={(e) => handleRegionChange("kecamatan", e.target.value)}
                disabled={!selectedRegionIds.cityId || loadingRegion.districts}
                required
                style={{ 
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: (!selectedRegionIds.cityId || loadingRegion.districts) ? 'not-allowed' : 'pointer',
                  backgroundColor: (!selectedRegionIds.cityId || loadingRegion.districts) ? '#f9fafb' : 'white'
                }}
              >
                <option value="">Pilih Kecamatan</option>
                {regionData.districts.map((district) => (
                  <option key={district.id || district.district_id} value={district.id || district.district_id}>
                    {district.name}
                  </option>
                ))}
              </select>
              {loadingRegion.districts && (
                <small style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  Memuat kecamatan...
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Kode Pos <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                type="text"
                name="kode_pos"
                value={regionForm.kode_pos}
                onChange={(e) => handleRegionChange("kode_pos", e.target.value)}
                disabled={!selectedRegionIds.districtId}
                required
                placeholder="Contoh: 12120"
                style={{ 
                  cursor: !selectedRegionIds.districtId ? 'not-allowed' : 'text',
                  backgroundColor: !selectedRegionIds.districtId ? '#f9fafb' : 'white'
                }}
              />
              {!selectedRegionIds.districtId && (
                <small style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  Pilih kecamatan terlebih dahulu
                </small>
              )}
            </div>

            <div className="form-group">
              <label>WA</label>
              <input
                name="wa"
                value={formData.wa}
                onChange={handleChange}
                required
                placeholder="cth: 081234567890"
              />
            </div>

            <div className="form-group">
              <label>Instagram</label>
              <input
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="@username"
              />
            </div>

            <div className="form-group">
              <label>Profesi</label>
              <input name="profesi" value={formData.profesi} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Pendapatan per Bulan</label>
              <select name="pendapatan_bln" value={formData.pendapatan_bln} onChange={handleChange}>
                <option value="">Pilih Range Pendapatan</option>
                <option value="10-20jt">10 - 20 Juta</option>
                <option value="20-30jt">20 - 30 Juta</option>
                <option value="30-40jt">30 - 40 Juta</option>
                <option value="40-50jt">40 - 50 Juta</option>
                <option value="50-60jt">50 - 60 Juta</option>
                <option value="60-70jt">60 - 70 Juta</option>
                <option value="70-80jt">70 - 80 Juta</option>
                <option value="80-90jt">80 - 90 Juta</option>
                <option value="90-100jt">90 - 100 Juta</option>
                <option value=">100jt">&gt; 100 Juta</option>
              </select>
            </div>

            <div className="form-group">
              <label>Industri Pekerjaan</label>
              <input
                name="industri_pekerjaan"
                value={formData.industri_pekerjaan}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Jenis Kelamin</label>
              <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange}>
                <option value="l">Laki-laki</option>
                <option value="p">Perempuan</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Tanggal Lahir</label>
              <input
                name="tanggal_lahir"
                value={formData.tanggal_lahir}
                onChange={handleChange}
                placeholder="dd-mm-yyyy"
                maxLength="10"
                type="text"
              />
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn-save" onClick={handleSubmit} disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>

      </div>
    </div>
  );
}
