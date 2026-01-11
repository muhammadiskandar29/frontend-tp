"use client";

import { useState, useEffect } from "react";
import { getProvinces, getCities, getDistricts } from "@/utils/shippingService";
// Update customer menggunakan endpoint /api/customer/customer
async function updateCustomer(payload) {
  const token = localStorage.getItem("customer_token");

  if (!token) {
    throw new Error("Token tidak ditemukan. Silakan login kembali.");
  }

  try {
    const response = await fetch("/api/customer/customer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data?.success !== true) {
      throw new Error(data?.message || "Gagal mengupdate customer");
    }

    return data;
  } catch (error) {
    console.error("❌ [UPDATE_CUSTOMER] Error:", error);
    throw error;
  }
}
import { getCustomerSession } from "@/lib/customerAuth";

// Function to normalize region name for matching (case-insensitive, remove extra spaces)
const normalizeRegionName = (name) => {
  if (!name || typeof name !== 'string') return "";
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
};

// Function to parse alamat string into separate fields
const parseAlamat = (alamatString) => {
  if (!alamatString || typeof alamatString !== 'string') {
    return { provinsi: "", kabupaten: "", kecamatan: "", kode_pos: "" };
  }

  // Pattern: "PROVINSI, KABUPATEN, kec. KECAMATAN, kode pos KODE_POS"
  // atau variasi lainnya
  let provinsi = "";
  let kabupaten = "";
  let kecamatan = "";
  let kode_pos = "";

  // Extract kode pos (format: "kode pos 231" atau "kode pos: 231")
  const kodePosMatch = alamatString.match(/kode\s*pos[:\s]+(\d+)/i);
  if (kodePosMatch) {
    kode_pos = kodePosMatch[1];
  }

  // Extract kecamatan (format: "kec. ASAKOTA" atau "kecamatan ASAKOTA")
  // Hapus "kec." atau "kecamatan" dari hasil
  const kecamatanMatch = alamatString.match(/kec\.?\s*([^,]+)/i);
  if (kecamatanMatch) {
    kecamatan = kecamatanMatch[1].trim();
    // Hapus "kecamatan" jika masih ada di hasil
    kecamatan = kecamatan.replace(/^kecamatan\s+/i, '').trim();
  }

  // Split by comma untuk mendapatkan provinsi dan kabupaten
  const parts = alamatString.split(',').map(p => p.trim());
  
  if (parts.length >= 1) {
    // Bagian pertama biasanya provinsi (bisa ada (NTB) di dalamnya)
    provinsi = parts[0].replace(/\s*\([^)]+\)\s*/, '').trim(); // Hapus (NTB)
  }
  
  if (parts.length >= 2) {
    // Bagian kedua biasanya kabupaten (tapi bisa juga kecamatan jika format berbeda)
    const part2 = parts[1].trim();
    // Jika part2 tidak mengandung "kec." dan kecamatan belum terisi, maka ini kabupaten
    if (!part2.match(/kec\.?/i) && !kecamatan) {
      kabupaten = part2;
    }
  }

  return { provinsi, kabupaten, kecamatan, kode_pos };
};

// Function to check if value is an email (invalid for industri_pekerjaan)
const isValidIndustriPekerjaan = (value) => {
  if (!value || typeof value !== 'string') return false;
  // Check if it's an email pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return !emailPattern.test(value.trim());
};

// Function to fetch customer data from API
async function fetchCustomerData() {
  const token = localStorage.getItem("customer_token");

  if (!token) {
    throw new Error("Token tidak ditemukan. Silakan login kembali.");
  }

  try {
    const response = await fetch("/api/customer/customer", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok || data?.success !== true) {
      throw new Error(data?.message || "Gagal mengambil data customer");
    }

    return data.data;
  } catch (error) {
    console.error("❌ [FETCH_CUSTOMER] Error:", error);
    throw error;
  }
}

const initialFormState = {
  nama_panggilan: "",
  instagram: "",
  profesi: "",
  pendapatan_bln: "",
  industri_pekerjaan: "",
  jenis_kelamin: "l",
  tanggal_lahir: "",
  password: "",
};

const SECTION_CONFIG = [
  {
    title: "Informasi Dasar",
    fields: [
      {
        name: "nama_panggilan",
        label: "Nama Panggilan",
        placeholder: "Masukkan nama panggilan",
        required: true,
      },
      {
        name: "instagram",
        label: "Instagram",
        placeholder: "@username",
      },
    ],
  },
  {
    title: "Profesi & Pekerjaan",
    fields: [
      {
        name: "profesi",
        label: "Profesi",
        placeholder: "Contoh: Programmer, Wiraswasta, dll",
        required: true,
      },
      {
        name: "pendapatan_bln",
        label: "Pendapatan per Bulan",
        type: "select",
        placeholder: "Pilih Range Pendapatan",
        options: [
          { value: "", label: "Pilih Range Pendapatan" },
          { value: "10-20jt", label: "10 - 20 Juta" },
          { value: "20-30jt", label: "20 - 30 Juta" },
          { value: "30-40jt", label: "30 - 40 Juta" },
          { value: "40-50jt", label: "40 - 50 Juta" },
          { value: "50-60jt", label: "50 - 60 Juta" },
          { value: "60-70jt", label: "60 - 70 Juta" },
          { value: "70-80jt", label: "70 - 80 Juta" },
          { value: "80-90jt", label: "80 - 90 Juta" },
          { value: "90-100jt", label: "90 - 100 Juta" },
          { value: ">100jt", label: "> 100 Juta" },
        ],
      },
      {
        name: "industri_pekerjaan",
        label: "Industri Pekerjaan",
        placeholder: "Contoh: Teknologi, Properti, dll",
        fullWidth: true,
      },
    ],
  },
  {
    title: "Data Pribadi",
    fields: [
      {
        name: "jenis_kelamin",
        label: "Jenis Kelamin",
        type: "select",
        options: [
          { value: "l", label: "Laki-laki" },
          { value: "p", label: "Perempuan" },
        ],
      },
      {
        name: "tanggal_lahir",
        label: "Tanggal Lahir",
        type: "date",
      },
    ],
  },
  {
    title: "Alamat",
    fields: [
      {
        name: "provinsi",
        label: "Provinsi",
        type: "region_select",
        fieldType: "provinsi",
        required: true,
        fullWidth: true,
      },
      {
        name: "kabupaten",
        label: "Kabupaten/Kota",
        type: "region_select",
        fieldType: "kabupaten",
        required: true,
        fullWidth: true,
      },
      {
        name: "kecamatan",
        label: "Kecamatan",
        type: "region_select",
        fieldType: "kecamatan",
        required: true,
        fullWidth: true,
      },
      {
        name: "kode_pos",
        label: "Kode Pos",
        type: "region_input",
        fieldType: "kode_pos",
        required: true,
        placeholder: "Contoh: 12120",
      },
    ],
  },
  {
    title: "Keamanan",
    isPasswordSection: true,
    fields: [
      {
        name: "password",
        label: "Password Baru",
        type: "password",
        placeholder: "Masukkan password baru (min. 6 karakter)",
        note: "Isi jika ingin mengganti password",
        required: false,
        fullWidth: true,
      },
    ],
  },
];

export default function UpdateCustomerModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Lengkapi Data Customer",
  requirePassword = true, // Password wajib diisi untuk user dengan password default
  allowClose = true, // Apakah modal bisa ditutup (default true)
}) {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(false);

  // State untuk form wilayah (cascading dropdown)
  const [regionForm, setRegionForm] = useState({
    provinsi: "",
    kabupaten: "",
    kecamatan: "",
    kode_pos: ""
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
    if (!provinceId) return;
    
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
    if (!cityId) return;
    
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
      // Konversi value ke string untuk matching yang lebih robust
      const provinceId = String(value || "");
      // Cari province dengan konversi tipe data (handle string/number)
      const province = regionData.provinces.find(p => 
        String(p.id) === provinceId || p.id === value || p.id === Number(value)
      );
      setSelectedRegionIds(prev => ({ ...prev, provinceId: value || "", cityId: "", districtId: "" }));
      setRegionForm(prev => ({ 
        ...prev, 
        provinsi: province?.name || "",
        kabupaten: "",
        kecamatan: "",
        kode_pos: ""
      }));
    } else if (field === "kabupaten") {
      // Konversi value ke string untuk matching yang lebih robust
      const cityId = String(value || "");
      // Cari city dengan konversi tipe data (handle string/number)
      const city = regionData.cities.find(c => 
        String(c.id) === cityId || c.id === value || c.id === Number(value)
      );
      setSelectedRegionIds(prev => ({ ...prev, cityId: value || "", districtId: "" }));
      setRegionForm(prev => ({ 
        ...prev, 
        kabupaten: city?.name || "",
        kecamatan: "",
        kode_pos: ""
      }));
    } else if (field === "kecamatan") {
      // Konversi value ke string untuk matching yang lebih robust
      const districtId = String(value || "");
      // Cari district dengan konversi tipe data (handle string/number dan id/district_id)
      const district = regionData.districts.find(d => 
        String(d.id) === districtId || 
        String(d.district_id) === districtId ||
        d.id === value || 
        d.district_id === value ||
        d.id === Number(value) ||
        d.district_id === Number(value)
      );
      setSelectedRegionIds(prev => ({ ...prev, districtId: value || "" }));
      setRegionForm(prev => ({ 
        ...prev, 
        kecamatan: district?.name || "",
        // Ambil kode pos dari district jika ada, jika tidak pertahankan yang sudah ada atau kosongkan
        kode_pos: district?.postal_code || prev.kode_pos || ""
      }));
    } else if (field === "kode_pos") {
      setRegionForm(prev => ({ ...prev, kode_pos: value }));
    }
  };

  // Load provinces on mount
  useEffect(() => {
    if (isOpen) {
      loadProvinces();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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

  // Fetch customer data dari API saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    const loadCustomerData = async () => {
      setLoadingData(true);
      setError("");

      try {
        // Fetch data terbaru dari API
        const customerData = await fetchCustomerData();
        console.log("📥 [UPDATE_CUSTOMER] Fetched customer data:", customerData);

        // Parse alamat jika ada field alamat (bukan provinsi/kabupaten/kecamatan terpisah)
        let parsedAlamat = {
          provinsi: customerData.provinsi || "",
          kabupaten: customerData.kabupaten || "",
          kecamatan: customerData.kecamatan || "",
          kode_pos: customerData.kode_pos || ""
        };

        // Jika ada field alamat (string gabungan), parse dulu
        if (customerData.alamat && typeof customerData.alamat === 'string') {
          const parsed = parseAlamat(customerData.alamat);
          // Gunakan parsed data jika field individual kosong
          if (!parsedAlamat.provinsi && parsed.provinsi) parsedAlamat.provinsi = parsed.provinsi;
          if (!parsedAlamat.kabupaten && parsed.kabupaten) parsedAlamat.kabupaten = parsed.kabupaten;
          if (!parsedAlamat.kecamatan && parsed.kecamatan) parsedAlamat.kecamatan = parsed.kecamatan;
          if (!parsedAlamat.kode_pos && parsed.kode_pos) parsedAlamat.kode_pos = parsed.kode_pos;
        }

        // Validasi industri_pekerjaan - jangan isi jika nilainya email
        let industriPekerjaanValue = customerData.industri_pekerjaan || "";
        if (industriPekerjaanValue && !isValidIndustriPekerjaan(industriPekerjaanValue)) {
          console.warn("⚠️ [UPDATE_CUSTOMER] industri_pekerjaan contains email, clearing it:", industriPekerjaanValue);
          industriPekerjaanValue = "";
        }

        // Pre-fill form dengan data yang sudah ada
        setFormData((prev) => ({
          ...prev,
          nama_panggilan: customerData.nama_panggilan || customerData.nama || prev.nama_panggilan || "",
          instagram: customerData.instagram || prev.instagram || "",
          profesi: customerData.profesi || prev.profesi || "",
          pendapatan_bln: customerData.pendapatan_bln || prev.pendapatan_bln || "",
          industri_pekerjaan: industriPekerjaanValue || "", // ✅ Gunakan value yang sudah divalidasi
          jenis_kelamin: customerData.jenis_kelamin || prev.jenis_kelamin || "l",
          tanggal_lahir: customerData.tanggal_lahir
            ? customerData.tanggal_lahir.slice(0, 10)
            : prev.tanggal_lahir || "",
          password: "", // Password selalu kosong untuk keamanan
        }));

        // Initialize region form dari customer data (dengan parsed alamat)
        setRegionForm({
          provinsi: parsedAlamat.provinsi || "",
          kabupaten: parsedAlamat.kabupaten || "",
          kecamatan: parsedAlamat.kecamatan || "",
          kode_pos: parsedAlamat.kode_pos || ""
        });

        console.log("✅ [UPDATE_CUSTOMER] Form pre-filled with existing data", {
          parsedAlamat,
          industri_pekerjaan: industriPekerjaanValue
        });
      } catch (error) {
        console.error("❌ [UPDATE_CUSTOMER] Failed to load customer data:", error);
        // Fallback ke session data jika API gagal
        try {
          const session = getCustomerSession();
          const user = session.user || {};

          // Parse alamat dari session juga
          let parsedAlamatSession = {
            provinsi: user.provinsi || "",
            kabupaten: user.kabupaten || "",
            kecamatan: user.kecamatan || "",
            kode_pos: user.kode_pos || ""
          };

          if (user.alamat && typeof user.alamat === 'string') {
            const parsed = parseAlamat(user.alamat);
            if (!parsedAlamatSession.provinsi && parsed.provinsi) parsedAlamatSession.provinsi = parsed.provinsi;
            if (!parsedAlamatSession.kabupaten && parsed.kabupaten) parsedAlamatSession.kabupaten = parsed.kabupaten;
            if (!parsedAlamatSession.kecamatan && parsed.kecamatan) parsedAlamatSession.kecamatan = parsed.kecamatan;
            if (!parsedAlamatSession.kode_pos && parsed.kode_pos) parsedAlamatSession.kode_pos = parsed.kode_pos;
          }

          // Validasi industri_pekerjaan dari session juga
          let industriPekerjaanSession = user.industri_pekerjaan || "";
          if (industriPekerjaanSession && !isValidIndustriPekerjaan(industriPekerjaanSession)) {
            console.warn("⚠️ [UPDATE_CUSTOMER] Session industri_pekerjaan contains email, clearing it:", industriPekerjaanSession);
            industriPekerjaanSession = "";
          }

          setFormData((prev) => ({
            ...prev,
            nama_panggilan: user.nama_panggilan || user.nama || prev.nama_panggilan || "",
            instagram: user.instagram || prev.instagram || "",
            profesi: user.profesi || prev.profesi || "",
            pendapatan_bln: user.pendapatan_bln || prev.pendapatan_bln || "",
            industri_pekerjaan: industriPekerjaanSession || "", // ✅ Gunakan value yang sudah divalidasi
            jenis_kelamin: user.jenis_kelamin || prev.jenis_kelamin || "l",
            tanggal_lahir: user.tanggal_lahir
              ? user.tanggal_lahir.slice(0, 10)
              : prev.tanggal_lahir || "",
            password: "",
          }));

          setRegionForm({
            provinsi: parsedAlamatSession.provinsi || "",
            kabupaten: parsedAlamatSession.kabupaten || "",
            kecamatan: parsedAlamatSession.kecamatan || "",
            kode_pos: parsedAlamatSession.kode_pos || ""
          });
        } catch (sessionError) {
          console.error("[UPDATE_CUSTOMER] Failed to load session:", sessionError);
        }
      } finally {
        setLoadingData(false);
      }
    };

    loadCustomerData();
  }, [isOpen]);

  // Initialize province ID dari user data setelah provinces loaded
  useEffect(() => {
    if (regionData.provinces.length > 0 && regionForm.provinsi) {
      const normalizedProvinsi = normalizeRegionName(regionForm.provinsi);
      // Cari province dengan case-insensitive dan trim untuk menghindari masalah whitespace
      const province = regionData.provinces.find(p => {
        const normalizedProvinceName = normalizeRegionName(p.name);
        return normalizedProvinceName === normalizedProvinsi;
      });
      if (province && selectedRegionIds.provinceId !== province.id) {
        console.log("🔵 [UPDATE_CUSTOMER] Setting province ID:", province.id, "for province:", province.name, "matched with:", regionForm.provinsi);
        setSelectedRegionIds(prev => ({ ...prev, provinceId: province.id }));
      } else if (!province && regionForm.provinsi) {
        console.warn("⚠️ [UPDATE_CUSTOMER] Province not found:", regionForm.provinsi, "Available provinces:", regionData.provinces.map(p => p.name).slice(0, 5));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionData.provinces, regionForm.provinsi]);
  
  // Initialize city ID dari user data setelah cities loaded
  useEffect(() => {
    if (regionData.cities.length > 0 && regionForm.kabupaten && selectedRegionIds.provinceId) {
      const normalizedKabupaten = normalizeRegionName(regionForm.kabupaten);
      // Cari city dengan case-insensitive dan trim untuk menghindari masalah whitespace
      const city = regionData.cities.find(c => {
        const normalizedCityName = normalizeRegionName(c.name);
        return normalizedCityName === normalizedKabupaten;
      });
      if (city && selectedRegionIds.cityId !== city.id) {
        console.log("🔵 [UPDATE_CUSTOMER] Setting city ID:", city.id, "for city:", city.name, "matched with:", regionForm.kabupaten);
        setSelectedRegionIds(prev => ({ ...prev, cityId: city.id }));
      } else if (!city && regionForm.kabupaten) {
        console.warn("⚠️ [UPDATE_CUSTOMER] City not found:", regionForm.kabupaten, "Available cities:", regionData.cities.map(c => c.name).slice(0, 5));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionData.cities, regionForm.kabupaten, selectedRegionIds.provinceId]);
  
  // Initialize district ID dari user data setelah districts loaded
  useEffect(() => {
    if (regionData.districts.length > 0 && regionForm.kecamatan && selectedRegionIds.cityId) {
      const normalizedKecamatan = normalizeRegionName(regionForm.kecamatan);
      // Cari district dengan case-insensitive dan trim untuk menghindari masalah whitespace
      const district = regionData.districts.find(d => {
        const normalizedDistrictName = normalizeRegionName(d.name);
        return normalizedDistrictName === normalizedKecamatan;
      });
      if (district) {
        const districtId = district.id || district.district_id;
        if (selectedRegionIds.districtId !== districtId) {
          console.log("🔵 [UPDATE_CUSTOMER] Setting district ID:", districtId, "for district:", district.name, "matched with:", regionForm.kecamatan);
          setSelectedRegionIds(prev => ({ ...prev, districtId: districtId }));
        }
        // Pastikan kode_pos terisi jika ada di district atau pertahankan yang sudah ada
        if (district.postal_code && !regionForm.kode_pos) {
          setRegionForm(prev => ({ ...prev, kode_pos: district.postal_code }));
        }
      } else if (!district && regionForm.kecamatan) {
        console.warn("⚠️ [UPDATE_CUSTOMER] District not found:", regionForm.kecamatan, "Available districts:", regionData.districts.map(d => d.name).slice(0, 5));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionData.districts, regionForm.kecamatan, selectedRegionIds.cityId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");

    // Validasi: Password wajib diisi jika requirePassword = true
    if (requirePassword && (!formData.password || formData.password.length < 6)) {
      setError("Password baru wajib diisi (minimal 6 karakter)");
      return;
    }

    // Validasi: Nama panggilan wajib
    if (!formData.nama_panggilan?.trim()) {
      setError("Nama panggilan wajib diisi");
      return;
    }

    // Validasi selectedRegionIds terlebih dahulu (ini yang langsung dari dropdown)
    if (!selectedRegionIds.provinceId) {
      setError("Pilih Provinsi terlebih dahulu!");
      return;
    }
    if (!selectedRegionIds.cityId) {
      setError("Pilih Kabupaten/Kota terlebih dahulu!");
      return;
    }
    if (!selectedRegionIds.districtId) {
      setError("Pilih Kecamatan terlebih dahulu!");
      return;
    }

    // Ambil nama dari regionData berdasarkan selectedRegionIds (selalu ambil dari regionData untuk memastikan)
    let provinsi = regionForm.provinsi?.trim() || "";
    let kabupaten = regionForm.kabupaten?.trim() || "";
    let kecamatan = regionForm.kecamatan?.trim() || "";
    let kode_pos = regionForm.kode_pos?.trim() || "";

    // SELALU ambil dari regionData berdasarkan selectedRegionIds untuk memastikan data terbaru
    if (selectedRegionIds.provinceId) {
      const provinceId = String(selectedRegionIds.provinceId);
      const province = regionData.provinces.find(p => 
        String(p.id) === provinceId || p.id === selectedRegionIds.provinceId || p.id === Number(selectedRegionIds.provinceId)
      );
      if (province?.name) {
        provinsi = province.name.trim();
      }
    }
    
    if (selectedRegionIds.cityId) {
      const cityId = String(selectedRegionIds.cityId);
      const city = regionData.cities.find(c => 
        String(c.id) === cityId || c.id === selectedRegionIds.cityId || c.id === Number(selectedRegionIds.cityId)
      );
      if (city?.name) {
        kabupaten = city.name.trim();
      }
    }
    
    if (selectedRegionIds.districtId) {
      const districtId = String(selectedRegionIds.districtId);
      const district = regionData.districts.find(d => 
        String(d.id) === districtId || 
        String(d.district_id) === districtId ||
        d.id === selectedRegionIds.districtId || 
        d.district_id === selectedRegionIds.districtId ||
        d.id === Number(selectedRegionIds.districtId) ||
        d.district_id === Number(selectedRegionIds.districtId)
      );
      if (district?.name) {
        kecamatan = district.name.trim();
      }
      // Ambil kode pos juga jika belum terisi
      if (!kode_pos && district?.postal_code) {
        kode_pos = String(district.postal_code).trim();
      }
    }

    // Validasi final - pastikan semua nama terisi
    if (!provinsi) {
      setError("Provinsi tidak ditemukan. Silakan pilih ulang Provinsi!");
      return;
    }
    if (!kabupaten) {
      setError("Kabupaten/Kota tidak ditemukan. Silakan pilih ulang Kabupaten/Kota!");
      return;
    }
    if (!kecamatan) {
      setError("Kecamatan tidak ditemukan. Silakan pilih ulang Kecamatan!");
      return;
    }
    if (!kode_pos) {
      setError("Kode Pos wajib diisi! Pilih Kecamatan untuk auto-fill atau isi manual.");
      return;
    }

    // Validasi kode pos harus angka
    if (!/^\d+$/.test(kode_pos)) {
      setError("Kode Pos harus berupa angka!");
      return;
    }

    setLoading(true);
    try {
      // Prepare payload dengan format alamat baru - pastikan semua string
      const payload = {
        ...formData,
        provinsi: provinsi,
        kabupaten: kabupaten,
        kecamatan: kecamatan,
        kode_pos: kode_pos,
      };

      console.log("📤 [UPDATE_CUSTOMER] Sending payload:", payload);
      const result = await updateCustomer(payload);
      console.log("📥 [UPDATE_CUSTOMER] API Response:", result);
      
      if (typeof onSuccess === "function") {
        // Kirim data dari API response, atau fallback ke formData jika API tidak return data lengkap
        const successData = {
          ...formData,           // Data dari form sebagai fallback
          ...result?.data,       // Override dengan data dari API jika ada
          password: undefined,   // Jangan simpan password
        };
        console.log("✅ [UPDATE_CUSTOMER] Success data to save:", successData);
        onSuccess(successData);
      }
      if (typeof onClose === "function") {
        onClose();
      }
      setFormData(initialFormState);
      setRegionForm({
        provinsi: "",
        kabupaten: "",
        kecamatan: "",
        kode_pos: ""
      });
      setSelectedRegionIds({
        provinceId: "",
        cityId: "",
        districtId: ""
      });
    } catch (error) {
      setError(error.message || "Gagal menyimpan data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Handler untuk klik overlay - hanya tutup jika allowClose = true
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && allowClose && typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <div 
      className="customer-modal-overlay"
      onClick={handleOverlayClick}
      style={{ cursor: allowClose ? "pointer" : "default" }}
    >
      <div className="customer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="customer-modal__header">
          <h2>{title}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {loading && (
              <span style={{ color: "#6b7280", fontSize: "14px" }}>Menyimpan...</span>
            )}
            {allowClose && (
              <button
                type="button"
                onClick={onClose}
                className="customer-modal__close-btn"
                aria-label="Tutup"
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Info banner */}
        <div className="password-notice">
          <div>
            <strong>{requirePassword ? "Keamanan Akun" : "Lengkapi Data Anda"}</strong>
            <p>
              {requirePassword 
                ? "Untuk keamanan akun Anda, silakan buat password baru sebelum melanjutkan."
                : "Silakan lengkapi data profil Anda untuk pengalaman yang lebih baik."}
            </p>
          </div>
        </div>

        {/* Loading indicator saat fetch data */}
        {loadingData && (
          <div className="loading-banner">
            <span>⏳</span> Memuat data customer...
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="error-banner">
            <span>⚠️</span> {error}
          </div>
        )}

        <form className="customer-modal__body" onSubmit={handleSubmit}>
          {SECTION_CONFIG.map((section) => {
            // Skip password section jika tidak requirePassword dan section adalah password section
            // Tapi tetap tampilkan dengan note bahwa opsional
            
            return (
            <div className="form-section" key={section.title}>
              <div className="section-header">
                <h3 className="section-title">
                  {section.title}
                  {section.isPasswordSection && !requirePassword && (
                    <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "normal", marginLeft: "8px" }}>
                      (Opsional)
                    </span>
                  )}
                </h3>
              </div>

              <div className="customer-grid">
                {section.fields.map((field) => {
                  // Handle region fields (provinsi, kabupaten, kecamatan, kode_pos)
                  if (field.type === "region_select" || field.type === "region_input") {
                    const isRequired = field.required;
                    const fieldClass = [
                      "form-field",
                      field.fullWidth ? "customer-grid__full" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    if (field.type === "region_select") {
                      let options = [];
                      let value = "";
                      let disabled = false;
                      let loading = false;

                      if (field.fieldType === "provinsi") {
                        options = regionData.provinces;
                        value = selectedRegionIds.provinceId;
                        loading = loadingRegion.provinces;
                      } else if (field.fieldType === "kabupaten") {
                        options = regionData.cities;
                        value = selectedRegionIds.cityId;
                        disabled = !selectedRegionIds.provinceId;
                        loading = loadingRegion.cities;
                      } else if (field.fieldType === "kecamatan") {
                        options = regionData.districts;
                        value = selectedRegionIds.districtId;
                        disabled = !selectedRegionIds.cityId;
                        loading = loadingRegion.districts;
                      }

                      return (
                        <label className={fieldClass} key={field.name}>
                          <span className="field-label">
                            {field.label}
                            {isRequired ? (
                              <span className="required"> *</span>
                            ) : null}
                          </span>
                          <select
                            value={value}
                            onChange={(e) => handleRegionChange(field.fieldType, e.target.value)}
                            disabled={disabled || loading}
                            required={isRequired}
                            style={{
                              cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
                              backgroundColor: (disabled || loading) ? '#f9fafb' : 'white'
                            }}
                          >
                            <option value="">
                              {field.fieldType === "provinsi" ? "Pilih Provinsi" :
                               field.fieldType === "kabupaten" ? "Pilih Kabupaten/Kota" :
                               "Pilih Kecamatan"}
                            </option>
                            {options.map((item) => (
                              <option key={item.id || item.district_id} value={item.id || item.district_id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                          {loading && (
                            <p className="field-hint" style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                              Memuat...
                            </p>
                          )}
                          {disabled && !loading && (
                            <p className="field-hint" style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                              {field.fieldType === "kabupaten" ? "Pilih Provinsi terlebih dahulu" :
                               field.fieldType === "kecamatan" ? "Pilih Kabupaten/Kota terlebih dahulu" : ""}
                            </p>
                          )}
                        </label>
                      );
                    } else if (field.type === "region_input" && field.fieldType === "kode_pos") {
                      return (
                        <label className={fieldClass} key={field.name}>
                          <span className="field-label">
                            {field.label}
                            {isRequired ? (
                              <span className="required"> *</span>
                            ) : null}
                          </span>
                          <input
                            type="text"
                            value={regionForm.kode_pos}
                            onChange={(e) => handleRegionChange("kode_pos", e.target.value)}
                            disabled={!selectedRegionIds.districtId}
                            required={isRequired}
                            placeholder={field.placeholder}
                            style={{
                              cursor: !selectedRegionIds.districtId ? 'not-allowed' : 'text',
                              backgroundColor: !selectedRegionIds.districtId ? '#f9fafb' : 'white'
                            }}
                          />
                          {!selectedRegionIds.districtId && (
                            <p className="field-hint" style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                              Pilih kecamatan terlebih dahulu
                            </p>
                          )}
                        </label>
                      );
                    }
                  }

                  // Handle regular fields
                  const value = formData[field.name] ?? "";
                  
                  // Override required untuk password field berdasarkan requirePassword prop
                  const isRequired = field.name === "password" 
                    ? requirePassword 
                    : field.required;
                  
                  const baseProps = {
                    name: field.name,
                    value,
                    onChange: handleChange,
                    placeholder: field.placeholder,
                    required: isRequired,
                  };

                  if (field.type === "textarea") {
                    baseProps.rows = field.rows || 3;
                  }

                  const fieldClass = [
                    "form-field",
                    field.fullWidth ? "customer-grid__full" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <label className={fieldClass} key={field.name}>
                      <span className="field-label">
                        {field.label}
                        {isRequired ? (
                          <span className="required"> *</span>
                        ) : null}
                      </span>

                      {field.type === "select" ? (
                        <select {...baseProps}>
                          {field.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea {...baseProps} />
                      ) : (
                        <input type={field.type || "text"} {...baseProps} />
                      )}

                      {field.note && (
                        <p className="field-hint">
                          {field.name === "password" && !requirePassword 
                            ? "Kosongkan jika tidak ingin mengganti password"
                            : field.note}
                        </p>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
          })}

          <div className="customer-modal__footer">
            {/* Modal tidak bisa ditutup sebelum submit, jadi tidak ada tombol Batal */}
            <button
              type="submit"
              className="customer-btn customer-btn--primary"
              disabled={loading || loadingData}
              style={{ width: "100%" }}
            >
              {loading ? "Menyimpan..." : loadingData ? "Memuat data..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .customer-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 16, 18, 0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
          padding: 1rem;
          overflow-y: auto;
        }

        .customer-modal {
          width: min(720px, 100%);
          max-height: 90vh;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 25px 80px rgba(8, 12, 30, 0.3);
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.3s ease;
          overflow: hidden;
        }

        .customer-modal__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
        }

        .customer-modal__header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          color: #111827;
          letter-spacing: -0.02em;
        }

        .customer-modal__close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s ease;
          padding: 0;
        }

        .customer-modal__close-btn:hover:not(:disabled) {
          background: #f3f4f6;
          color: #111827;
        }

        .customer-modal__close-btn:active:not(:disabled) {
          background: #e5e7eb;
        }

        .customer-modal__close-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .customer-modal__body {
          padding: 2rem;
          overflow-y: auto;
          flex: 1;
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .form-section:last-of-type {
          margin-bottom: 0;
        }

        .section-header {
          margin-bottom: 1.25rem;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .customer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem 1.5rem;
        }

        .customer-grid__full {
          grid-column: 1 / -1;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .field-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.25rem;
        }

        .required {
          color: #ef4444;
          font-weight: 700;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          font-size: 0.9375rem;
          transition: all 0.2s ease;
          background: #ffffff;
          color: #111827;
          font-family: inherit;
        }

        input:hover,
        select:hover,
        textarea:hover {
          border-color: #d1d5db;
        }

        input:focus,
        select:focus,
        textarea:focus {
          outline: none;
          border-color: #f1a124;
          background: #fffef9;
          box-shadow: 0 0 0 3px rgba(241, 161, 36, 0.1);
        }

        input::placeholder,
        textarea::placeholder {
          color: #9ca3af;
        }

        select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
        }

        textarea {
          resize: vertical;
          min-height: 80px;
        }

        .field-hint {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
          font-style: italic;
        }

        .customer-modal__footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 1.5rem 2rem;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .customer-btn {
          border: none;
          border-radius: 12px;
          padding: 0.875rem 2rem;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .customer-btn--primary {
          background: linear-gradient(135deg, #f1a124 0%, #e8911a 100%);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(241, 161, 36, 0.4);
        }

        .customer-btn--primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(241, 161, 36, 0.5);
        }

        .customer-btn--primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .customer-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .password-notice {
          padding: 16px 24px;
          background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
          border-bottom: 1px solid #fcd34d;
        }

        .password-notice strong {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 4px;
        }

        .password-notice p {
          font-size: 13px;
          color: #a16207;
          margin: 0;
          line-height: 1.4;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #fef2f2;
          border-bottom: 1px solid #fecaca;
          font-size: 14px;
          color: #dc2626;
          font-weight: 500;
        }

        .loading-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #eff6ff;
          border-bottom: 1px solid #bfdbfe;
          font-size: 14px;
          color: #1e40af;
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .customer-modal {
            width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .customer-modal__header,
          .customer-modal__body,
          .customer-modal__footer {
            padding: 1.25rem;
          }

          .customer-grid {
            grid-template-columns: 1fr;
          }

          .customer-grid__full {
            grid-column: 1;
          }
        }
      `}</style>
    </div>
  );
}

