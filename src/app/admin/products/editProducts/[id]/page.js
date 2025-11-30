"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import LandingTemplate from "@/components/LandingTemplate";
import { MultiSelect } from "primereact/multiselect";
import { ArrowLeft } from "lucide-react";
import "@/styles/add-products.css";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id;

  // ============================
  // SLUGIFY - Generate kode dari nama
  // ============================
  const generateKode = (text) => {
    return (text || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  };


  // ============================
  // FORMAT TANGGAL KE BACKEND
  // ============================
  const formatDateForBackend = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const pad = (v) => (v < 10 ? `0${v}` : v);
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // ============================
  // DEFAULT FORM
  // ============================
  const defaultForm = {
    id: null,
    kategori: null, // Integer, bukan array
    user_input: [],
    nama: "",
    url: "",
    kode: "",
    header: { type: "file", value: null },
    harga_coret: "",
    harga_asli: "",
    deskripsi: "",
    tanggal_event: "",
    gambar: [], // [{ path: {type:'file', value:File}, caption }]
    landingpage: "1",
    status: 1,
    assign: [],
    custom_field: [],
    list_point: [],
    testimoni: [],
    fb_pixel: [],
    event_fb_pixel: [],
    gtm: [],
    video: "",
  };

  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  // ============================
  // HANDLER INPUT
  // ============================
  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateArrayItem = (key, i, field, value) => {
    const arr = [...form[key]];
    if (field) arr[i][field] = value;
    else arr[i] = value;
    setForm((p) => ({ ...p, [key]: arr }));
  };

  const addArray = (key, value) => {
    setForm((p) => ({ ...p, [key]: [...p[key], value] }));
  };

  const removeArray = (key, index) => {
    const arr = [...form[key]];
    arr.splice(index, 1);
    setForm((p) => ({ ...p, [key]: arr }));
  };

  // ============================
  // HELPER: Build Image URL via Proxy
  // ============================
  const buildImageUrl = (path) => {
    if (!path) return "";
    if (typeof path !== "string") return "";
    // Jika sudah URL lengkap (http/https), return langsung
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    // Jika blob URL (untuk preview file baru)
    if (path.startsWith("blob:")) return path;
    // Gunakan proxy untuk path dari backend
    let cleanPath = path.replace(/^storage\//, "").replace(/^\//, "");
    return `/api/image?path=${encodeURIComponent(cleanPath)}`;
  };

  // ============================
  // DELETE: Hapus Gambar Gallery via API
  // ============================
  const deleteGalleryImage = async (index) => {
    if (!productId) return;
    
    const confirmed = window.confirm(`Hapus gambar ke-${index + 1} dari server?`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/produk/${productId}/gambar/${index}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        alert(data.message || "Gagal menghapus gambar");
        return;
      }

      alert("Gambar berhasil dihapus");
      // Refresh data produk
      await fetchProductData(false);
    } catch (error) {
      console.error("Delete gallery error:", error);
      alert("Terjadi kesalahan saat menghapus gambar");
    }
  };

  // ============================
  // DELETE: Hapus Testimoni via API
  // ============================
  const deleteTestimoni = async (index) => {
    if (!productId) return;
    
    const confirmed = window.confirm(`Hapus testimoni ke-${index + 1} dari server?`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/produk/${productId}/testimoni/${index}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        alert(data.message || "Gagal menghapus testimoni");
        return;
      }

      alert("Testimoni berhasil dihapus");
      // Refresh data produk
      await fetchProductData(false);
    } catch (error) {
      console.error("Delete testimoni error:", error);
      alert("Terjadi kesalahan saat menghapus testimoni");
    }
  };

  // ============================
  // DELETE: Hapus Data Produk
  // ============================
  const deleteProduct = async () => {
    if (!productId) {
      alert("Product ID tidak ditemukan!");
      return;
    }

    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
    );
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      setSubmitStatus("Menghapus produk...");

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/produk/${productId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Gagal menghapus produk");
        setIsSubmitting(false);
        setSubmitStatus("");
        return;
      }

      alert("Produk berhasil dihapus");
      // Redirect ke halaman products
      router.push("/admin/products");
    } catch (error) {
      console.error("Delete product error:", error);
      alert("Terjadi kesalahan saat menghapus produk");
      setIsSubmitting(false);
      setSubmitStatus("");
    }
  };

  // ============================
  // CONVERT & COMPRESS IMAGE TO JPG
  // ============================
  const convertImageToJPG = async (file, quality = 0.75, maxWidth = 1600) => {
    return new Promise((resolve, reject) => {
      // Check if already JPG/PNG
      const isJPG = file.type === "image/jpeg" || file.type === "image/jpg";
      const isPNG = file.type === "image/png";
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          // Resize if too large
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          
          // For PNG or other formats with transparency, fill white background
          // For JPG, no need to fill (already opaque)
          if (!isJPG) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
          }
          
          // Draw image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPG (even if already JPG, we compress it)
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to convert/compress image"));
                return;
              }
              // Always use .jpg extension and image/jpeg MIME type
              const jpgFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(jpgFile);
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  // ============================
  // SUBMIT - POST ke /api/admin/produk/{id}
  // ============================
  const handleSubmit = async () => {
    if (isSubmitting) {
      console.log("⚠️ [EDIT_PRODUK] Duplicate submission prevented");
      return;
    }

    if (!productId) {
      alert("Product ID tidak ditemukan!");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("Menyiapkan data produk...");

    try {
      // ============================================
      // STEP 1: VALIDATE ALL REQUIRED FIELDS FIRST
      // ============================================
      console.log("🔍 [EDIT_PRODUK] Step 1: Validating required fields...");
      console.log("  form.kategori:", form.kategori, "(type:", typeof form.kategori + ")");

      // Validate kategori
      const kategoriId = (() => {
        if (!form.kategori || form.kategori === null || form.kategori === undefined || form.kategori === "") {
          console.error("❌ [EDIT_PRODUK] kategori is missing/empty");
          return null;
        }
        const parsed = Number(form.kategori);
        if (Number.isNaN(parsed) || parsed <= 0) {
          console.error("❌ [EDIT_PRODUK] kategori is not a valid number:", form.kategori);
          return null;
        }
        console.log("✅ [EDIT_PRODUK] kategori is valid:", parsed);
        return parsed;
      })();

      if (!kategoriId) {
        alert("Kategori wajib dipilih! Silakan pilih kategori sebelum menyimpan produk.");
        setIsSubmitting(false);
        setSubmitStatus("");
        return;
      }

      // Validate assign
      const normalizedAssign = Array.isArray(form.assign)
        ? form.assign
            .filter((v) => v !== null && v !== undefined && v !== "")
            .map((v) => Number(v))
            .filter((num) => !Number.isNaN(num) && num > 0)
        : [];

      if (normalizedAssign.length === 0) {
        alert("Penanggung Jawab (Assign By) wajib dipilih minimal 1 user!");
        setIsSubmitting(false);
        setSubmitStatus("");
        return;
      }

      // Validate nama
      if (!form.nama || form.nama.trim() === "") {
        alert("Nama produk wajib diisi!");
        setIsSubmitting(false);
        setSubmitStatus("");
        return;
      }

      console.log("✅ [EDIT_PRODUK] All required fields validated");
      console.log("  kategoriId:", kategoriId);
      console.log("  assign:", normalizedAssign);
      console.log("  nama:", form.nama);

      // ============================================
      // STEP 2: CHECK IF HAS FILES
      // ============================================
      const hasNewHeaderFile = form.header.type === "file" && form.header.value instanceof File;
      const hasNewGalleryFile = form.gambar.some((g) => g.path?.type === "file" && g.path?.value instanceof File);
      const hasNewTestimoniFile = form.testimoni.some((t) => t.gambar?.type === "file" && t.gambar?.value instanceof File);
      const hasNewFile = hasNewHeaderFile || hasNewGalleryFile || hasNewTestimoniFile;

      console.log("🔍 [EDIT_PRODUK] Step 2: Checking files...");
      console.log("  hasNewFile:", hasNewFile);
      console.log("  hasNewHeaderFile:", hasNewHeaderFile);
      console.log("  hasNewGalleryFile:", hasNewGalleryFile);
      console.log("  hasNewTestimoniFile:", hasNewTestimoniFile);

      // SELALU generate slug dari nama untuk memastikan konsistensi
      const kode = generateKode(form.nama);

      // ============================================
      // STEP 3: BUILD PAYLOAD
      // ============================================
      const payloadCustomField = form.custom_field.map((f, idx) => ({
        nama_field: f.label || f.key,
        urutan: idx + 1
      }));

      const videoArray = form.video
        ? form.video.split(",").map(v => v.trim()).filter(v => v)
        : [];

      let payload;
      let isFormData = false;

      if (hasNewFile) {
        // Use FormData for file uploads
        console.log("📦 [EDIT_PRODUK] Step 3: Building FormData payload...");
        setSubmitStatus("Mengompres & menyiapkan berkas media...");
        payload = new FormData();
        isFormData = true;

        // ===== CRITICAL: Append ALL required fields FIRST, before file processing =====
        console.log("📤 [EDIT_PRODUK] Appending required fields to FormData...");
        
        // 1. kategori (REQUIRED - MUST BE FIRST)
        payload.append("kategori", String(kategoriId));
        console.log("  ✅ kategori:", String(kategoriId));

        // 2. nama (REQUIRED)
        payload.append("nama", form.nama || "");
        console.log("  ✅ nama:", form.nama || "");

        // 3. user_input (REQUIRED)
        if (form.user_input) {
          payload.append("user_input", String(form.user_input));
          console.log("  ✅ user_input:", String(form.user_input));
        }

        // 4. assign (REQUIRED)
        payload.append("assign", JSON.stringify(normalizedAssign));
        console.log("  ✅ assign:", JSON.stringify(normalizedAssign));

        // 5. Other required fields
        payload.append("kode", kode);
        payload.append("url", "/" + kode);
        payload.append("deskripsi", form.deskripsi || "");
        payload.append("harga_coret", String(form.harga_coret || 0));
        payload.append("harga_asli", String(form.harga_asli || 0));
        payload.append("tanggal_event", formatDateForBackend(form.tanggal_event));
        payload.append("landingpage", String(form.landingpage || "1"));
        payload.append("status", String(form.status || 1));

        // 6. JSON fields
        payload.append("custom_field", JSON.stringify(payloadCustomField));
        payload.append("list_point", JSON.stringify(form.list_point || []));
        payload.append("fb_pixel", JSON.stringify(form.fb_pixel || []));
        payload.append(
          "event_fb_pixel",
          JSON.stringify((form.event_fb_pixel || []).map((ev) => ({ event: ev })))
        );
        payload.append("gtm", JSON.stringify(form.gtm || []));
        payload.append("video", JSON.stringify(videoArray));

        console.log("✅ [EDIT_PRODUK] All required fields appended to FormData");

        // ===== STEP 4: PROCESS FILES (after required fields are appended) =====
        console.log("📁 [EDIT_PRODUK] Step 4: Processing files...");
        try {
          // Process Header
          if (hasNewHeaderFile) {
            setSubmitStatus("Mengonversi header ke JPG...");
            const processedHeader = await convertImageToJPG(form.header.value, 0.75, 1600);
            payload.append("header", processedHeader);
            console.log("  ✅ header file appended");
          }

          // Process Gallery
          for (let idx = 0; idx < form.gambar.length; idx++) {
            const g = form.gambar[idx];
            if (g.path?.type === "file" && g.path?.value instanceof File) {
              setSubmitStatus(`Mengonversi gambar ${idx + 1}/${form.gambar.length} ke JPG...`);
              const processedGambar = await convertImageToJPG(g.path.value, 0.75, 1600);
              payload.append(`gambar[${idx}][file]`, processedGambar);
            } else if (g.path?.type === "url" && g.path.value) {
              // File existing - kirim path sebagai string
              payload.append(`gambar[${idx}][path]`, g.path.value);
            }
            payload.append(`gambar[${idx}][caption]`, g.caption || "");
          }
          console.log(`  ✅ gallery: ${form.gambar.length} items processed`);

          // Process Testimoni
          for (let idx = 0; idx < form.testimoni.length; idx++) {
            const t = form.testimoni[idx];
            if (t.gambar?.type === "file" && t.gambar?.value instanceof File) {
              setSubmitStatus(`Mengonversi testimoni ${idx + 1}/${form.testimoni.length} ke JPG...`);
              const processedTestimoni = await convertImageToJPG(t.gambar.value, 0.75, 1600);
              payload.append(`testimoni[${idx}][gambar]`, processedTestimoni);
            } else if (t.gambar?.type === "url" && t.gambar.value) {
              // File existing - kirim path sebagai string
              payload.append(`testimoni[${idx}][gambar_path]`, t.gambar.value);
            }
            payload.append(`testimoni[${idx}][nama]`, t.nama || "");
            payload.append(`testimoni[${idx}][deskripsi]`, t.deskripsi || "");
          }
          console.log(`  ✅ testimoni: ${form.testimoni.length} items processed`);
        } catch (error) {
          console.error("❌ [EDIT_PRODUK] Error processing images:", error);
          alert(`Gagal memproses gambar: ${error.message}`);
          setIsSubmitting(false);
          setSubmitStatus("");
          return;
        }

        // Final verification: Check kategori is still in FormData
        const kategoriCheck = payload.get("kategori");
        if (!kategoriCheck || kategoriCheck === "null" || kategoriCheck === "") {
          console.error("❌ [EDIT_PRODUK] CRITICAL: kategori missing after file processing!");
          alert("Terjadi kesalahan: Kategori hilang setelah proses file. Silakan coba lagi.");
          setIsSubmitting(false);
          setSubmitStatus("");
          return;
        }
        console.log("✅ [EDIT_PRODUK] kategori verified in FormData:", kategoriCheck);
      } else {
        // Use JSON payload (no new files)
        console.log("📦 [EDIT_PRODUK] Step 3: Building JSON payload...");
        
        // Build testimoni array dengan path existing
        const testimoniPayload = form.testimoni.map((t) => {
          let gambarValue = null;
          if (t.gambar?.type === "url" && t.gambar.value) {
            gambarValue = t.gambar.value;
          } else if (typeof t.gambar === "string") {
            gambarValue = t.gambar;
          }
          return {
            gambar: gambarValue,
            nama: t.nama || "",
            deskripsi: t.deskripsi || ""
          };
        });

        // Build gambar array dengan path existing
        const gambarPayload = form.gambar.map((g) => {
          let pathValue = null;
          if (g.path?.type === "url" && g.path.value) {
            pathValue = g.path.value;
          } else if (typeof g.path === "string") {
            pathValue = g.path;
          }
          return {
            path: pathValue,
            caption: g.caption || ""
          };
        });

        payload = {
          nama: form.nama || "",
          kode: kode,
          url: "/" + kode,
          deskripsi: form.deskripsi || "",
          harga_coret: Number(form.harga_coret) || 0,
          harga_asli: Number(form.harga_asli) || 0,
          tanggal_event: formatDateForBackend(form.tanggal_event),
          landingpage: form.landingpage || "1",
          status: form.status || 1,
          // REQUIRED FIELDS
          kategori: String(kategoriId), // MUST be string
          assign: JSON.stringify(normalizedAssign),
          user_input: form.user_input || null,
          // JSON fields
          custom_field: JSON.stringify(payloadCustomField),
          list_point: JSON.stringify(form.list_point || []),
          fb_pixel: JSON.stringify(form.fb_pixel || []),
          event_fb_pixel: JSON.stringify(
            (form.event_fb_pixel || []).map((ev) => ({ event: ev }))
          ),
          gtm: JSON.stringify(form.gtm || []),
          video: JSON.stringify(videoArray),
          testimoni: JSON.stringify(testimoniPayload),
          gambar: JSON.stringify(gambarPayload),
        };
        console.log("✅ [EDIT_PRODUK] JSON payload built");
        console.log("  kategori:", payload.kategori);
      }

      // ============================================
      // STEP 5: FINAL VERIFICATION
      // ============================================
      console.log("🔍 [EDIT_PRODUK] Step 5: Final verification...");
      if (isFormData) {
        const kategoriValue = payload.get("kategori");
        const namaValue = payload.get("nama");
        const userInputValue = payload.get("user_input");
        const assignValue = payload.get("assign");
        
        console.log("  kategori:", kategoriValue);
        console.log("  nama:", namaValue);
        console.log("  user_input:", userInputValue);
        console.log("  assign:", assignValue);
        
        if (!kategoriValue || kategoriValue === "null" || kategoriValue === "") {
          console.error("❌ [EDIT_PRODUK] CRITICAL: kategori missing in final FormData!");
          alert("Terjadi kesalahan: Kategori tidak ditemukan. Silakan refresh halaman dan coba lagi.");
          setIsSubmitting(false);
          setSubmitStatus("");
          return;
        }
      } else {
        if (!payload.kategori || payload.kategori === null || payload.kategori === "") {
          console.error("❌ [EDIT_PRODUK] CRITICAL: kategori missing in JSON payload!");
          alert("Terjadi kesalahan: Kategori tidak ditemukan. Silakan refresh halaman dan coba lagi.");
          setIsSubmitting(false);
          setSubmitStatus("");
          return;
        }
      }

      console.log("✅ [EDIT_PRODUK] All verifications passed");
      console.log("🚀 [EDIT_PRODUK] Sending payload to backend...");

      // ============================================
      // STEP 6: SEND TO BACKEND (POST method)
      // ============================================
      setSubmitStatus("Mengunggah produk ke server...");
      const res = await fetch(
        `/api/admin/produk/${productId}`,
        {
          method: "POST",
          headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: isFormData ? payload : JSON.stringify(payload),
        }
      );

      // ============================================
      // STEP 7: HANDLE RESPONSE
      // ============================================
      console.log("📥 [EDIT_PRODUK] Step 7: Handling response...");
      const contentType = res.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch (parseError) {
          const textResponse = await res.text();
          console.error("❌ [EDIT_PRODUK] Failed to parse JSON response:", textResponse.substring(0, 200));
          alert("Terjadi kesalahan: Response dari server tidak valid.");
          setIsSubmitting(false);
          setSubmitStatus("");
          return;
        }
      } else {
        const textResponse = await res.text();
        console.error("❌ [EDIT_PRODUK] Non-JSON response received:", textResponse.substring(0, 200));
        alert("Terjadi kesalahan: Server mengembalikan response yang tidak valid.");
        setIsSubmitting(false);
        setSubmitStatus("");
        return;
      }
      
      console.log("📊 [EDIT_PRODUK] Response received:");
      console.log("  success:", data.success);
      console.log("  message:", data.message);
      if (data.data) {
        console.log("  data:", data.data);
        console.table(data.data);
      }

      if (!res.ok) {
        console.error("❌ [EDIT_PRODUK] API ERROR:", data);
        console.error("❌ [EDIT_PRODUK] API ERROR detail:", data?.errors);
        alert(data?.message || "Gagal mengupdate produk!");
        setIsSubmitting(false);
        setSubmitStatus("");
        return;
      }

      // Success
      console.log("✅ [EDIT_PRODUK] Product updated successfully:", data);
      setSubmitStatus("Produk berhasil diupdate, mengalihkan...");
      alert("Produk berhasil diupdate!");
      
      // Redirect ke halaman products
      router.push("/admin/products");
    } catch (err) {
      console.error("❌ [EDIT_PRODUK] Submit error:", err);
      alert("Terjadi kesalahan saat submit: " + (err.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
      setSubmitStatus("");
    }
  };

  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [createdByUser, setCreatedByUser] = useState(null); // User yang membuat produk

  // Function untuk fetch data produk
  const fetchProductData = async (setLoadingState = false) => {
    if (!productId) {
      if (setLoadingState) setLoading(false);
      return;
    }

    try {
      if (setLoadingState) setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch produk berdasarkan ID
      const produkRes = await fetch(
        `/api/admin/produk/${productId}`,
        { headers }
      );
      const produkResponse = await produkRes.json();
      
      if (!produkRes.ok || !produkResponse.success) {
        throw new Error(produkResponse.message || "Gagal memuat data produk");
      }

      const produkData = produkResponse.data || produkResponse;

      // Helper function untuk parse JSON fields
      const safeParseJSON = (value, fallback = []) => {
        if (!value) return fallback;
        if (Array.isArray(value)) return value;
        try {
          return JSON.parse(value);
        } catch {
          return fallback;
        }
      };

      // Fetch kategori untuk mendapatkan kategori_id
      const kategoriRes = await fetch(
        "/api/admin/kategori-produk",
        { headers }
      );
      const kategoriData = await kategoriRes.json();
      const activeCategories = Array.isArray(kategoriData.data)
        ? kategoriData.data.filter((k) => k.status === "1")
        : [];

      // Handle kategori_id
      let kategoriId = null;
      if (produkData.kategori_rel) {
        kategoriId = produkData.kategori_rel.id ? Number(produkData.kategori_rel.id) : null;
      } else if (produkData.kategori_id) {
        kategoriId = Number(produkData.kategori_id);
      } else if (produkData.kategori) {
        kategoriId = Number(produkData.kategori);
      }

      // SELALU generate kode dari nama dengan dash
      const kodeGenerated = generateKode(produkData.nama || "produk-baru");
      
      console.log("🔧 [LOAD] Nama produk:", produkData.nama);
      console.log("🔧 [LOAD] Kode generated (dengan dash):", kodeGenerated);
      
      // Parse gambar - handle existing images (type: "url")
      const parsedGambar = safeParseJSON(produkData.gambar, []).map(g => {
        const imagePath = typeof g === "string" ? g : (g.path || g);
        return {
          path: imagePath 
            ? { type: "url", value: imagePath }
            : { type: "file", value: null },
          caption: g.caption || ""
        };
      });

      // Parse testimoni - handle existing images (type: "url")
      const parsedTestimoni = safeParseJSON(produkData.testimoni, []).map(t => {
        const imagePath = t.gambar ? (typeof t.gambar === "string" ? t.gambar : (t.gambar.path || t.gambar)) : null;
        return {
          gambar: imagePath
            ? { type: "url", value: imagePath }
            : { type: "file", value: null },
          nama: t.nama || "",
          deskripsi: t.deskripsi || ""
        };
      });

      // Parse custom_field
      const parsedCustomField = safeParseJSON(produkData.custom_field, []).map(f => ({
        label: f.nama_field || f.label || "",
        value: f.value || "",
        required: f.required || false
      }));

      // Parse list_point
      const parsedListPoint = safeParseJSON(produkData.list_point, []).map(p => ({
        nama: p.nama || p
      }));

      // Parse video
      const parsedVideo = produkData.video
        ? (Array.isArray(produkData.video) 
            ? produkData.video.join(", ")
            : safeParseJSON(produkData.video, []).join(", "))
        : "";

      // Handle header image - existing image (type: "url")
      const headerImage = produkData.header
        ? (typeof produkData.header === "string"
            ? { type: "url", value: produkData.header }
            : (produkData.header.path
                ? { type: "url", value: produkData.header.path }
                : { type: "file", value: null }))
        : { type: "file", value: null };

      // Parse tanggal_event untuk PrimeReact Calendar
      let parsedTanggalEvent = null;
      if (produkData.tanggal_event) {
        // Backend format: "2025-11-29 13:00:00" atau ISO string
        const dateStr = produkData.tanggal_event.replace(" ", "T");
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          parsedTanggalEvent = date;
        }
      }

      setForm((f) => ({
        ...f,
        // Spread produkData tapi override field yang perlu di-parse
        nama: produkData.nama || "",
        kode: kodeGenerated,
        url: "/" + kodeGenerated, // Selalu generate URL dari kode (bukan dari database)
        deskripsi: produkData.deskripsi || "",
        harga_coret: produkData.harga_coret || "",
        harga_asli: produkData.harga_asli || "",
        tanggal_event: parsedTanggalEvent,
        status: produkData.status || "1",
        landingpage: produkData.landingpage || "1",
        id: produkData.id || productId,
        kategori: kategoriId,
        assign: produkData.assign_rel ? produkData.assign_rel.map((u) => u.id) : safeParseJSON(produkData.assign, []),
        user_input: produkData.user_input_rel?.id || produkData.user_input || null,
        custom_field: parsedCustomField,
        list_point: parsedListPoint,
        testimoni: parsedTestimoni,
        fb_pixel: safeParseJSON(produkData.fb_pixel, []),
        // event_fb_pixel dari backend: [{event: "value"}] → convert ke ["value"]
        event_fb_pixel: safeParseJSON(produkData.event_fb_pixel, []).map(e => 
          typeof e === "string" ? e : (e.event || e)
        ),
        gtm: safeParseJSON(produkData.gtm, []),
        gambar: parsedGambar,
        header: headerImage,
        video: parsedVideo,
      }));
      
      // Set user yang membuat produk (created by)
      if (produkData.user_input_rel) {
        setCreatedByUser(produkData.user_input_rel);
      }
      
      console.log("✅ [EDIT] Product data loaded:", {
        nama: produkData.nama,
        kode_from_backend: produkData.kode,
        kode_generated: kodeGenerated,
        kategori: kategoriId,
        tanggal_event: parsedTanggalEvent,
        list_point: parsedListPoint,
        testimoni: parsedTestimoni.length,
        gambar: parsedGambar.length,
        created_by: produkData.user_input_rel,
      });
    } catch (err) {
      console.error("Fetch product data error:", err);
      if (setLoadingState) {
        alert("Gagal memuat data produk!");
      }
    } finally {
      if (setLoadingState) setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchInitialData() {
      if (!productId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // 1️⃣ Fetch kategori dan filter hanya yang aktif (status === "1")
        const kategoriRes = await fetch(
          "/api/admin/kategori-produk",
          { headers }
        );
        const kategoriData = await kategoriRes.json();
        
        // Logging struktur JSON lengkap
        console.log("Success:", kategoriData.success);
        console.log("Data:", kategoriData.data);
        console.table(kategoriData.data);
        
        // Filter hanya kategori yang aktif (status === "1")
        const activeCategories = Array.isArray(kategoriData.data)
          ? kategoriData.data.filter((k) => k.status === "1")
          : [];
        
        // Create options with ID as value and name as label
        const kategoriOpts = activeCategories.map((k) => ({
          label: `${k.id} - ${k.nama}`,
          value: k.id
        }));
        setKategoriOptions(kategoriOpts);

        // 2️⃣ Fetch produk berdasarkan ID - menggunakan fetchProductData
        await fetchProductData(true);

        // 3️⃣ Fetch users - filter hanya status 1
        const usersRes = await fetch(
          "/api/admin/users",
          { headers }
        );
        const usersJson = await usersRes.json();
        
        // Logging struktur JSON lengkap
        console.log("Success:", usersJson.success);
        console.log("Data:", usersJson.data);
        console.table(usersJson.data);
        
        const userOpts = Array.isArray(usersJson.data)
          ? usersJson.data
              .filter((u) => u.status === "1" || u.status === 1)
              .map((u) => ({ label: u.nama || u.name, value: u.id }))
          : [];
        setUserOptions(userOpts);
      } catch (err) {
        console.error("Fetch initial data error:", err);
        alert("Gagal memuat data produk!");
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, [productId, refreshKey]);

  // ============================
  // UI
  // ============================
  if (loading) {
    return (
      <div className="produk-container produk-builder-layout" style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      {isSubmitting && (
        <div className="submit-lock-overlay">
          <div className="submit-lock-card">
            <span className="submit-lock-spinner" />
            <p>{submitStatus || "Menyimpan produk, mohon tunggu..."}</p>
            <small>Jangan tutup halaman hingga proses selesai.</small>
          </div>
        </div>
      )}
      <div className="produk-container produk-builder-layout">
        <div className="produk-form">
        {/* Header Section */}
        <div className="form-header-section">
          <button
            className="back-to-products-btn"
            onClick={() => router.push("/admin/products")}
            aria-label="Back to products list"
          >
            <ArrowLeft size={18} />
            <span>Back to Products</span>
          </button>
          <div className="form-title-wrapper">
            <h2 className="form-title">Edit Produk</h2>
            <p className="form-subtitle">Ubah informasi produk di bawah ini</p>
          </div>
        </div>

        {/* SECTION 1: Informasi Dasar */}
        <div className="form-section-card">
          <div className="section-header">
            <h3 className="section-title">📋 Informasi Dasar</h3>
            <p className="section-description">Data utama produk yang akan ditampilkan</p>
          </div>
          <div className="section-content">
            {/* NAMA PRODUK */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">📦</span>
                Nama Produk <span className="required">*</span>
              </label>
              <InputText
                className="w-full form-input"
                value={form.nama}
                placeholder="Masukkan nama produk"
                onChange={(e) => {
                  const nama = e.target.value;
                  // SELALU generate kode dari nama dengan dash
                  const kode = generateKode(nama);
                  setForm({ 
                    ...form, 
                    nama, 
                    kode: kode,
                    url: "/" + kode
                  });
                }}
              />
            </div>

            {/* KATEGORI */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">🏷️</span>
                Kategori <span className="required">*</span>
              </label>
              <Dropdown
                className="w-full form-input"
                value={form.kategori || null}
                options={kategoriOptions}
                onChange={(e) => {
                  handleChange("kategori", e.value ? Number(e.value) : null);
                }}
                placeholder="Pilih Kategori"
                showClear
              />
            </div>

            {/* KODE & URL - Otomatis dari nama produk */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-field-group">
                <label className="form-label">
                  <span className="label-icon">🔗</span>
                  Kode Produk (Slug)
                </label>
                <InputText
                  className="w-full form-input"
                  value={form.kode || ""}
                  readOnly
                  disabled
                  placeholder="Otomatis dari nama produk"
                  style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
                />
              </div>
              <div className="form-field-group">
                <label className="form-label">
                  <span className="label-icon">🌐</span>
                  URL
                </label>
                <InputText
                  className="w-full form-input"
                  value={form.url || ""}
                  readOnly
                  disabled
                  placeholder="/kode-produk"
                  style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
                />
              </div>
            </div>
            <p className="field-hint">
              Kode dan URL otomatis dihasilkan dari nama produk
            </p>
          </div>
        </div>

        {/* SECTION 2: Media & Konten */}
        <div className="form-section-card">
          <div className="section-header">
            <h3 className="section-title">🖼️ Media & Konten</h3>
            <p className="section-description">Gambar, deskripsi, dan konten produk</p>
          </div>
          <div className="section-content">
            {/* HEADER IMAGE */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">🖼️</span>
                Header Image
              </label>
              <div className="file-upload-card">
                {form.header?.type === "url" && form.header.value && (
                  <div className="file-preview">
                    <img 
                      src={buildImageUrl(form.header.value)} 
                      alt="Current header" 
                      className="preview-thumbnail"
                    />
                    <p className="field-hint">Gambar saat ini</p>
                  </div>
                )}
                <label className="file-upload-label">Upload File Baru</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleChange("header", { type: "file", value: e.target.files[0] })}
                  className="file-input"
                />
                {form.header?.type === "file" && form.header.value && (
                  <div className="file-preview">
                    <img 
                      src={URL.createObjectURL(form.header.value)} 
                      alt="Preview" 
                      className="preview-thumbnail"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* DESKRIPSI */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">📝</span>
                Deskripsi Produk
              </label>
              <InputTextarea
                className="w-full form-input"
                rows={5}
                value={form.deskripsi}
                placeholder="Masukkan deskripsi lengkap produk"
                onChange={(e) => handleChange("deskripsi", e.target.value)}
              />
            </div>

            {/* HARGA */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-field-group">
                <label className="form-label">
                  <span className="label-icon">💰</span>
                  Harga Coret
                </label>
                <InputNumber
                  className="w-full form-input"
                  value={Number(form.harga_coret)}
                  onValueChange={(e) => handleChange("harga_coret", e.value)}
                  placeholder="Harga sebelum diskon"
                  mode="currency"
                  currency="IDR"
                  locale="id-ID"
                />
              </div>
              <div className="form-field-group">
                <label className="form-label">
                  <span className="label-icon">💵</span>
                  Harga Asli <span className="required">*</span>
                </label>
                <InputNumber
                  className="w-full form-input"
                  value={Number(form.harga_asli)}
                  onValueChange={(e) => handleChange("harga_asli", e.value)}
                  placeholder="Harga setelah diskon"
                  mode="currency"
                  currency="IDR"
                  locale="id-ID"
                />
              </div>
            </div>

            {/* TANGGAL EVENT */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">📅</span>
                Tanggal Event
              </label>
              <Calendar
                className="w-full form-input"
                showTime
                value={form.tanggal_event ? new Date(form.tanggal_event) : null}
                onChange={(e) => handleChange("tanggal_event", e.value)}
                placeholder="Pilih tanggal event"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Gallery */}
        <div className="form-section-card">
          <div className="section-header">
            <h3 className="section-title">🖼️ Gallery Produk</h3>
            <p className="section-description">Tambah gambar produk dengan caption</p>
          </div>
          <div className="section-content">
            {form.gambar.map((g, i) => (
              <div key={i} className="gallery-item-card">
                <div className="gallery-item-header">
                  <span className="gallery-item-number">Gambar {i + 1}</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {/* Tombol hapus dari server (jika gambar sudah ada di server) */}
                    {g.path?.type === "url" && g.path.value && (
                      <Button
                        icon="pi pi-server"
                        severity="danger"
                        className="p-button-danger p-button-sm"
                        onClick={() => deleteGalleryImage(i)}
                        tooltip="Hapus Gambar"
                        tooltipOptions={{ position: "top" }}
                      />
                    )}
                  </div>
                </div>
                <div className="gallery-item-content">
                  <div className="form-field-group">
                    <label className="form-label-small">Upload Gambar</label>
                    {g.path?.type === "url" && g.path.value && (
                      <div className="file-preview">
                        <img 
                          src={buildImageUrl(g.path.value)} 
                          alt={`Current ${i + 1}`}
                          className="preview-thumbnail"
                        />
                        <p className="field-hint">Gambar saat ini</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        updateArrayItem("gambar", i, "path", { type: "file", value: e.target.files[0] })
                      }
                      className="file-input"
                    />
                    {g.path?.type === "file" && g.path.value && (
                      <div className="file-preview">
                        <img 
                          src={URL.createObjectURL(g.path.value)} 
                          alt={`Preview ${i + 1}`}
                          className="preview-thumbnail"
                        />
                      </div>
                    )}
                  </div>
                  <div className="form-field-group">
                    <label className="form-label-small">Caption</label>
                    <InputText
                      className="w-full form-input"
                      placeholder="Masukkan caption gambar"
                      value={g.caption}
                      onChange={(e) => updateArrayItem("gambar", i, "caption", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              icon="pi pi-plus"
              label="Tambah Gambar"
              className="add-item-btn"
              onClick={() => addArray("gambar", { path: { type: "file", value: null }, caption: "" })}
            />
          </div>
        </div>

        {/* SECTION 4: Testimoni */}
        <div className="form-section-card">
          <div className="section-header">
            <h3 className="section-title">⭐ Testimoni</h3>
            <p className="section-description">Tambah testimoni dari pembeli</p>
          </div>
          <div className="section-content">
            {form.testimoni.map((t, i) => (
              <div key={i} className="testimoni-item-card">
                <div className="testimoni-item-header">
                  <span className="testimoni-item-number">Testimoni {i + 1}</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {/* Tombol hapus dari server (jika testimoni sudah ada di server) */}
                    {t.gambar?.type === "url" && t.gambar.value && (
                      <Button
                        icon="pi pi-server"
                        severity="danger"
                        className="p-button-danger p-button-sm"
                        onClick={() => deleteTestimoni(i)}
                        tooltip="Hapus dari server"
                        tooltipOptions={{ position: "top" }}
                      />
                    )}
                    {/* Tombol hapus dari form (lokal) */}
                    <Button
                      icon="pi pi-trash"
                      severity="secondary"
                      className="p-button-secondary p-button-sm"
                      onClick={() => removeArray("testimoni", i)}
                      tooltip="Hapus dari form"
                      tooltipOptions={{ position: "top" }}
                    />
                  </div>
                </div>
                <div className="testimoni-item-content">
                  <div className="form-field-group">
                    <label className="form-label-small">Upload Foto</label>
                    {t.gambar?.type === "url" && t.gambar.value && (
                      <div className="file-preview">
                        <img 
                          src={buildImageUrl(t.gambar.value)} 
                          alt={`Current Testimoni ${i + 1}`}
                          className="preview-thumbnail"
                        />
                        <p className="field-hint">Foto saat ini</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        updateArrayItem("testimoni", i, "gambar", { type: "file", value: e.target.files[0] })
                      }
                      className="file-input"
                    />
                    {t.gambar?.type === "file" && t.gambar.value && (
                      <div className="file-preview">
                        <img 
                          src={URL.createObjectURL(t.gambar.value)} 
                          alt={`Testimoni ${i + 1}`}
                          className="preview-thumbnail"
                        />
                      </div>
                    )}
                  </div>
                  <div className="form-field-group">
                    <label className="form-label-small">Nama</label>
                    <InputText
                      className="w-full form-input"
                      placeholder="Masukkan nama testimoni"
                      value={t.nama}
                      onChange={(e) => updateArrayItem("testimoni", i, "nama", e.target.value)}
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="form-label-small">Deskripsi</label>
                    <InputTextarea
                      className="w-full form-input"
                      rows={3}
                      placeholder="Masukkan deskripsi testimoni"
                      value={t.deskripsi}
                      onChange={(e) => updateArrayItem("testimoni", i, "deskripsi", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              icon="pi pi-plus"
              label="Tambah Testimoni"
              className="add-item-btn"
              onClick={() =>
                addArray("testimoni", { gambar: { type: "file", value: null }, nama: "", deskripsi: "" })
              }
            />
          </div>
        </div>

        {/* SECTION 5: Konten Tambahan */}
        <div className="form-section-card">
          <div className="section-header">
            <h3 className="section-title">🎬 Konten Tambahan</h3>
            <p className="section-description">Video, list point, dan konten pendukung</p>
          </div>
          <div className="section-content">
            {/* VIDEO */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">🎥</span>
                Video (URL, pisahkan dengan koma)
              </label>
              <InputTextarea
                className="w-full form-input"
                rows={3}
                value={form.video}
                placeholder="https://youtube.com/watch?v=..., https://youtube.com/watch?v=..."
                onChange={(e) => handleChange("video", e.target.value)}
              />
              <p className="field-hint">Masukkan URL video YouTube, pisahkan dengan koma jika lebih dari satu</p>
            </div>

            {/* LIST POINT */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">✅</span>
                List Point (Benefit)
              </label>
              {form.list_point.map((p, i) => (
                <div key={i} className="list-point-item">
                  <div className="list-point-number">{i + 1}</div>
                  <InputText
                    className="flex-1 form-input"
                    value={p.nama}
                    placeholder={`Point ${i + 1}`}
                    onChange={(e) => updateArrayItem("list_point", i, "nama", e.target.value)}
                  />
                  <Button 
                    icon="pi pi-trash" 
                    severity="danger" 
                    className="p-button-danger p-button-sm"
                    onClick={() => removeArray("list_point", i)}
                  />
                </div>
              ))}
              <Button
                icon="pi pi-plus"
                label="Tambah List Point"
                className="add-item-btn"
                onClick={() => addArray("list_point", { nama: "" })}
              />
            </div>
          </div>
        </div>

        {/* SECTION 6: Form Fields */}
        <section className="preview-form space-y-4 mt-6" aria-label="Order form">
          <h2 className="font-semibold text-lg">Informasi Dasar</h2>

          {[
            { label: "Nama", key: "nama", placeholder: "Nama lengkap Anda" },
            { label: "Nomor WhatsApp", key: "wa", placeholder: "08xxxxxxxxxx" },
            { label: "Email", key: "email", placeholder: "email@example.com" },
          ].map((field, i) => (
            <div 
              key={i}
              className="p-4 border border-gray-200 rounded-xl bg-gray-50 shadow-sm"
            >
              <br></br>
              <label className="font-medium text-gray-700">{field.label}</label>
              <input
                type="text"
                placeholder={field.placeholder}
                className="w-full p-3 border border-gray-300 rounded-xl mt-2 focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
                disabled
              />
            </div>
          ))}

          {/* ALAMAT */}
          <div className="space-y-2 p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
            <br></br>
            <label className="block text-sm font-semibold text-gray-700">
              Alamat
            </label>
            <textarea
              placeholder="Alamat lengkap"
              className="w-full p-3 border border-gray-300 rounded-xl mt-2 focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
              rows={3}
              disabled
            />
          </div>
        </section>

        {/* SECTION 7: Custom Fields */}
        <div className="form-section-card">
          <div className="section-header">
            <h3 className="section-title">🔧 Custom Fields</h3>
            <p className="section-description">Tambah field tambahan untuk form pembeli</p>
          </div>
          <div className="section-content">
            {form.custom_field.map((f, i) => (
              <div key={i} className="custom-field-item-card">
                <div className="custom-field-header">
                  <span className="custom-field-number">Field {i + 1}</span>
                  {!f.required && (
                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      className="p-button-danger p-button-sm"
                      onClick={() => removeArray("custom_field", i)}
                    />
                  )}
                </div>
                <div className="custom-field-content">
                  <div className="form-field-group">
                    <label className="form-label-small">Nama Field</label>
                    <InputText
                      className="w-full form-input"
                      value={f.label}
                      placeholder="Contoh: Nomor HP, Instansi, dll"
                      onChange={(e) => updateArrayItem("custom_field", i, "label", e.target.value)}
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="form-label-small">Placeholder / Contoh</label>
                    <InputText
                      className="w-full form-input"
                      value={f.value}
                      placeholder={(f.label || "Contoh isian") + (f.required ? " *" : "")}
                      onChange={(e) => updateArrayItem("custom_field", i, "value", e.target.value)}
                    />
                  </div>
                  <div className="custom-field-required">
                    <input
                      type="checkbox"
                      id={`required-${i}`}
                      checked={f.required}
                      onChange={(e) => updateArrayItem("custom_field", i, "required", e.target.checked)}
                    />
                    <label htmlFor={`required-${i}`} className="checkbox-label">
                      Field wajib diisi
                    </label>
                  </div>
                </div>
              </div>
            ))}
            <Button
              icon="pi pi-plus"
              label="Tambah Custom Field"
              className="add-item-btn"
              onClick={() => addArray("custom_field", { key: "", label: "", value: "", required: false })}
            />
          </div>
        </div>

        {/* SECTION 8: Pengaturan */}
        <div className="form-section-card">
          <div className="section-header">
            <h3 className="section-title">⚙️ Pengaturan</h3>
            <p className="section-description">Assign user, landing page, dan status produk</p>
          </div>
          <div className="section-content">
            {/* CREATED BY - Read Only */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">👤</span>
                Dibuat Oleh (Created By)
              </label>
              <div className="created-by-display">
                <div className="user-avatar">
                  {(createdByUser?.nama || createdByUser?.name || "U").charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <span className="user-name">{createdByUser?.nama || createdByUser?.name || "User tidak diketahui"}</span>
                  <span className="user-email">{createdByUser?.email || "-"}</span>
                </div>
              </div>
              <p className="field-hint">User yang membuat produk ini</p>
            </div>

            {/* ASSIGN BY - Penanggung Jawab */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">👥</span>
                Penanggung Jawab (Assign By)
              </label>
              <MultiSelect
                className="w-full form-input"
                value={form.assign}
                options={userOptions}
                onChange={(e) => handleChange("assign", e.value || [])}
                placeholder="Pilih penanggung jawab produk"
                display="chip"
                showClear
                filter
                filterPlaceholder="Cari user..."
              />
              <p className="field-hint">Pilih user yang bertanggung jawab menangani produk ini</p>
            </div>

            {/* LANDING PAGE */}
            <div className="form-field-group">
              <label className="form-label">
                <span className="label-icon">🌐</span>
                Landing Page
              </label>
              <InputText
                className="w-full form-input"
                value={form.landingpage || "1"}
                onChange={(e) => handleChange("landingpage", e.target.value)}
                placeholder="Masukkan nama landing page atau kode"
              />
              <p className="field-hint">Default: 1</p>
            </div>

            {/* STATUS */}
            <div className="status-card">
              <div className="status-content">
                <div className="status-info">
                  <label className="form-label">
                    <span className="label-icon">🔘</span>
                    Status Produk
                  </label>
                  <p className="status-indicator">
                    {form.status === 1 ? (
                      <span className="status-active">● Aktif</span>
                    ) : (
                      <span className="status-inactive">○ Tidak Aktif</span>
                    )}
                  </p>
                </div>
                <InputSwitch 
                  checked={form.status === 1} 
                  onChange={(e) => handleChange("status", e.value ? 1 : 0)} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="submit-section">
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <Button 
              label="Update Produk" 
              icon="pi pi-save"
              className="p-button-primary submit-btn" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            />
            <Button 
              label="Hapus Produk" 
              icon="pi pi-trash"
              className="p-button-danger" 
              onClick={deleteProduct}
              disabled={isSubmitting}
            />
          </div>
          <p className="submit-hint">Pastikan semua data sudah lengkap sebelum mengupdate</p>
        </div>
      </div>
        {/* ================= RIGHT: PREVIEW ================= */}
        <div className="builder-preview-card">
          <LandingTemplate form={form} />
        </div>
      </div>
    </>
  );
}
