"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Script from "next/script";
import Head from "next/head";
import { 
  CheckCircle2, Circle, Minus, ArrowRight, ArrowRightCircle,
  ArrowLeft as ArrowLeftIcon, ArrowLeftRight, ChevronRight, CheckSquare, ShieldCheck,
  Lock, Dot, Target, Link as LinkIcon, PlusCircle, MinusCircle,
  Check, Star, Heart, ThumbsUp, Award, Zap, Flame, Sparkles,
  ArrowUp, ArrowDown, ArrowUpCircle, ArrowDownCircle, PlayCircle,
  PauseCircle, StopCircle, Radio, Square, Hexagon, Triangle,
  AlertCircle, Info, HelpCircle as HelpCircleIcon, Ban, Shield, Key, Unlock,
  MapPin, Calendar as CalendarIcon, Clock
} from "lucide-react";
import OngkirCalculator from "@/components/OngkirCalculator";
import ImageSliderPreview from "@/app/sales/products/addProducts3/components/ImageSliderPreview";
import QuotaInfoPreview from "@/app/sales/products/addProducts3/components/QuotaInfoPreview";
import { getProvinces, getCities, getDistricts, calculateDomesticCost } from "@/utils/shippingService";
import "@/styles/sales/add-products3.css"; // Canvas style
import "@/styles/ongkir.css";

// FAQ Component
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="faq-item">
      <button 
        className="faq-question" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <span className="faq-icon">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && (
        <div className="faq-answer">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

// ✅ Countdown Component - GENERAL: Styling sesuai gambar (minimalis, dark grey boxes)
function CountdownComponent({ data = {}, componentId, containerStyle = {} }) {
  const hours = data.hours !== undefined ? data.hours : 0;
  const minutes = data.minutes !== undefined ? data.minutes : 0;
  const seconds = data.seconds !== undefined ? data.seconds : 0;
  // ✅ GENERAL: Warna tetap dark grey dan white untuk konsistensi dengan gambar
  const bgColor = data.bgColor || "#374151"; // Dark grey default
  const textColor = data.textColor || "#ffffff"; // White text default
  
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const intervalRef = useRef(null);

  const getTotalSeconds = () => (hours * 3600) + (minutes * 60) + seconds;

  useEffect(() => {
    const totalSeconds = getTotalSeconds();
    if (totalSeconds <= 0) return;

    const storageKey = `countdown_${componentId || 'default'}`;
    const savedEndTime = localStorage.getItem(storageKey);
    const now = Date.now();
    
    let endTime;
    if (savedEndTime) {
      const savedTime = parseInt(savedEndTime);
      const elapsed = now - savedTime;
      const remaining = (totalSeconds * 1000) - elapsed;
      if (remaining > 0) {
        endTime = savedTime + (totalSeconds * 1000);
      } else {
        endTime = now + (totalSeconds * 1000);
        localStorage.setItem(storageKey, now.toString());
      }
    } else {
      endTime = now + (totalSeconds * 1000);
      localStorage.setItem(storageKey, now.toString());
    }
    
    const updateTimeLeft = (endTime) => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      if (remaining <= 0) {
        const newEndTime = Date.now() + (totalSeconds * 1000);
        localStorage.setItem(storageKey, Date.now().toString());
        updateTimeLeft(newEndTime);
        return;
      }
      const hrs = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((remaining % (1000 * 60)) / 1000);
      setTimeLeft({ hours: hrs, minutes: mins, seconds: secs });
    };
    
    updateTimeLeft(endTime);
    
    intervalRef.current = setInterval(() => {
      const savedEndTime = localStorage.getItem(storageKey);
      if (!savedEndTime) {
        const newEndTime = Date.now() + (totalSeconds * 1000);
        localStorage.setItem(storageKey, Date.now().toString());
        updateTimeLeft(newEndTime);
        return;
      }
      const startTime = parseInt(savedEndTime);
      const endTime = startTime + (totalSeconds * 1000);
      updateTimeLeft(endTime);
    }, 1000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hours, minutes, seconds, componentId]);

  const formatTime = (time) => ({
    hours: String(time.hours).padStart(2, '0'),
    minutes: String(time.minutes).padStart(2, '0'),
    seconds: String(time.seconds).padStart(2, '0')
  });

  const formattedTime = formatTime(timeLeft);

  const renderNumber = (value, label) => {
    // ✅ GENERAL: Styling sesuai gambar - dark grey box dengan white text, rounded corners
    // Menggunakan bgColor dan textColor dari props untuk konsistensi
    const boxStyle = {
      backgroundColor: bgColor, // Dark grey (#374151) atau dari props
      borderRadius: "8px", // Slightly rounded corners
      padding: "16px 24px",
      minWidth: "80px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "none", // Clean, minimal shadow
    };

    const numberStyle = {
      fontSize: "48px",
            fontWeight: "bold",
      color: textColor, // White (#ffffff) atau dari props
            fontFamily: "monospace",
            lineHeight: "1",
      margin: 0,
    };

    const labelStyle = {
      fontSize: "14px",
      color: "#374151", // Dark grey untuk label (tetap konsisten)
      fontWeight: "500",
      marginTop: "8px",
      textAlign: "center",
    };

      return (
      <div style={boxStyle}>
        <div style={numberStyle}>{value}</div>
        {label && <div style={labelStyle}>{label}</div>}
        </div>
      );
  };

  // Extract only padding and margin from containerStyle, exclude background
  const { backgroundColor, backgroundImage, ...safeContainerStyle } = containerStyle || {};

  return (
    <div style={{ 
      padding: "24px", 
      backgroundColor: "transparent",
      borderRadius: "12px",
      textAlign: "center",
      ...safeContainerStyle // Only use padding, margin, etc. - no background
    }}>
      {/* ✅ Container untuk countdown boxes dengan colon separator */}
      <div style={{ 
        display: "flex", 
        gap: "12px", 
        justifyContent: "center",
        alignItems: "flex-start", // Align ke atas agar label sejajar
        flexWrap: "wrap"
      }}>
        {/* Hours box dengan label - setiap card punya card sendiri */}
        {renderNumber(formattedTime.hours, "Jam")}
        
        {/* Colon separator */}
        <span style={{ 
          fontSize: "32px", 
          color: "#374151", 
          fontWeight: "bold",
          marginTop: "16px", // Align dengan angka
          lineHeight: "48px" // Match dengan tinggi angka
        }}>:</span>
        
        {/* Minutes box dengan label - setiap card punya card sendiri */}
        {renderNumber(formattedTime.minutes, "Menit")}
        
        {/* Colon separator */}
        <span style={{ 
          fontSize: "32px", 
          color: "#374151", 
          fontWeight: "bold",
        marginTop: "16px",
          lineHeight: "48px"
        }}>:</span>
        
        {/* Seconds box dengan label - setiap card punya card sendiri */}
        {renderNumber(formattedTime.seconds, "Detik")}
      </div>
    </div>
  );
}

/**
 * ✅ NORMALISASI DATA BACKEND → FRONTEND (LEGACY DATA ONLY)
 * 
 * ARSITEKTUR FINAL:
 * - Section = relasi data, bukan container visual
 * - Child component WAJIB punya parentId di root level (dari backend)
 * - parentId harus sama dengan section.config.componentId
 * - TIDAK ada content.children di section (dihapus setelah normalisasi)
 * 
 * ⚠️ PENTING: Fungsi ini HANYA untuk legacy data yang masih menggunakan content.children
 * Jika backend sudah mengirim parentId langsung di child blocks, fungsi ini tidak melakukan apa-apa
 * 
 * FUNGSI INI:
 * 1. Membaca semua section dari landingpage
 * 2. Untuk setiap section, ambil content.children (jika ada - legacy data only)
 * 3. Jika content.children kosong → skip (backend sudah menggunakan parentId)
 * 4. Jika content.children ada → normalisasi ke parentId (legacy data)
 * 5. Hapus content.children dari section (cleanup)
 * 
 * RULE: Frontend TIDAK BOLEH menebak relasi. Jika parentId tidak ada → section memang kosong.
 */
function normalizeLandingpageData(landingpageData) {
  if (!Array.isArray(landingpageData)) {
    return landingpageData;
  }

  // ✅ Deep clone untuk menghindari mutasi
  const normalized = JSON.parse(JSON.stringify(landingpageData));

  // ✅ Step 1: Cari semua section dan ambil componentId-nya
  const sections = normalized.filter(item => item && item.type === 'section');
  
  console.log(`[NORMALIZER] Found ${sections.length} sections`);

  // ✅ Step 2: Hitung berapa banyak child blocks yang sudah punya parentId (dari backend)
  const blocksWithParentId = normalized.filter(b => b && b.parentId);
  console.log(`[NORMALIZER] Blocks with parentId (from backend): ${blocksWithParentId.length}`);

  sections.forEach(section => {
    const sectionComponentId = section.config?.componentId;
    
    if (!sectionComponentId) {
      console.warn(`[NORMALIZER] Section tanpa config.componentId, skip:`, section);
      return;
    }

    // ✅ Step 3: Cek apakah sudah ada child blocks dengan parentId (backend sudah benar)
    const existingChildren = normalized.filter(b => 
      b && b.type && b.parentId === sectionComponentId
    );
    
    if (existingChildren.length > 0) {
      console.log(`[NORMALIZER] Section "${sectionComponentId}" sudah punya ${existingChildren.length} children dengan parentId (from backend)`);
      // ✅ Cleanup: Hapus content.children jika ada (tidak digunakan lagi)
      if (section.content && section.content.children) {
        delete section.content.children;
      }
      return; // ✅ Backend sudah benar, tidak perlu normalisasi
    }

    // ✅ Step 4: Legacy data - coba ambil content.children (jika ada)
    const sectionChildren = section.content?.children || [];
    
    if (!Array.isArray(sectionChildren) || sectionChildren.length === 0) {
      console.log(`[NORMALIZER] Section "${sectionComponentId}" tidak punya children (content.children kosong)`);
      console.log(`[NORMALIZER] ⚠️ Backend tidak mengirim parentId di child blocks → section akan kosong`);
      // ✅ Cleanup: Hapus content.children yang kosong
      if (section.content) {
        delete section.content.children;
      }
      return; // ✅ Tidak ada data, tidak perlu normalisasi
    }

    // ✅ Step 5: Legacy data - normalisasi content.children ke parentId
    console.log(`[NORMALIZER] ⚠️ Legacy data detected: Section "${sectionComponentId}" punya ${sectionChildren.length} children di content.children`);
    console.log(`[NORMALIZER] Normalizing legacy data to parentId architecture...`);

    sectionChildren.forEach((childRef, childIndex) => {
      let childBlock = null;

      // ✅ Case 1: childRef adalah object lengkap dengan type
      if (typeof childRef === 'object' && childRef !== null && childRef.type) {
        const childComponentId = childRef.config?.componentId || childRef.componentId;
        const childOrder = childRef.order;
        
        childBlock = normalized.find(b => {
          if (!b || b.type === 'section' || b.type === 'settings') return false;
          if (childComponentId && b.config?.componentId === childComponentId) return true;
          if (childOrder && b.order === childOrder) return true;
          return false;
        });
      }
      // ✅ Case 2: childRef adalah ID (string atau number)
      else if (typeof childRef === 'string' || typeof childRef === 'number') {
        const childId = String(childRef);
        childBlock = normalized.find(b => {
          if (!b || b.type === 'section' || b.type === 'settings') return false;
          return b.config?.componentId === childId || String(b.order) === childId;
        });
      }

      // ✅ Step 6: Tambahkan parentId ke child block (di root level)
      if (childBlock) {
        if (childBlock.parentId && childBlock.parentId !== sectionComponentId) {
          console.warn(`[NORMALIZER] Child block sudah punya parentId berbeda:`, {
            childBlockId: childBlock.config?.componentId || childBlock.order,
            existingParentId: childBlock.parentId,
            newParentId: sectionComponentId
          });
        } else {
          childBlock.parentId = sectionComponentId;
          console.log(`[NORMALIZER] ✅ Added parentId "${sectionComponentId}" to child (legacy):`, {
            childType: childBlock.type,
            childComponentId: childBlock.config?.componentId || childBlock.order
          });
        }
      } else {
        console.warn(`[NORMALIZER] ⚠️ Child tidak ditemukan di landingpage:`, childRef);
      }
    });

    // ✅ Step 7: Cleanup - Hapus content.children dari section (tidak digunakan lagi)
    if (section.content) {
      delete section.content.children;
    }
  });

  const finalBlocksWithParentId = normalized.filter(b => b && b.parentId).length;
  console.log(`[NORMALIZER] ✅ Normalization complete. Blocks with parentId: ${finalBlocksWithParentId}`);

  return normalized;
}

export default function ProductPage() {
  const { kode_produk } = useParams();
  const searchParams = useSearchParams();

  const [paymentMethod, setPaymentMethod] = useState("");
  const [productData, setProductData] = useState(null);
  const [landingpage, setLandingpage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testimoniIndices, setTestimoniIndices] = useState({});
  const [selectedBundling, setSelectedBundling] = useState(null); // State untuk bundling yang dipilih

  const sumber = searchParams.get("utm_sumber") || "website";

  const [customerForm, setCustomerForm] = useState({
    nama: "",
    wa: "",
    email: "",
    alamat: "",
    custom_value: [],
  });

  const [ongkir, setOngkir] = useState(0);
  const [ongkirInfo, setOngkirInfo] = useState({ courier: '', service: '' });
  const [ongkirAddress, setOngkirAddress] = useState({
    provinsi: "",
    kota: "",
    kabupaten: "",
    kecamatan: "",
    kelurahan: "",
    kode_pos: "",
  });
  const [alamatLengkap, setAlamatLengkap] = useState("");
  
  // State untuk form wilayah (untuk produk fisik)
  const [formWilayah, setFormWilayah] = useState({
    provinsi: "",
    kabupaten: "",
    kecamatan: "",
    kode_pos: "",
  });
  
  // State untuk dropdown wilayah (cascading)
  const [wilayahData, setWilayahData] = useState({
    provinces: [],
    cities: [],
    districts: []
  });
  
  const [selectedWilayahIds, setSelectedWilayahIds] = useState({
    provinceId: "",
    cityId: "",
    districtId: ""
  });
  
  const [loadingWilayah, setLoadingWilayah] = useState({
    provinces: false,
    cities: false,
    districts: false
  });
  
  const [selectedCourier, setSelectedCourier] = useState("jne");
  const [costResults, setCostResults] = useState([]);
  const [loadingCost, setLoadingCost] = useState(false);
  
  // Courier options
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
  
  const ORIGIN_DISTRICT_ID = 6204; // Kelapa Dua, Kabupaten Tangerang
  const DEFAULT_WEIGHT = 1000; // 1kg dalam gram

  const formatPrice = (price) => {
    if (!price) return "0";
    const numPrice = typeof price === "string" ? parseInt(price.replace(/[^\d]/g, "")) : price;
    return (isNaN(numPrice) ? 0 : numPrice).toLocaleString("id-ID");
  };

  const getKategoriId = () => {
    if (!productData) return null;
    const kategoriId = productData.kategori_id 
      || (productData.kategori_rel?.id ? Number(productData.kategori_rel.id) : null)
      || (productData.kategori ? Number(productData.kategori) : null);
    return kategoriId;
  };

  const isKategoriBuku = () => {
    const kategoriId = getKategoriId();
    return kategoriId === 4; // Kategori Buku (4)
  };

  // FAQ Mapping
  const getFAQByKategori = (kategoriId) => {
    const faqMap = {
      10: [
        { question: "Apa saja yang akan saya dapatkan jika membeli ebook ini?", answer: "Anda akan mendapatkan akses ke file ebook dalam format PDF yang dapat diunduh dan dibaca kapan saja, plus bonus materi tambahan jika tersedia." },
        { question: "Bagaimana cara mengakses ebook setelah pembelian?", answer: "Setelah pembayaran dikonfirmasi, Anda akan menerima email berisi link download dan akses ke member area untuk mengunduh ebook." },
        { question: "Apakah ebook bisa diunduh berkali-kali?", answer: "Ya, setelah pembelian, Anda memiliki akses seumur hidup dan dapat mengunduh ebook berkali-kali sesuai kebutuhan." },
        { question: "Apakah ebook bisa dibaca di semua perangkat?", answer: "Ya, ebook dalam format PDF dapat dibaca di smartphone, tablet, laptop, dan komputer dengan aplikasi PDF reader." },
        { question: "Apakah ada garansi untuk ebook yang dibeli?", answer: "Kami memberikan garansi kepuasan. Jika tidak puas dengan konten ebook, silakan hubungi customer service kami untuk bantuan." }
      ],
      11: [
        { question: "Apa saja yang akan saya dapatkan dari webinar ini?", answer: "Anda akan mendapatkan akses live webinar, rekaman lengkap yang dapat ditonton ulang, materi presentasi, dan sertifikat kehadiran." },
        { question: "Bagaimana cara mengikuti webinar?", answer: "Setelah pembayaran dikonfirmasi, Anda akan menerima email berisi link Zoom/meeting room dan jadwal webinar. Link akan dikirim 1 hari sebelum acara." },
        { question: "Apakah ada rekaman jika saya tidak bisa hadir live?", answer: "Ya, semua peserta akan mendapatkan akses ke rekaman webinar yang dapat ditonton ulang kapan saja setelah acara selesai." },
        { question: "Berapa lama akses rekaman webinar tersedia?", answer: "Akses rekaman webinar tersedia seumur hidup. Anda dapat menonton ulang kapan saja melalui member area." },
        { question: "Apakah saya bisa bertanya langsung kepada pembicara?", answer: "Ya, pada sesi live webinar akan ada waktu untuk tanya jawab langsung dengan pembicara melalui fitur Q&A atau chat." }
      ],
      12: [
        { question: "Apa saja yang akan saya dapatkan dari seminar ini?", answer: "Anda akan mendapatkan tiket masuk seminar, materi presentasi, sertifikat kehadiran, networking session, dan coffee break." },
        { question: "Di mana lokasi seminar akan dilaksanakan?", answer: "Lokasi seminar akan diinformasikan melalui email setelah pembayaran dikonfirmasi. Biasanya di hotel atau venue yang mudah dijangkau." },
        { question: "Apakah ada rekaman seminar yang bisa saya akses?", answer: "Tergantung kebijakan acara. Jika tersedia, rekaman akan dibagikan kepada peserta setelah seminar selesai melalui email." },
        { question: "Bagaimana jika saya tidak bisa hadir di tanggal yang ditentukan?", answer: "Silakan hubungi customer service kami untuk informasi refund atau transfer tiket ke peserta lain. Kebijakan dapat berbeda tergantung waktu pemberitahuan." },
        { question: "Apakah ada diskon untuk pembelian tiket grup?", answer: "Ya, tersedia diskon khusus untuk pembelian tiket grup minimal 5 orang. Hubungi customer service kami untuk informasi lebih lanjut." }
      ],
      13: [
        { question: "Apa saja yang akan saya dapatkan jika membeli buku ini?", answer: "Anda akan mendapatkan buku fisik berkualitas tinggi dengan konten lengkap dan terpercaya, plus akses ke materi tambahan jika tersedia." },
        { question: "Berapa lama waktu pengiriman buku?", answer: "Waktu pengiriman bervariasi tergantung lokasi Anda. Untuk wilayah Jabodetabek biasanya 2-3 hari kerja, sedangkan luar kota 3-7 hari kerja." },
        { question: "Apakah buku ini tersedia dalam format digital?", answer: "Saat ini buku tersedia dalam format fisik. Format digital akan diinformasikan lebih lanjut jika tersedia." },
        { question: "Bagaimana cara menghitung ongkos kirim?", answer: "Ongkos kirim akan dihitung otomatis berdasarkan alamat pengiriman Anda. Anda dapat melihat estimasi ongkir setelah memasukkan alamat lengkap." },
        { question: "Apakah ada garansi untuk buku yang dibeli?", answer: "Kami memberikan garansi untuk buku yang rusak atau cacat saat pengiriman. Silakan hubungi customer service kami jika mengalami masalah." }
      ],
      14: [
        { question: "Apa saja yang akan saya dapatkan dari ecourse ini?", answer: "Anda akan mendapatkan akses ke semua modul pembelajaran, video tutorial, materi download, quiz, sertifikat, dan akses ke komunitas eksklusif." },
        { question: "Berapa lama akses ke ecourse tersedia?", answer: "Akses ke ecourse tersedia seumur hidup. Anda dapat belajar kapan saja dan mengulang materi sesuai kebutuhan." },
        { question: "Apakah ada support atau mentoring selama belajar?", answer: "Ya, tersedia support melalui grup komunitas, email, atau sesi Q&A berkala dengan instruktur untuk membantu proses pembelajaran Anda." },
        { question: "Apakah ecourse bisa diakses dari mobile?", answer: "Ya, platform ecourse kami mobile-friendly dan dapat diakses melalui smartphone, tablet, atau laptop dengan koneksi internet." },
        { question: "Apakah ada ujian atau sertifikat setelah menyelesaikan ecourse?", answer: "Ya, setelah menyelesaikan semua modul dan quiz, Anda akan mendapatkan sertifikat kelulusan yang dapat diunduh dan dicetak." }
      ],
      15: [
        { question: "Apa saja yang akan saya dapatkan dari workshop ini?", answer: "Anda akan mendapatkan materi lengkap, sertifikat, akses ke recording, dan komunitas eksklusif peserta workshop." },
        { question: "Apakah workshop ini cocok untuk pemula?", answer: "Ya, workshop ini dirancang untuk semua level, termasuk pemula. Materi akan disampaikan secara bertahap dan mudah dipahami." },
        { question: "Bagaimana sistem pembayaran untuk workshop?", answer: "Anda dapat melakukan pembayaran penuh atau menggunakan sistem down payment (uang muka) terlebih dahulu, kemudian melunasi sebelum workshop dimulai." },
        { question: "Apakah ada rekaman workshop yang bisa saya akses nanti?", answer: "Ya, semua peserta akan mendapatkan akses ke rekaman workshop yang dapat ditonton ulang kapan saja." },
        { question: "Bagaimana jika saya tidak bisa hadir di tanggal yang ditentukan?", answer: "Anda tetap bisa mengikuti workshop melalui rekaman yang akan diberikan. Namun, untuk interaksi langsung, disarankan hadir sesuai jadwal." }
      ],
      16: [
        { question: "Apa saja yang akan saya dapatkan dari private mentoring ini?", answer: "Anda akan mendapatkan sesi mentoring one-on-one dengan mentor berpengalaman, personalized action plan, follow-up support, dan akses ke materi eksklusif." },
        { question: "Berapa kali sesi mentoring yang akan saya dapatkan?", answer: "Jumlah sesi mentoring tergantung paket yang dipilih. Detail lengkap akan diinformasikan setelah pembayaran dikonfirmasi." },
        { question: "Bagaimana cara menjadwalkan sesi mentoring?", answer: "Setelah pembayaran dikonfirmasi, tim kami akan menghubungi Anda untuk mengatur jadwal sesi mentoring yang sesuai dengan waktu luang Anda." },
        { question: "Apakah sesi mentoring dilakukan online atau offline?", answer: "Tersedia pilihan online (via Zoom/Google Meet) atau offline (jika memungkinkan). Detail akan dibahas saat konfirmasi jadwal." },
        { question: "Apakah ada follow-up setelah sesi mentoring selesai?", answer: "Ya, tersedia follow-up support melalui email atau grup komunitas untuk memastikan Anda dapat menerapkan ilmu yang didapat." }
      ]
    };

    return faqMap[kategoriId] || [
      { question: "Apa saja yang akan saya dapatkan dari produk ini?", answer: "Anda akan mendapatkan akses penuh ke semua fitur dan konten yang tersedia dalam paket produk ini." },
      { question: "Bagaimana cara menggunakan produk ini?", answer: "Setelah pembayaran dikonfirmasi, Anda akan mendapatkan panduan lengkap dan akses ke platform produk." },
      { question: "Apakah ada garansi untuk produk ini?", answer: "Kami memberikan garansi kepuasan. Jika tidak puas, silakan hubungi customer service kami untuk bantuan." },
      { question: "Bagaimana sistem pembayarannya?", answer: "Pembayaran dapat dilakukan melalui berbagai metode yang tersedia. Setelah pembayaran dikonfirmasi, akses akan segera diberikan." },
      { question: "Apakah ada dukungan setelah pembelian?", answer: "Ya, tim customer service kami siap membantu Anda selama menggunakan produk ini. Hubungi kami kapan saja jika ada pertanyaan." }
    ];
  };

  const generateAlamatLengkap = (alamatDasar, addressDetail) => {
    const parts = [];
    if (alamatDasar && alamatDasar.trim()) {
      parts.push(alamatDasar.trim());
    }
    if (addressDetail.kecamatan && addressDetail.kecamatan.trim()) {
      parts.push(`kec. ${addressDetail.kecamatan.trim()}`);
    }
    if (addressDetail.kelurahan && addressDetail.kelurahan.trim()) {
      parts.push(`kel/kab. ${addressDetail.kelurahan.trim()}`);
    }
    if (addressDetail.kode_pos && addressDetail.kode_pos.trim()) {
      parts.push(`kode pos ${addressDetail.kode_pos.trim()}`);
    }
    const alamatFinal = parts.join(", ");
    setAlamatLengkap(alamatFinal);
  };

  // Helper untuk convert YouTube URL ke embed URL
  const convertToEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes("/embed/")) return url;
    if (url.includes("watch?v=")) {
      const videoId = url.split("watch?v=")[1]?.split("&")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    return url;
  };

  // ✅ FUNGSI HELPER: Clean HTML content - remove inline font-family styles using regex
  const cleanHTMLContent = (html) => {
    if (!html) return html;
    
    // Remove font-family from inline style attributes using regex
    return html.replace(
      /style\s*=\s*["']([^"']*)["']/gi,
      (match, styleContent) => {
        // Remove font-family declarations from style content
        const cleanedStyle = styleContent
          .replace(/font-family\s*:\s*[^;'"]+(?:['"][^'"]*['"])?;?/gi, '')
          .replace(/;\s*;/g, ';')
          .replace(/^\s*;\s*|\s*;\s*$/g, '')
          .trim();
        
        if (cleanedStyle) {
          return `style="${cleanedStyle}"`;
        } else {
          return '';
        }
      }
    );
  };

  // ✅ FUNGSI HELPER: Convert style.text dari backend ke CSS text properties (GENERAL - otomatis baca semua field)
  const getTextStyles = (styleText = {}) => {
    const textStyles = {};
    
    // Font properties
    // ✅ SAMA dengan addProducts3: "Page Font" = "Inter, sans-serif", bukan "inherit"
    if (styleText.fontFamily) {
      textStyles.fontFamily = styleText.fontFamily !== "Page Font" 
        ? styleText.fontFamily 
        : "Inter, sans-serif"; // ✅ Default font sama dengan addProducts3
    }
    if (styleText.color !== undefined) textStyles.color = styleText.color;
    if (styleText.lineHeight !== undefined) textStyles.lineHeight = styleText.lineHeight;
    if (styleText.fontWeight !== undefined) textStyles.fontWeight = styleText.fontWeight;
    if (styleText.fontStyle !== undefined) textStyles.fontStyle = styleText.fontStyle;
    if (styleText.textDecoration !== undefined) textStyles.textDecoration = styleText.textDecoration;
    if (styleText.textTransform !== undefined) textStyles.textTransform = styleText.textTransform;
    if (styleText.letterSpacing !== undefined) textStyles.letterSpacing = `${styleText.letterSpacing}px`;
    if (styleText.backgroundColor !== undefined) {
      textStyles.backgroundColor = styleText.backgroundColor !== "transparent" ? styleText.backgroundColor : "transparent";
    }
    
    // Text alignment - handle "align" (dari backend) dan "textAlign" (legacy)
    if (styleText.align !== undefined) {
      textStyles.textAlign = styleText.align;
    } else if (styleText.alignment !== undefined) {
      textStyles.textAlign = styleText.alignment;
    } else if (styleText.textAlign !== undefined) {
      textStyles.textAlign = styleText.textAlign;
    }
    
    return textStyles;
  };

  // ✅ FUNGSI HELPER: Convert style.container dari backend ke CSS container properties (GENERAL - otomatis baca semua field)
  const getContainerStyles = (styleContainer = {}) => {
    const containerStyles = {};
    
    // Padding - handle nested (padding.top) dan flat (paddingTop)
    if (styleContainer.padding) {
      if (styleContainer.padding.top !== undefined) containerStyles.paddingTop = `${styleContainer.padding.top}px`;
      if (styleContainer.padding.right !== undefined) containerStyles.paddingRight = `${styleContainer.padding.right}px`;
      if (styleContainer.padding.bottom !== undefined) containerStyles.paddingBottom = `${styleContainer.padding.bottom}px`;
      if (styleContainer.padding.left !== undefined) containerStyles.paddingLeft = `${styleContainer.padding.left}px`;
    } else {
      if (styleContainer.paddingTop !== undefined) containerStyles.paddingTop = `${styleContainer.paddingTop}px`;
      if (styleContainer.paddingRight !== undefined) containerStyles.paddingRight = `${styleContainer.paddingRight}px`;
      if (styleContainer.paddingBottom !== undefined) containerStyles.paddingBottom = `${styleContainer.paddingBottom}px`;
      if (styleContainer.paddingLeft !== undefined) containerStyles.paddingLeft = `${styleContainer.paddingLeft}px`;
    }
    
    // Margin - handle nested (margin.top) dan flat (marginTop)
    if (styleContainer.margin) {
      if (styleContainer.margin.top !== undefined) containerStyles.marginTop = `${styleContainer.margin.top}px`;
      if (styleContainer.margin.right !== undefined) containerStyles.marginRight = `${styleContainer.margin.right}px`;
      if (styleContainer.margin.bottom !== undefined) containerStyles.marginBottom = `${styleContainer.margin.bottom}px`;
      if (styleContainer.margin.left !== undefined) containerStyles.marginLeft = `${styleContainer.margin.left}px`;
    } else {
      if (styleContainer.marginTop !== undefined) containerStyles.marginTop = `${styleContainer.marginTop}px`;
      if (styleContainer.marginRight !== undefined) containerStyles.marginRight = `${styleContainer.marginRight}px`;
      if (styleContainer.marginBottom !== undefined) containerStyles.marginBottom = `${styleContainer.marginBottom}px`;
      if (styleContainer.marginLeft !== undefined) containerStyles.marginLeft = `${styleContainer.marginLeft}px`;
    }
    
    // Background - handle nested (background.color) dan flat (bgColor)
    if (styleContainer.background) {
      if (styleContainer.background.type === "color" && styleContainer.background.color) {
        containerStyles.backgroundColor = styleContainer.background.color;
      } else if (styleContainer.background.type === "image" && styleContainer.background.image) {
        containerStyles.backgroundImage = `url(${styleContainer.background.image})`;
        containerStyles.backgroundSize = styleContainer.background.size || "cover";
        containerStyles.backgroundPosition = styleContainer.background.position || "center";
        containerStyles.backgroundRepeat = styleContainer.background.repeat || "no-repeat";
      }
    } else {
      if (styleContainer.bgColor) containerStyles.backgroundColor = styleContainer.bgColor;
      if (styleContainer.bgImage) containerStyles.backgroundImage = `url(${styleContainer.bgImage})`;
    }
    
    // Border - handle nested (border.width) dan flat
    if (styleContainer.border) {
      if (styleContainer.border.width) {
        containerStyles.border = `${styleContainer.border.width}px ${styleContainer.border.style || 'solid'} ${styleContainer.border.color || '#e5e7eb'}`;
      }
      if (styleContainer.border.radius !== undefined) {
        containerStyles.borderRadius = styleContainer.border.radius === "0px" || styleContainer.border.radius === "0" ? 0 : styleContainer.border.radius;
      }
    }
    
    // Shadow
    if (styleContainer.shadow !== undefined) {
      containerStyles.boxShadow = styleContainer.shadow === "none" ? "none" : styleContainer.shadow;
    }
    
    return containerStyles;
  };

  // Render Block berdasarkan struktur content/style/config - SAMA PERSIS dengan renderPreview di addProducts3
  const renderBlock = (block, allBlocks = []) => {
    if (!block || !block.type) return null;

    const { type, content, style, config } = block;
    
    // ✅ GENERAL: Otomatis baca semua field dari style.container dari backend
    const containerStyle = getContainerStyles(style?.container || {});
    
    // ✅ GENERAL: Otomatis baca semua field dari style.text dari backend
    const textStylesFromBackend = getTextStyles(style?.text || {});
    
    // Simulasi block.data dari content/style/config untuk kompatibilitas dengan renderPreview logic
    const blockData = {
      // Text data - menggunakan textStylesFromBackend yang sudah di-generate otomatis
      content: content?.html || content || "",
      textColor: style?.text?.color || "#000000",
      fontFamily: textStylesFromBackend.fontFamily || "Inter, sans-serif", // ✅ Default "Inter, sans-serif" sama dengan addProducts3
      lineHeight: style?.text?.lineHeight || 1.5,
      textAlign: textStylesFromBackend.textAlign || "left",
      fontWeight: style?.text?.fontWeight || "normal",
      fontStyle: style?.text?.fontStyle || "normal",
      textDecoration: style?.text?.textDecoration || "none",
      textTransform: style?.text?.textTransform || "none",
      letterSpacing: style?.text?.letterSpacing || 0,
      backgroundColor: style?.text?.backgroundColor || "transparent",
      paragraphStyle: config?.tag || config?.paragraphStyle || "div",
      bgType: style?.text?.background?.type || style?.text?.bgType || "none",
      bgColor: style?.text?.background?.color || style?.text?.bgColor || "#ffffff",
      bgImage: style?.text?.background?.image || style?.text?.bgImage || "",
      // Padding dari style.text atau fallback ke style.container
      paddingTop: style?.text?.padding?.top ?? style?.text?.paddingTop ?? style?.container?.padding?.top ?? style?.container?.paddingTop ?? 0,
      paddingRight: style?.text?.padding?.right ?? style?.text?.paddingRight ?? style?.container?.padding?.right ?? style?.container?.paddingRight ?? 0,
      paddingBottom: style?.text?.padding?.bottom ?? style?.text?.paddingBottom ?? style?.container?.padding?.bottom ?? style?.container?.paddingBottom ?? 0,
      paddingLeft: style?.text?.padding?.left ?? style?.text?.paddingLeft ?? style?.container?.padding?.left ?? style?.container?.paddingLeft ?? 0,
      
      // Image data
      src: content?.src || content?.url || "",
      alt: content?.alt || "",
      caption: content?.caption || "",
      alignment: style?.image?.alignment || style?.container?.alignment || "center", // ✅ Ambil dari style.image.alignment atau fallback
      imageWidth: style?.image?.width || style?.container?.imageWidth || 100, // ✅ Ambil dari style.image.width atau fallback
      imageFit: style?.image?.fit || style?.container?.imageFit || "fill", // ✅ Ambil dari style.image.fit atau fallback
      aspectRatio: style?.image?.aspectRatio || style?.container?.aspectRatio || "OFF", // ✅ Ambil dari style.image.aspectRatio atau fallback
      backgroundType: style?.container?.background?.type || style?.container?.backgroundType || "none", // ✅ Ambil dari style.container.background.type atau fallback
      backgroundColor: style?.container?.background?.color || style?.container?.backgroundColor || "#ffffff", // ✅ Ambil dari style.container.background.color atau fallback
      backgroundImage: style?.container?.background?.image || style?.container?.backgroundImage || "", // ✅ Ambil dari style.container.background.image atau fallback
      paddingTop: style?.image?.padding?.top || style?.container?.padding?.top || style?.image?.paddingTop || style?.container?.paddingTop || 0, // ✅ Untuk image padding
      paddingRight: style?.image?.padding?.right || style?.container?.padding?.right || style?.image?.paddingRight || style?.container?.paddingRight || 0,
      paddingBottom: style?.image?.padding?.bottom || style?.container?.padding?.bottom || style?.image?.paddingBottom || style?.container?.paddingBottom || 0,
      paddingLeft: style?.image?.padding?.left || style?.container?.padding?.left || style?.image?.paddingLeft || style?.container?.paddingLeft || 0,
      
      // Video data
      items: content?.items || [],
      videoWidth: style?.video?.width || style?.container?.videoWidth || 100, // ✅ Ambil dari style.video.width atau fallback
      alignment: style?.video?.alignment || style?.container?.alignment || "center", // ✅ Ambil dari style.video.alignment atau fallback
      paddingTop: style?.container?.padding?.top || style?.container?.paddingTop || 0, // ✅ Untuk video padding
      paddingRight: style?.container?.padding?.right || style?.container?.paddingRight || 0,
      paddingBottom: style?.container?.padding?.bottom || style?.container?.paddingBottom || 0,
      paddingLeft: style?.container?.padding?.left || style?.container?.paddingLeft || 0,
      
      // Testimoni data
      componentTitle: content?.componentTitle || config?.title || "",
      
      // List data
      icon: content?.icon || "CheckCircle2",
      iconColor: content?.iconColor || "#000000",
    };

    switch (type) {
      case "text": {
        const textData = blockData;
        
        // ✅ GENERAL: Gunakan textStylesFromBackend yang sudah di-generate otomatis dari style.text
        // Tambahkan default values untuk field yang tidak ada di backend
        const textStyles = {
          // fontSize removed - now handled by inline styles in HTML content (sama dengan addProducts3)
          lineHeight: textStylesFromBackend.lineHeight ?? textData.lineHeight ?? 1.5,
          fontFamily: textStylesFromBackend.fontFamily ?? (textData.fontFamily && textData.fontFamily !== "Page Font" ? textData.fontFamily : "Inter, sans-serif"), // ✅ Default "Inter, sans-serif" sama dengan addProducts3
          color: textStylesFromBackend.color ?? textData.textColor ?? "#000000",
          backgroundColor: textStylesFromBackend.backgroundColor ?? (textData.backgroundColor && textData.backgroundColor !== "transparent" ? textData.backgroundColor : "transparent"),
          textAlign: textStylesFromBackend.textAlign ?? textData.textAlign ?? "left", // ✅ PRIORITAS: dari backend (align) > fallback
          fontWeight: textStylesFromBackend.fontWeight ?? textData.fontWeight ?? "normal",
          fontStyle: textStylesFromBackend.fontStyle ?? textData.fontStyle ?? "normal",
          textDecoration: textStylesFromBackend.textDecoration ?? textData.textDecoration ?? "none",
          textTransform: textStylesFromBackend.textTransform ?? textData.textTransform ?? "none",
          letterSpacing: textStylesFromBackend.letterSpacing ?? (textData.letterSpacing ? `${textData.letterSpacing}px` : "0px"),
          padding: textData.backgroundColor && textData.backgroundColor !== "transparent" ? "8px 12px" : "0",
          borderRadius: textData.backgroundColor && textData.backgroundColor !== "transparent" ? "4px" : "0",
        };

        // Determine tag based on paragraph style
        const Tag = textData.paragraphStyle === "h1" ? "h1" :
                    textData.paragraphStyle === "h2" ? "h2" :
                    textData.paragraphStyle === "h3" ? "h3" : "div";

        // Background dari advance settings
        let textBackgroundStyle = {};
        if (textData.bgType === "color") {
          textBackgroundStyle.backgroundColor = textData.bgColor || "#ffffff";
        } else if (textData.bgType === "image" && textData.bgImage) {
          textBackgroundStyle.backgroundImage = `url(${textData.bgImage})`;
          textBackgroundStyle.backgroundSize = "cover";
          textBackgroundStyle.backgroundPosition = "center";
        }
        
        // Padding dari advance settings
        const textPaddingStyle = {
          paddingTop: `${textData.paddingTop || 0}px`,
          paddingRight: `${textData.paddingRight || 0}px`,
          paddingBottom: `${textData.paddingBottom || 0}px`,
          paddingLeft: `${textData.paddingLeft || 0}px`,
        };
        
        // Rich text content (HTML)
        const richContent = textData.content || "<p>Teks...</p>";
        
        // ✅ Clean HTML content - remove inline font-family
        const cleanedContent = cleanHTMLContent(richContent);
        
        return (
          <Tag 
            className="preview-text" 
            style={{
              ...textStyles,
              ...textBackgroundStyle,
              ...textPaddingStyle,
              display: "block",
              width: "100%"
            }}
            dangerouslySetInnerHTML={{ __html: cleanedContent }}
          />
        );
      }

      case "image": {
        const imageData = blockData;
        if (!imageData.src) {
          return <div className="preview-placeholder">Gambar belum diupload</div>;
        }

        // ✅ Advanced settings - SAMA PERSIS dengan renderPreview di addProducts3
        const alignment = imageData.alignment || "center";
        const imageWidth = imageData.imageWidth || 100;
        const imageFit = imageData.imageFit || "fill";
        const aspectRatio = imageData.aspectRatio || "OFF";
        const backgroundType = imageData.backgroundType || "none";
        const backgroundColor = imageData.backgroundColor || "#ffffff";
        const backgroundImage = imageData.backgroundImage || "";
        const paddingTop = imageData.paddingTop || 0; // ✅ Gunakan dari imageData (sudah diambil dari style di blockData)
        const paddingRight = imageData.paddingRight || 0;
        const paddingBottom = imageData.paddingBottom || 0;
        const paddingLeft = imageData.paddingLeft || 0;

        // Calculate aspect ratio - ketika dipilih, gambar akan di-crop sesuai ratio
        let aspectRatioStyle = {};
        if (aspectRatio !== "OFF") {
          const [width, height] = aspectRatio.split(":").map(Number);
          if (width && height) {
            aspectRatioStyle.aspectRatio = `${width} / ${height}`;
          }
        }

        // Background style
        let imageBackgroundStyle = {};
        if (backgroundType === "color") {
          imageBackgroundStyle.backgroundColor = backgroundColor;
        } else if (backgroundType === "image" && backgroundImage) {
          imageBackgroundStyle.backgroundImage = `url(${backgroundImage})`;
          imageBackgroundStyle.backgroundSize = "cover";
          imageBackgroundStyle.backgroundPosition = "center";
        }

        // ✅ Image fit style - SAMA PERSIS dengan renderPreview di addProducts3
        // Image fit style - jika aspect ratio dipilih, gunakan cover untuk crop
        // Jika aspect ratio OFF, gunakan fill atau contain sesuai pilihan
        let objectFitValue;
        if (aspectRatio !== "OFF") {
          // Ketika aspect ratio dipilih, gunakan cover untuk crop gambar
          // Cover akan memotong gambar agar mengisi frame sesuai aspect ratio
          objectFitValue = "cover";
        } else {
          // Ketika aspect ratio OFF, gunakan fill atau contain sesuai pilihan
          objectFitValue = imageFit === "fill" ? "fill" : imageFit === "fit" ? "contain" : "fill";
        }

        // Padding style
        const imagePaddingStyle = {
          paddingTop: `${paddingTop}px`,
          paddingRight: `${paddingRight}px`,
          paddingBottom: `${paddingBottom}px`,
          paddingLeft: `${paddingLeft}px`,
        };

        // ✅ Container style with alignment - SAMA PERSIS dengan renderPreview di addProducts3
        // Container ini untuk alignment (center/left/right) dan padding
        // JANGAN gunakan containerStyle dari getContainerStyles() karena akan override alignment
        const imageContainerStyle = {
          display: "flex",
          justifyContent: alignment === "left" ? "flex-start" : alignment === "right" ? "flex-end" : "center",
          width: "100%",
          ...imagePaddingStyle,
        };

        // ✅ Image wrapper style - ukuran akan berubah sesuai aspect ratio yang dipilih
        // Wrapper ini yang diatur width-nya (50%, 100%, dll) - gambar di dalam tetap 100% dari wrapper
        // ✅ GENERAL: Tambahkan max-width untuk membatasi ukuran maksimal gambar agar tidak terlalu besar
        const imageWrapperStyle = {
          width: `${imageWidth}%`, // ✅ Width setting (50%) = width dari wrapper, bukan gambar
          maxWidth: "625px", // ✅ Batasi ukuran maksimal (900px) agar tidak terlalu besar
          ...aspectRatioStyle,
          ...imageBackgroundStyle,
          overflow: "hidden",
          borderRadius: "4px",
          position: "relative",
        };
        
        // Ketika aspect ratio dipilih, wrapper akan otomatis memiliki tinggi sesuai ratio
        // CSS aspect-ratio akan menghitung tinggi berdasarkan lebar dan ratio

        return (
          <div style={imageContainerStyle}>
            <div style={imageWrapperStyle}>
              <img 
                src={imageData.src} 
                alt={imageData.alt || ""} 
                style={{
                  width: "100%", // ✅ Gambar selalu 100% dari wrapper (bukan dari setting)
                  height: "100%",
                  objectFit: objectFitValue,
                  objectPosition: "center",
                  display: "block",
                }}
              />
            </div>
            {imageData.caption && <p className="preview-caption">{imageData.caption}</p>}
          </div>
        );
      }

      case "youtube":
      case "video": {
        const videoItems = content?.items || [];
        if (videoItems.length === 0) {
          return <div className="preview-placeholder">Belum ada video</div>;
        }
        
        // ✅ Advanced settings untuk video - SAMA PERSIS dengan renderPreview di addProducts3
        const videoData = blockData || {};
        const videoAlignment = videoData.alignment || "center"; // ✅ Gunakan dari blockData
        const videoWidth = videoData.videoWidth !== undefined ? videoData.videoWidth : 100; // Default 100% jika belum di-set
        const videoPaddingTop = videoData.paddingTop || 0;
        const videoPaddingRight = videoData.paddingRight || 0;
        const videoPaddingBottom = videoData.paddingBottom || 0;
        const videoPaddingLeft = videoData.paddingLeft || 0;
        
        // Container style dengan alignment dan padding
        const videoContainerStyle = {
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          alignItems: "center",
          width: "100%",
          paddingTop: `${videoPaddingTop}px`,
          paddingRight: `${videoPaddingRight}px`,
          paddingBottom: `${videoPaddingBottom}px`,
          paddingLeft: `${videoPaddingLeft}px`,
        };
        
        // ✅ Video wrapper style - SAMA PERSIS dengan renderPreview di addProducts3
        const videoWrapperStyle = {
          width: `${videoWidth}%`,
          maxWidth: "100%", // ✅ Pastikan tidak melebihi container
          aspectRatio: "16 / 9",
          position: "relative",
          overflow: "hidden",
          borderRadius: "8px", // ✅ SAMA dengan addProducts3 (8px)
          display: "flex",
          justifyContent: videoAlignment === "left" ? "flex-start" : videoAlignment === "right" ? "flex-end" : "center",
        };
        
        return (
          <div className="preview-videos" style={videoContainerStyle}>
            {videoItems.map((item, i) => (
              item.embedUrl || (item.url ? convertToEmbedUrl(item.url) : null) ? (
                <div key={i} className="preview-video-wrapper" style={videoWrapperStyle}>
                  <iframe 
                    src={item.embedUrl || convertToEmbedUrl(item.url)} 
                    title={`Video ${i + 1}`} 
                    className="preview-video-iframe" 
                    allowFullScreen
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      borderRadius: "8px" // ✅ SAMA dengan addProducts3
                    }}
                  />
                </div>
              ) : null
            ))}
          </div>
        );
      }

      case "testimoni": {
        // ✅ SAMA PERSIS dengan renderPreview di addProducts3
        const testimoniItems = content?.items || [];
        if (testimoniItems.length === 0) {
          return <div className="preview-placeholder">Belum ada testimoni</div>;
        }
        
        // ✅ Gunakan config.componentId atau block.order untuk key testimoniIndices
        const testimoniKey = config?.componentId || block.order;
        const currentIndex = testimoniIndices[testimoniKey] || 0;
        const maxIndex = Math.max(0, testimoniItems.length - 3);
        
        const handlePrev = () => {
          setTestimoniIndices(prev => ({
            ...prev,
            [testimoniKey]: Math.max(0, currentIndex - 1)
          }));
        };
        
        const handleNext = () => {
          setTestimoniIndices(prev => ({
            ...prev,
            [testimoniKey]: Math.min(maxIndex, currentIndex + 1)
          }));
        };
        
        const testimoniTitle = content?.componentTitle || config?.title || "";
        
        return (
          <section className="preview-testimonials" aria-label="Customer testimonials">
            <h2 style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#000000",
              marginBottom: "20px",
              textAlign: "left"
            }}>{testimoniTitle}</h2>
            <div className="testimonials-carousel-wrapper-new">
              {currentIndex > 0 && (
                <button 
                  className="testimoni-nav-btn-new testimoni-nav-prev-new"
                  onClick={handlePrev}
                  aria-label="Previous testimonials"
                >
                  ‹
                </button>
              )}
              <div className="testimonials-carousel-new" itemScope itemType="https://schema.org/Review">
                <div 
                  className="testimonials-track-new"
                  style={{ transform: `translateX(-${currentIndex * 32}%)` }}
                >
                  {testimoniItems.map((item, i) => {
                    return (
                      <article key={i} className="testi-card-new" itemScope itemType="https://schema.org/Review">
                        <div className="testi-header-new">
                          {item.gambar ? (
                            <div className="testi-avatar-wrapper-new">
                              <img 
                                src={item.gambar} 
                                alt={`Foto ${item.nama}`}
                                className="testi-avatar-new"
                                itemProp="author"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="testi-avatar-wrapper-new">
                              <div className="testi-avatar-placeholder-new">
                                {item.nama?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                            </div>
                          )}
                          <div className="testi-info-new">
                            <div className="testi-name-new" itemProp="author" itemScope itemType="https://schema.org/Person">
                              <span itemProp="name">{item.nama || "Nama"}</span>
                              {item.jabatan && (
                                <div className="testi-job-new" style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                                  {item.jabatan}
                                </div>
                              )}
                            </div>
                            {item.showRating !== false && (
                              <div className="testi-stars-new">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span 
                                    key={star} 
                                    className="star-new"
                                    style={{ 
                                      color: star <= (item.rating || 5) ? "#fbbf24" : "#d1d5db" 
                                    }}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div 
                          className="testi-desc-new" 
                          itemProp="reviewBody"
                          dangerouslySetInnerHTML={{ 
                            __html: cleanHTMLContent(item.isiTestimony || item.deskripsi || "<p>Deskripsi testimoni</p>")
                          }}
                        />
                      </article>
                    );
                  })}
                </div>
              </div>
              {currentIndex < maxIndex && testimoniItems.length > 3 && (
                <button 
                  className="testimoni-nav-btn-new testimoni-nav-next-new"
                  onClick={handleNext}
                  aria-label="Next testimonials"
                >
                  ›
                </button>
              )}
            </div>
          </section>
        );
      }

      case "list": {
        // ✅ SAMA PERSIS dengan renderPreview di addProducts3
        const listItems = content?.items || [];
        
        // Icon mapping
        const iconMap = {
          CheckCircle2, Circle, Minus, ArrowRight, ArrowRightCircle,
          ArrowLeft: ArrowLeftIcon, ArrowLeftRight, ChevronRight, CheckSquare, ShieldCheck,
          Lock, Dot, Target, Link: LinkIcon, PlusCircle, MinusCircle,
          Check, Star, Heart, ThumbsUp, Award, Zap, Flame, Sparkles,
          ArrowUp, ArrowDown, ArrowUpCircle, ArrowDownCircle, PlayCircle,
          PauseCircle, StopCircle, Radio, Square, Hexagon, Triangle,
          AlertCircle, Info, HelpCircle: HelpCircleIcon, Ban, Shield, Key, Unlock,
          MapPin, Calendar: CalendarIcon, Clock
        };
        
        const listTitle = content?.title || content?.componentTitle || config?.title || "";
        const listData = {
          paddingTop: style?.container?.padding?.top || style?.container?.paddingTop || 0,
          paddingRight: style?.container?.padding?.right || style?.container?.paddingRight || 0,
          paddingBottom: style?.container?.padding?.bottom || style?.container?.paddingBottom || 0,
          paddingLeft: style?.container?.padding?.left || style?.container?.paddingLeft || 0,
          bgType: style?.container?.background?.type || style?.container?.bgType || "none",
          bgColor: style?.container?.background?.color || style?.container?.bgColor || "#ffffff",
          bgImage: style?.container?.background?.image || style?.container?.bgImage || "",
        };
        
        // ✅ Build styles from advance settings - SAMA dengan addProducts3
        const listStyles = {
          paddingTop: `${listData.paddingTop || 0}px`,
          paddingRight: `${listData.paddingRight || 0}px`,
          paddingBottom: `${listData.paddingBottom || 0}px`,
          paddingLeft: `${listData.paddingLeft || 0}px`,
        };
        
        // ✅ Background dari advance settings - SAMA dengan addProducts3
        let listBackgroundStyle = {};
        if (listData.bgType === "color") {
          listBackgroundStyle.backgroundColor = listData.bgColor || "#ffffff";
        } else if (listData.bgType === "image" && listData.bgImage) {
          listBackgroundStyle.backgroundImage = `url(${listData.bgImage})`;
          listBackgroundStyle.backgroundSize = "cover";
          listBackgroundStyle.backgroundPosition = "center";
        }
        
        return (
          <div 
            className="preview-list-wrapper"
            style={{
              ...listStyles,
              ...listBackgroundStyle,
            }}
          >
            {listTitle && (
              <div className="preview-list-header">
                <h3 className="preview-list-title" style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#000000",
                  margin: "0 0 8px 0"
                }}>{listTitle}</h3>
                <div className="preview-list-header-line"></div>
              </div>
            )}
            {listItems.length === 0 ? (
              <div className="preview-placeholder">Belum ada list point</div>
            ) : (
              <ul className="preview-list">
                {listItems.map((item, i) => {
                  const iconName = item.icon || "CheckCircle2";
                  const iconColor = item.iconColor || "#000000";
                  const content = item.content || item.nama || `Point ${i + 1}`;
                  const IconComponent = iconMap[iconName] || CheckCircle2;
                  
                  return (
                    <li key={i} className="preview-list-item">
                      <span className="preview-list-icon" style={{ color: iconColor }}>
                        <IconComponent size={20} strokeWidth={2} />
                      </span>
                      <div className="preview-list-content" dangerouslySetInnerHTML={{ __html: cleanHTMLContent(content || `<p>Point ${i + 1}</p>`) }} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      }

      case "faq": {
        const kategoriId = getKategoriId();
        const faqItems = getFAQByKategori(kategoriId);
        
        // Build container style from block.style.container
        const blockStyle = style?.container || {};
        const containerStyle = {
          paddingTop: blockStyle.padding?.top || blockStyle.paddingTop || 0,
          paddingRight: blockStyle.padding?.right || blockStyle.paddingRight || 0,
          paddingBottom: blockStyle.padding?.bottom || blockStyle.paddingBottom || 0,
          paddingLeft: blockStyle.padding?.left || blockStyle.paddingLeft || 0,
          marginTop: blockStyle.margin?.top || blockStyle.marginTop || 0,
          marginRight: blockStyle.margin?.right || blockStyle.marginRight || 0,
          marginBottom: blockStyle.margin?.bottom || blockStyle.marginBottom || 0,
          marginLeft: blockStyle.margin?.left || blockStyle.marginLeft || 0,
          backgroundColor: blockStyle.backgroundColor || blockStyle.bgColor || 'transparent',
          backgroundImage: blockStyle.backgroundImage ? `url(${blockStyle.backgroundImage})` : 'none',
          border: blockStyle.border || 'none',
          borderRadius: blockStyle.borderRadius || 0,
          boxShadow: blockStyle.boxShadow || 'none',
        };
        
        return (
          <div key={block.order} className="canvas-preview-block" style={containerStyle}>
            <section className="preview-faq-section" aria-label="Frequently Asked Questions">
              <h2 className="faq-title">Pertanyaan yang Sering Diajukan</h2>
              <div className="faq-container">
                {faqItems.map((faq, index) => (
                  <FAQItem 
                    key={index}
                    question={faq.question} 
                    answer={faq.answer}
                  />
                ))}
              </div>
            </section>
          </div>
        );
      }

      case "form": {
        const kategoriId = getKategoriId();
        const isFormBuku = kategoriId === 4; // Kategori Buku (4)
        
        // Helper untuk mendapatkan nama dari ID
        const getProvinceName = (id) => {
          const province = wilayahData.provinces.find(p => p.id === Number(id));
          return province?.name || "";
        };
        
        const getCityName = (id) => {
          const city = wilayahData.cities.find(c => c.id === Number(id));
          return city?.name || "";
        };
        
        const getDistrictName = (id) => {
          const district = wilayahData.districts.find(d => d.district_id === Number(id) || d.id === Number(id));
          return district?.name || "";
        };
        
        // Parse bundling dari productData (bundling disimpan di productData, bukan di settings)
        const bundlingData = productData?.bundling && Array.isArray(productData.bundling) ? productData.bundling : [];
        const isBundling = productData?.isBundling || false;
        
        return (
          <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            {/* ✅ Card besar yang merangkum semua form */}
            <div style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              border: "1px solid #e5e7eb"
            }}>
              {/* ✅ Section: Bundling/Pilihan Paket (jika ada) */}
              {isBundling && bundlingData && bundlingData.length > 0 && (
                <section style={{ marginBottom: "24px" }}>
                  <h2 style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#000000",
                    marginBottom: "8px",
                    lineHeight: "1.4"
                  }}>
                    {productData?.nama || "Produk"}
                  </h2>
                  <p style={{
                    fontSize: "18px",
                    color: "#000000",
                    marginBottom: "20px",
                    fontWeight: "600"
                  }}>
                    Pilihan Paket
                  </p>
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px"
                  }}>
                    {bundlingData.map((item, index) => {
                      const isSelected = selectedBundling === index;
                      const formatHarga = (harga) => {
                        if (!harga || harga === 0) return "0";
                        return harga.toLocaleString("id-ID");
                      };
                      
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setSelectedBundling(index);
                            // Update harga produk berdasarkan bundling yang dipilih
                            if (productData) {
                              setProductData(prev => ({
                                ...prev,
                                harga: item.harga || prev.harga
                              }));
                            }
                          }}
                          style={{
                            flex: "1 1 calc(33.333% - 8px)",
                            minWidth: "200px",
                            padding: "16px 20px",
                            borderRadius: "10px",
                            border: isSelected ? "2px solid #F1A124" : "1px solid #e5e7eb",
                            backgroundColor: isSelected ? "#F1A124" : "#ffffff",
                            color: isSelected ? "#ffffff" : "#374151",
                            fontSize: "15px",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            textAlign: "center",
                            boxShadow: isSelected ? "0 4px 12px rgba(241, 161, 36, 0.3)" : "0 1px 3px rgba(0, 0, 0, 0.1)",
                            outline: "none"
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = "#f9fafb";
                              e.currentTarget.style.borderColor = "#d1d5db";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = "#ffffff";
                              e.currentTarget.style.borderColor = "#e5e7eb";
                            }
                          }}
                        >
                          {item.nama || `Paket ${index + 1}`}
                          {item.harga && (
                            <span style={{
                              display: "block",
                              marginTop: "4px",
                              fontSize: "14px",
                              fontWeight: "600",
                              opacity: isSelected ? "1" : "0.8"
                            }}>
                              Rp {formatHarga(item.harga)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
              
              {/* Section: Lengkapi Data */}
              <section className="preview-form-section compact-form-section" aria-label="Order form" style={{ marginBottom: "24px" }}>
                <h2 className="compact-form-title" style={{ fontSize: "18px", fontWeight: "600", color: "#000000", marginBottom: "16px" }}>
                  Lengkapi Data:
                </h2>
              <div className="compact-form-card">
                <div className="compact-field">
                  <label className="compact-label">Nama Lengkap <span className="required">*</span></label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Krisdayanti" 
                    className="compact-input"
                    value={customerForm.nama}
                    onChange={(e) => setCustomerForm({ ...customerForm, nama: e.target.value })}
                  />
                </div>
                <div className="compact-field">
                  <label className="compact-label">No. WhatsApp <span className="required">*</span></label>
                  <div className="wa-input-wrapper">
                    <div className="wa-prefix">
                      <span className="flag">🇮🇩</span>
                      <span className="code">+62</span>
                    </div>
                    <input 
                      type="tel" 
                      placeholder="812345678" 
                      className="compact-input wa-input"
                      value={customerForm.wa.replace(/^(\+62|62|0)/, '')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setCustomerForm({ ...customerForm, wa: '62' + val });
                      }}
                    />
                  </div>
                </div>
                <div className="compact-field">
                  <label className="compact-label">Email <span className="required">*</span></label>
                  <input 
                    type="email" 
                    placeholder="email@example.com" 
                    className="compact-input"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  />
                </div>
                  
                  {/* ✅ Field Provinsi, Kabupaten/Kota, Kecamatan, Kode Pos (selalu tampil) */}
                <div className="compact-field">
                    <label className="compact-label">Provinsi <span className="required">*</span></label>
                    <select
                      className="compact-input"
                      value={selectedWilayahIds.provinceId}
                    onChange={(e) => {
                        const provinceId = e.target.value;
                        setSelectedWilayahIds({ provinceId, cityId: "", districtId: "" });
                        const provinceName = getProvinceName(provinceId);
                        setFormWilayah(prev => ({ ...prev, provinsi: provinceName, kabupaten: "", kecamatan: "", kode_pos: "" }));
                      }}
                      disabled={loadingWilayah.provinces}
                      style={{ 
                        appearance: 'auto', 
                        cursor: loadingWilayah.provinces ? 'not-allowed' : 'pointer',
                        backgroundColor: loadingWilayah.provinces ? '#f9fafb' : 'white'
                      }}
                    >
                      <option value="">Pilih Provinsi</option>
                      {wilayahData.provinces.map((province) => (
                        <option key={province.id} value={province.id}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                    {loadingWilayah.provinces && (
                      <small style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px", display: "block" }}>
                        Memuat provinsi...
                      </small>
                    )}
                </div>
                
                  <div className="compact-field">
                    <label className="compact-label">Kabupaten/Kota <span className="required">*</span></label>
                    <select
                      className="compact-input"
                      value={selectedWilayahIds.cityId}
                      onChange={(e) => {
                        const cityId = e.target.value;
                        setSelectedWilayahIds(prev => ({ ...prev, cityId, districtId: "" }));
                        const cityName = getCityName(cityId);
                        setFormWilayah(prev => ({ ...prev, kabupaten: cityName, kecamatan: "", kode_pos: "" }));
                      }}
                      disabled={!selectedWilayahIds.provinceId || loadingWilayah.cities}
                      style={{ 
                        appearance: 'auto', 
                        cursor: (!selectedWilayahIds.provinceId || loadingWilayah.cities) ? 'not-allowed' : 'pointer',
                        backgroundColor: (!selectedWilayahIds.provinceId || loadingWilayah.cities) ? '#f9fafb' : 'white'
                      }}
                    >
                      <option value="">Pilih Kabupaten/Kota</option>
                      {wilayahData.cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                    {loadingWilayah.cities && (
                      <small style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px", display: "block" }}>
                        Memuat kabupaten/kota...
                      </small>
                    )}
                  </div>
                  
                  <div className="compact-field">
                    <label className="compact-label">Kecamatan <span className="required">*</span></label>
                    <select
                      className="compact-input"
                      value={selectedWilayahIds.districtId}
                      onChange={(e) => {
                        const districtId = e.target.value;
                        setSelectedWilayahIds(prev => ({ ...prev, districtId }));
                        const districtName = getDistrictName(districtId);
                        setFormWilayah(prev => ({ ...prev, kecamatan: districtName }));
                      }}
                      disabled={!selectedWilayahIds.cityId || loadingWilayah.districts}
                      style={{ 
                        appearance: 'auto', 
                        cursor: (!selectedWilayahIds.cityId || loadingWilayah.districts) ? 'not-allowed' : 'pointer',
                        backgroundColor: (!selectedWilayahIds.cityId || loadingWilayah.districts) ? '#f9fafb' : 'white'
                      }}
                    >
                      <option value="">Pilih Kecamatan</option>
                      {wilayahData.districts.map((district) => (
                        <option key={district.district_id || district.id} value={district.district_id || district.id}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                    {!selectedWilayahIds.cityId && (
                      <small style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px", display: "block" }}>
                        Pilih kabupaten/kota terlebih dahulu
                      </small>
                    )}
                    {loadingWilayah.districts && (
                      <small style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px", display: "block" }}>
                        Memuat kecamatan...
                      </small>
                    )}
                  </div>
                  
                  <div className="compact-field">
                    <label className="compact-label">Kode Pos <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Contoh: 12120"
                      className="compact-input"
                      value={formWilayah.kode_pos}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormWilayah(prev => ({ ...prev, kode_pos: val }));
                      }}
                      disabled={!selectedWilayahIds.districtId}
                      style={{ 
                        cursor: !selectedWilayahIds.districtId ? 'not-allowed' : 'text',
                        backgroundColor: !selectedWilayahIds.districtId ? '#f9fafb' : 'white'
                      }}
                    />
                    {!selectedWilayahIds.districtId && (
                      <small style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px", display: "block" }}>
                        Pilih kecamatan terlebih dahulu
                      </small>
                    )}
                  </div>
                  
                  {/* ✅ Bagian Ongkir dengan Kurir (hanya untuk produk fisik) */}
                  {isFormBuku && (
                    <div className="compact-field">
                      <label className="compact-label">Kurir <span className="required">*</span></label>
                      <select
                        className="compact-input"
                        value={selectedCourier}
                        onChange={(e) => setSelectedCourier(e.target.value)}
                        disabled={!selectedWilayahIds.districtId || loadingCost}
                        style={{ 
                          appearance: 'auto', 
                          cursor: (!selectedWilayahIds.districtId || loadingCost) ? 'not-allowed' : 'pointer',
                          backgroundColor: (!selectedWilayahIds.districtId || loadingCost) ? '#f9fafb' : 'white'
                        }}
                      >
                        {couriers.map((courier) => (
                          <option key={courier.value} value={courier.value}>
                            {courier.label}
                          </option>
                        ))}
                      </select>
                      {loadingCost && (
                        <small style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          Menghitung ongkir...
                        </small>
                      )}
                      {costResults.length > 0 && !loadingCost && (
                        <div style={{ marginTop: "8px" }}>
                          {costResults.map((result, idx) => (
                            <div key={idx} style={{ fontSize: "14px", color: "#374151", marginTop: "4px" }}>
                              {result.service}: Rp {formatPrice(result.cost)} ({result.etd || "Estimasi"})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                )}
              </div>
            </section>

              {/* Section: Rincian Pesanan */}
              <section className="preview-form-section rincian-pesanan-section" aria-label="Rincian Pesanan" style={{ marginBottom: "24px" }}>
              <div className="rincian-pesanan-card">
                <h3 className="rincian-pesanan-title">RINCIAN PESANAN:</h3>
                <div className="rincian-pesanan-item">
                  <div className="rincian-pesanan-detail">
                    <div className="rincian-pesanan-name">{productData?.nama || "Nama Produk"}</div>
                  </div>
                  <div className="rincian-pesanan-price">
                    Rp {formatPrice(productData?.harga || 0)}
                  </div>
                </div>
                {isFormBuku && ongkir > 0 && (
                  <div className="rincian-pesanan-item">
                    <div className="rincian-pesanan-detail">
                        <div className="rincian-pesanan-name">Ongkos Kirim</div>
                    </div>
                    <div className="rincian-pesanan-price">Rp {formatPrice(ongkir)}</div>
                  </div>
                )}
                <div className="rincian-pesanan-divider"></div>
                <div className="rincian-pesanan-total">
                  <span className="rincian-pesanan-total-label">Total</span>
                  <span className="rincian-pesanan-total-price">
                    Rp {formatPrice(
                      isFormBuku 
                        ? (parseInt(productData?.harga || 0) + ongkir) 
                        : parseInt(productData?.harga || 0)
                    )}
                  </span>
                </div>
              </div>
            </section>

              {/* Section: Metode Pembayaran */}
              <section className="preview-payment-section payment-section" aria-label="Payment methods" style={{ marginBottom: "24px" }}>
                <h2 className="payment-title" style={{ fontSize: "18px", fontWeight: "600", color: "#000000", marginBottom: "16px" }}>
                  Metode Pembayaran
                </h2>
              <div className="payment-options-vertical">
                <label className="payment-option-row">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="manual"
                    checked={paymentMethod === "manual"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="payment-label">Bank Transfer (Manual)</span>
                  <div className="payment-icons-inline">
                    <img className="pay-icon" src="/assets/bca.png" alt="BCA" />
                  </div>
                </label>
                <label className="payment-option-row">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="ewallet"
                    checked={paymentMethod === "ewallet"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="payment-label">E-Payment</span>
                  <div className="payment-icons-inline">
                    <img className="pay-icon" src="/assets/qris.svg" alt="QRIS" />
                    <img className="pay-icon" src="/assets/dana.png" alt="DANA" />
                    <img className="pay-icon" src="/assets/ovo.png" alt="OVO" />
                    <img className="pay-icon" src="/assets/link.png" alt="LinkAja" />
                  </div>
                </label>
                <label className="payment-option-row">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="cc"
                    checked={paymentMethod === "cc"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="payment-label">Credit / Debit Card</span>
                  <div className="payment-icons-inline">
                    <img className="pay-icon" src="/assets/visa.svg" alt="Visa" />
                    <img className="pay-icon" src="/assets/master.png" alt="Mastercard" />
                    <img className="pay-icon" src="/assets/jcb.png" alt="JCB" />
                  </div>
                </label>
                <label className="payment-option-row">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="va"
                    checked={paymentMethod === "va"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="payment-label">Virtual Account</span>
                  <div className="payment-icons-inline">
                    <img className="pay-icon" src="/assets/bca.png" alt="BCA" />
                    <img className="pay-icon" src="/assets/mandiri.png" alt="Mandiri" />
                    <img className="pay-icon" src="/assets/bni.png" alt="BNI" />
                    <img className="pay-icon" src="/assets/permata.svg" alt="Permata" />
                  </div>
                </label>
              </div>
            </section>

              {/* Submit Button */}
            <div className="preview-form-submit-wrapper">
              <button 
                type="button" 
                className="preview-form-submit-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Memproses..." : "Pesan Sekarang"}
              </button>
              </div>
            </div>
          </div>
        );
      }

      case "price": {
        const harga = productData?.harga || 0;
        const hargaAsli = productData?.harga_asli || productData?.harga_coret || 0;
        
        return (
          <div>
            <section className="preview-price-section special-offer-card" aria-label="Special offer" itemScope itemType="https://schema.org/Offer">
              <h2 className="special-offer-title">Special Offer!</h2>
              <div className="special-offer-price">
                {hargaAsli > 0 && hargaAsli > harga && (
                  <span className="price-old" aria-label="Harga lama">
                    Rp {formatPrice(hargaAsli)}
                  </span>
                )}
                <span className="price-new" itemProp="price" content={harga}>
                  Rp {formatPrice(harga)}
                </span>
              </div>
              <meta itemProp="priceCurrency" content="IDR" />
              <meta itemProp="availability" content="https://schema.org/InStock" />
            </section>
          </div>
        );
      }

      case "countdown": {
        // ✅ GENERAL: Styling sesuai gambar pertama - dark grey boxes dengan white numbers
        // Background kotak dan warna angka bisa di-setting dari form (style.container.background.color dan style.text.color)
        const countdownData = content || {};
        const countdownStyle = {
          // ✅ Warna angka: dari style.text.color atau countdownData.textColor, default white (#ffffff)
          textColor: style?.text?.color || countdownData.textColor || "#ffffff",
          // ✅ Background kotak: dari style.container.background.color atau countdownData.bgColor, default dark grey (#374151)
          bgColor: style?.container?.background?.color || countdownData.bgColor || "#374151",
        };
        
        return (
          <CountdownComponent 
            data={{
              ...countdownData,
              textColor: countdownStyle.textColor,
              bgColor: countdownStyle.bgColor
            }}
            componentId={config?.componentId}
            containerStyle={containerStyle}
          />
        );
      }

      case "button": {
        // ✅ SAMA PERSIS dengan renderPreview di addProducts3
        const buttonData = content || {};
        const buttonStyle = buttonData.style || style?.button?.style || 'primary';
        const buttonText = buttonData.text || content?.text || "Klik Disini";
        
        return (
          <div style={containerStyle}>
            <button className={`preview-button preview-button-${buttonStyle}`}>
              {buttonText}
            </button>
          </div>
        );
      }

      case "html": {
        // ✅ SAMA PERSIS dengan renderPreview di addProducts3
        const htmlCode = content?.code || content || "";
        
        // ✅ Clean HTML content - remove inline font-family
        const cleanedHtmlCode = cleanHTMLContent(htmlCode);
        
        return (
          <div style={containerStyle} dangerouslySetInnerHTML={{ __html: cleanedHtmlCode }} />
        );
      }

      case "embed": {
        // ✅ SAMA PERSIS dengan renderPreview di addProducts3
        const embedCode = content?.code || content || "";
        
        // ✅ Clean HTML content - remove inline font-family
        const cleanedEmbedCode = cleanHTMLContent(embedCode);
        
        // ✅ Tambahkan maxWidth 625px untuk embed youtube agar tidak terlalu lebar
        const embedContainerStyle = {
          ...containerStyle,
          maxWidth: "625px",
          width: "100%",
          margin: "0 auto"
        };
        
        return (
          <div style={embedContainerStyle} dangerouslySetInnerHTML={{ __html: cleanedEmbedCode }} />
        );
      }

      case "image-slider": {
        // ✅ SAMA PERSIS dengan renderPreview di addProducts3
        const sliderData = content || {};
        
        // Adaptasi dari content/style/config ke format yang diharapkan ImageSliderPreview
        // ✅ Mapping autoplay dan interval dari backend ke autoslide dan autoslideDuration
        const adaptedData = {
          images: sliderData.images || sliderData.items || [],
          sliderType: sliderData.sliderType || "gallery",
          autoslide: sliderData.autoplay !== undefined ? sliderData.autoplay : (sliderData.autoslide || false),
          autoslideDuration: sliderData.interval !== undefined ? sliderData.interval : (sliderData.autoslideDuration || 5),
          showCaption: sliderData.showCaption || false,
          showDots: sliderData.showDots !== undefined ? sliderData.showDots : true,
          showArrows: sliderData.showArrows !== undefined ? sliderData.showArrows : true,
          alignment: style?.image?.alignment || style?.container?.alignment || "center",
          imageWidth: style?.image?.width || style?.container?.imageWidth || 100,
          imageFit: style?.image?.fit || style?.container?.imageFit || "fill",
          aspectRatio: style?.image?.aspectRatio || style?.container?.aspectRatio || "OFF",
          backgroundType: style?.container?.background?.type || "none",
          backgroundColor: style?.container?.background?.color || "#ffffff",
          backgroundImage: style?.container?.background?.image || "",
          paddingTop: style?.container?.padding?.top || style?.container?.paddingTop || 0,
          paddingRight: style?.container?.padding?.right || style?.container?.paddingRight || 0,
          paddingBottom: style?.container?.padding?.bottom || style?.container?.paddingBottom || 0,
          paddingLeft: style?.container?.padding?.left || style?.container?.paddingLeft || 0,
        };
        
        // ✅ Container style dengan maxwidth 625px untuk wrapper (sama seperti image)
        const sliderContainerStyle = {
          ...containerStyle,
          maxWidth: "625px",
          width: "100%",
          margin: "0 auto"
        };
        
        return (
          <div style={sliderContainerStyle}>
            <ImageSliderPreview data={adaptedData} />
          </div>
        );
      }

      case "quota-info": {
        // ✅ SAMA PERSIS dengan renderPreview di addProducts3
        const quotaData = content || {};
        
        return (
          <div style={containerStyle}>
            <QuotaInfoPreview data={quotaData} />
          </div>
        );
      }

      case "section": {
        // ✅ SAMA DENGAN addProducts3: Pastikan block memiliki data terbaru dari allBlocks array
        // Di product page, block mungkin tidak punya id, jadi cek berdasarkan config.componentId atau order
        const blockIdentifier = block.config?.componentId || block.id || block.order;
        const latestBlock = allBlocks.find(b => {
          if (b.type !== 'section') return false;
          const bIdentifier = b.config?.componentId || b.id || b.order;
          return bIdentifier === blockIdentifier;
        }) || block;
        const blockToRender = latestBlock;
        
        // ✅ ARSITEKTUR BENAR: config.componentId adalah SATU-SATUNYA sumber kebenaran (sama dengan addProducts3)
        // ✅ FALLBACK: Untuk kompatibilitas data lama, generate componentId jika tidak ada
        let sectionComponentId = blockToRender.config?.componentId;
        
        if (!sectionComponentId) {
          // ✅ FALLBACK: Generate componentId untuk data lama yang tidak punya config.componentId
          sectionComponentId = blockToRender.data?.componentId || blockToRender.content?.componentId || `section-${blockToRender.id || blockToRender.order || Date.now()}`;
          
          console.warn(`[SECTION FALLBACK] Section block tidak memiliki config.componentId, menggunakan fallback: "${sectionComponentId}"`, {
            blockToRenderId: blockToRender.id,
            blockToRenderConfig: blockToRender.config,
            blockToRenderData: blockToRender.data,
            blockToRenderContent: blockToRender.content
          });
        }
        
        // ✅ ARSITEKTUR FINAL: Filter child HANYA berdasarkan parentId === sectionComponentId
        // ✅ RULE: Frontend TIDAK BOLEH menebak relasi. Jika parentId tidak ada → section memang kosong.
        const childComponents = allBlocks.filter(b => {
          if (!b || !b.type) return false;
          // ✅ parentId HANYA ada di root level (bukan di config)
          return b.parentId === sectionComponentId;
        });
        
        // ✅ DEBUG: Log untuk tracking identifier
        console.log(`[SECTION RENDER] Section ID: "${sectionComponentId}"`, {
          sectionBlockId: blockToRender.id,
          sectionConfigComponentId: blockToRender.config?.componentId,
          childCount: childComponents.length,
          allBlocksCount: allBlocks.length,
          allBlocksWithParentId: allBlocks
            .filter(b => b && b.parentId)
            .map(b => ({
              type: b.type,
              componentId: b.config?.componentId || b.order,
              parentId: b.parentId,
              match: b.parentId === sectionComponentId ? "✅ MATCH" : "❌ NO MATCH"
            })),
          // ✅ Validasi: Jika childCount === 0, cek apakah ada blocks dengan parentId
          hasAnyParentId: allBlocks.some(b => b && b.parentId),
          warning: childComponents.length === 0 
            ? "⚠️ Section kosong - tidak ada child dengan parentId yang sesuai. Pastikan backend mengirim parentId di child blocks." 
            : null
        });
        
        // ✅ FIX #3: Build section styles from block.style.container, bukan block.data (sama dengan addProducts3)
        const sectionData = blockToRender.data || blockToRender.content || {};
        const sectionContainerStyle = blockToRender.style?.container || style?.container || {};
        // ✅ FIX: Padding section - kiri/kanan lebih jauh dari komponen umum
        // Section harus punya padding kiri-kanan yang lebih besar untuk memberikan ruang lebih
        // Default: 4px top/bottom, 24px left/right (lebih jauh dari komponen umum yang biasanya 8-16px)
        let sectionPadding = "4px 24px";
        if (sectionContainerStyle.padding) {
          const top = sectionContainerStyle.padding.top || 4;
          const right = sectionContainerStyle.padding.right || 24;
          const bottom = sectionContainerStyle.padding.bottom || 4;
          const left = sectionContainerStyle.padding.left || 24;
          // ✅ Untuk section, padding kiri-kanan minimal 20px, maksimal 40px
          // Top/bottom tetap kecil (4-12px) agar konten tidak terlalu jauh
          const minHorizontalPadding = 20;
          const maxHorizontalPadding = 40;
          const minVerticalPadding = 4;
          const maxVerticalPadding = 12;
          sectionPadding = `${Math.min(Math.max(top, minVerticalPadding), maxVerticalPadding)}px ${Math.min(Math.max(right, minHorizontalPadding), maxHorizontalPadding)}px ${Math.min(Math.max(bottom, minVerticalPadding), maxVerticalPadding)}px ${Math.min(Math.max(left, minHorizontalPadding), maxHorizontalPadding)}px`;
        } else if (sectionData.padding) {
          // ✅ Jika sectionData.padding adalah string seperti "40px", gunakan untuk semua sisi
          // Tapi pastikan kiri-kanan minimal 20px
          const paddingValue = typeof sectionData.padding === 'string' 
            ? parseInt(sectionData.padding) || 24
            : sectionData.padding || 24;
          const horizontalPadding = Math.max(paddingValue, 20);
          sectionPadding = `4px ${horizontalPadding}px`;
        }
        
        // ✅ FIX: Section harus lebih jauh dari tepi kiri-kanan website dibanding komponen umum
        // Komponen umum berada dalam canvas-content-area dengan padding 150px kiri-kanan
        // Section harus lebih masuk lagi dengan menambahkan margin kiri-kanan ekstra
        // ✅ RESPONSIVE: Di mobile/tablet, tidak perlu extra margin
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1024;
        const extraHorizontalMargin = isMobile ? 0 : 40; // 0 untuk mobile/tablet, 40 untuk desktop
        const sectionMarginLeft = (sectionContainerStyle.margin?.left || sectionContainerStyle.marginLeft || sectionData.marginLeft || 0) + extraHorizontalMargin;
        const sectionMarginRight = (sectionContainerStyle.margin?.right || sectionContainerStyle.marginRight || sectionData.marginRight || 0) + extraHorizontalMargin;
        
        const sectionStyles = {
          marginRight: `${sectionMarginRight}px`,
          marginLeft: `${sectionMarginLeft}px`,
          marginBottom: `${sectionContainerStyle.margin?.bottom || sectionContainerStyle.marginBottom || sectionContainerStyle.marginBetween || sectionData.marginBetween || 16}px`,
          border: sectionContainerStyle.border?.width 
            ? `${sectionContainerStyle.border.width}px ${sectionContainerStyle.border.style || 'solid'} ${sectionContainerStyle.border.color || "#000000"}` 
            : (sectionData.border ? `${sectionData.border}px solid ${sectionData.borderColor || "#000000"}` : "none"),
          backgroundColor: sectionContainerStyle.background?.color || sectionContainerStyle.backgroundColor || sectionData.backgroundColor || "#ffffff",
          borderRadius: sectionContainerStyle.border?.radius || (sectionData.borderRadius === "none" ? "0" : sectionData.borderRadius || "0"),
          boxShadow: sectionContainerStyle.shadow || (sectionData.boxShadow === "none" ? "none" : sectionData.boxShadow || "none"),
          display: "block",
          width: "100%",
          padding: sectionPadding, // ✅ Gunakan padding yang sudah di-adjust
        };
        
        return (
          <div className="preview-section" style={sectionStyles}>
            {childComponents.length === 0 ? (
              <div className="preview-placeholder">
                Section kosong - tambahkan komponen
              </div>
            ) : (
              childComponents.map((childBlock) => {
                if (!childBlock || !childBlock.type) {
                  console.warn("[SECTION] Child block tidak valid:", childBlock);
                  return null;
                }
        
                // ✅ Key dari componentId atau id atau order (sama dengan addProducts3 tapi dengan fallback untuk product page)
                const childKey = childBlock.config?.componentId || childBlock.id || childBlock.order || `section-child-${childBlock.type}-${Date.now()}`;
                
                return (
                  <div key={childKey} className="preview-section-child">
                    {renderBlock(childBlock, allBlocks)}
                  </div>
                );
              })
            )}
          </div>
        );
      }

      default:
        return (
          <div className="preview-placeholder" style={containerStyle}>{type}</div>
        );
    }
  };

  // Handle Submit
  const handleSubmit = async () => {
    if (submitting) return;
    
    if (!paymentMethod) return toast.error("Silakan pilih metode pembayaran");
    if (!customerForm.nama || !customerForm.email || !customerForm.wa)
      return toast.error("Silakan lengkapi data yang diperlukan");
    
    const isFisik = isKategoriBuku();
    if (isFisik && (!ongkir || ongkir === 0)) {
      return toast.error("Silakan hitung ongkir terlebih dahulu");
    }

    setSubmitting(true);

    if (!productData) {
      return toast.error("Data produk tidak valid");
    }
    
    const hargaProduk = parseInt(productData.harga || '0', 10);
    const ongkirValue = isKategoriBuku() ? (ongkir || 0) : 0;
    
    const totalHarga = isKategoriBuku() 
      ? hargaProduk + ongkirValue 
      : hargaProduk;

    const payload = {
      nama: customerForm.nama,
      wa: customerForm.wa,
      email: customerForm.email,
      alamat: alamatLengkap || customerForm.alamat || '',
      produk: parseInt(productData.id, 10),
      harga: String(hargaProduk),
      ongkir: String(ongkirValue),
      total_harga: String(totalHarga),
      metode_bayar: paymentMethod,
      sumber: sumber || 'website',
      custom_value: Array.isArray(customerForm.custom_value) 
        ? customerForm.custom_value 
        : (customerForm.custom_value ? [customerForm.custom_value] : []),
    };

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const order = await response.json();
      
      if (!response.ok || !order?.success) {
        const errorMessage = order?.message || order?.error || "Gagal membuat order";
        throw new Error(errorMessage);
      }

      const orderResponseData = order?.data?.order || order?.data || {};
      const orderId = orderResponseData?.id;
      
      let customerId = null;
      const rawCustomer = orderResponseData?.customer || orderResponseData?.customer_id || orderResponseData?.id_customer;
      
      if (typeof rawCustomer === 'object' && rawCustomer !== null) {
        customerId = rawCustomer.id || rawCustomer.customer_id;
      } else if (typeof rawCustomer === 'number' || typeof rawCustomer === 'string') {
        customerId = rawCustomer;
      }

      const totalHargaFinal = isKategoriBuku() 
        ? hargaProduk + ongkirValue 
        : hargaProduk;

      const pendingOrder = {
        orderId: orderId,
        customerId: customerId,
        nama: customerForm.nama,
        wa: customerForm.wa,
        email: customerForm.email,
        productName: productData.nama || "Produk",
        totalHarga: String(totalHargaFinal),
        paymentMethod: paymentMethod,
        landingUrl: window.location.pathname,
      };

      localStorage.setItem("pending_order", JSON.stringify(pendingOrder));

      if (customerId) {
        toast.success("Kode OTP telah dikirim ke WhatsApp Anda!");
      } else {
        toast.success("Order berhasil! Lanjut ke pembayaran...");
      }

      await new Promise((r) => setTimeout(r, 500));
      window.location.href = "/verify-order";

    } catch (err) {
      console.error("[SUBMIT ERROR]", err);
      toast.error(err.message || "Terjadi kesalahan. Silakan coba lagi.");
      setSubmitting(false);
    }
  };

  // Load provinces when product data loaded (selalu load untuk semua produk)
  useEffect(() => {
    if (!productData) return;
    
    async function loadProvincesData() {
      setLoadingWilayah(prev => ({ ...prev, provinces: true }));
      try {
        const data = await getProvinces();
        setWilayahData(prev => ({ ...prev, provinces: data }));
      } catch (err) {
        console.error("Load provinces error:", err);
      } finally {
        setLoadingWilayah(prev => ({ ...prev, provinces: false }));
      }
    }
    loadProvincesData();
  }, [productData]);
  
  // Load cities when province selected
  useEffect(() => {
    if (!productData) return;
    
    if (!selectedWilayahIds.provinceId) {
      setWilayahData(prev => ({ ...prev, cities: [], districts: [] }));
      setSelectedWilayahIds(prev => ({ ...prev, cityId: "", districtId: "" }));
      return;
    }
    
    async function loadCitiesData() {
      setLoadingWilayah(prev => ({ ...prev, cities: true }));
      try {
        const data = await getCities(selectedWilayahIds.provinceId);
        setWilayahData(prev => ({ ...prev, cities: data, districts: [] }));
        setSelectedWilayahIds(prev => ({ ...prev, cityId: "", districtId: "" }));
      } catch (err) {
        console.error("Load cities error:", err);
      } finally {
        setLoadingWilayah(prev => ({ ...prev, cities: false }));
      }
    }
    loadCitiesData();
  }, [selectedWilayahIds.provinceId, productData]);
  
  // Load districts when city selected
  useEffect(() => {
    if (!productData) return;
    
    if (!selectedWilayahIds.cityId) {
      setWilayahData(prev => ({ ...prev, districts: [] }));
      setSelectedWilayahIds(prev => ({ ...prev, districtId: "" }));
      return;
    }
    
    async function loadDistrictsData() {
      setLoadingWilayah(prev => ({ ...prev, districts: true }));
      try {
        const data = await getDistricts(selectedWilayahIds.cityId);
        setWilayahData(prev => ({ ...prev, districts: data }));
        setSelectedWilayahIds(prev => ({ ...prev, districtId: "" }));
      } catch (err) {
        console.error("Load districts error:", err);
      } finally {
        setLoadingWilayah(prev => ({ ...prev, districts: false }));
      }
    }
    loadDistrictsData();
  }, [selectedWilayahIds.cityId, productData]);
  
  // Calculate cost when district and courier selected (hanya untuk produk fisik)
  useEffect(() => {
    if (!productData) return;
    const kategoriId = getKategoriId();
    const isBuku = kategoriId === 4;
    if (!isBuku) return; // Hanya untuk produk fisik
    
    if (!selectedWilayahIds.districtId || !selectedCourier) {
      setCostResults([]);
      setOngkir(0);
      return;
    }
    
    async function calculateShippingCost() {
      setLoadingCost(true);
      try {
        const results = await calculateDomesticCost({
          origin: ORIGIN_DISTRICT_ID,
          destination: Number(selectedWilayahIds.districtId),
          weight: DEFAULT_WEIGHT,
          courier: selectedCourier
        });
        
        setCostResults(results);
        
        // Auto select first result
        if (results && results.length > 0) {
          const firstResult = results[0];
          setOngkir(firstResult.cost || 0);
          setOngkirInfo({
            courier: firstResult.courier || selectedCourier,
            service: firstResult.service || ""
          });
        }
      } catch (err) {
        console.error("Calculate cost error:", err);
        setCostResults([]);
        setOngkir(0);
      } finally {
        setLoadingCost(false);
      }
    }
    calculateShippingCost();
  }, [selectedWilayahIds.districtId, selectedCourier, productData]);

  // Fetch Data dari Backend
  useEffect(() => {
    async function fetchProduct() {
      if (!kode_produk) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/landing/${kode_produk}`, {
          cache: "no-store",
        });
        
        const json = await res.json();

        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.message || "Produk tidak ditemukan");
        }

        const data = json.data;
        
        // Parse bundling jika berupa string JSON
        let bundlingData = data.bundling || [];
        if (typeof bundlingData === 'string') {
          try {
            bundlingData = JSON.parse(bundlingData);
          } catch (e) {
            console.warn("[PRODUCT] Failed to parse bundling string:", e);
            bundlingData = [];
          }
        }
        if (!Array.isArray(bundlingData)) {
          bundlingData = [];
        }
        
        // Set product data
        setProductData({
          id: data.id,
          nama: data.nama,
          harga: data.harga,
          harga_asli: data.harga_asli,
          harga_coret: data.harga_coret,
          kategori: data.kategori,
          kategori_id: data.kategori_id,
          kategori_rel: data.kategori_rel,
          isBundling: data.isBundling || false,
          bundling: bundlingData,
        });

        // Parse landingpage array
        let landingpageData = data.landingpage;
        
        // Handle jika landingpage adalah string (legacy), parse ke array
        if (typeof landingpageData === 'string') {
          try {
            landingpageData = JSON.parse(landingpageData);
          } catch (e) {
            console.warn("[PRODUCT] Failed to parse landingpage string:", e);
            landingpageData = null;
          }
        }

        // Pastikan landingpage adalah array
        if (!Array.isArray(landingpageData)) {
          console.warn("[PRODUCT] landingpage is not an array:", landingpageData);
          landingpageData = null;
        } else {
          // ✅ NORMALISASI DATA: Tambahkan parentId ke child blocks
          landingpageData = normalizeLandingpageData(landingpageData);
          
          // Log struktur landingpage untuk debugging
          console.log("[PRODUCT] Landingpage array length:", landingpageData.length);
          console.log("[PRODUCT] Landingpage structure:", landingpageData.map((item, idx) => ({
            index: idx,
            type: item?.type,
            order: item?.order,
            hasContent: !!item?.content,
            hasStyle: !!item?.style,
            hasConfig: !!item?.config,
            hasParentId: !!item?.parentId
          })));
        }

        setLandingpage(landingpageData);

      } catch (err) {
        console.error("[PRODUCT] Error fetching product:", err);
        toast.error(err.message || "Gagal memuat data produk");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [kode_produk]);

  if (loading) {
    return (
      <div className="add-products3-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            border: "4px solid #3b82f6",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
          <p>Memuat produk...</p>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="add-products3-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h2>Produk tidak ditemukan</h2>
          <p>Produk dengan kode "{kode_produk}" tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  // ✅ ARSITEKTUR FINAL: Root render hanya block TANPA parentId
  // ✅ Section render hanya block dengan parentId === section.config.componentId
  // ✅ Child TIDAK BOLEH dirender di root
  
  const blocks = landingpage && Array.isArray(landingpage) 
    ? landingpage.filter((item) => {
        // Pastikan item valid dan bukan settings
        if (!item || !item.type) return false;
        if (item.type === 'settings') return false;
        
        // ✅ ARSITEKTUR FINAL: Root skip block dengan parentId
        // parentId HANYA ada di root level (bukan di config)
        if (item.parentId) {
          return false; // Ini adalah child dari section, jangan render di root
        }
        
        return true;
      })
    : [];
  
  // Debug logging
  if (blocks.length > 0) {
    console.log('[PRODUCT] Total blocks:', blocks.length);
    console.log('[PRODUCT] Blocks (urutan array dari backend):', blocks.map((b, idx) => ({ 
      arrayIndex: idx,
      type: b.type, 
      componentId: b.config?.componentId || 'MISSING'
    })));
    
    // Warning jika ada componentId yang missing
    const missingComponentIds = blocks.filter(b => !b.config?.componentId);
    if (missingComponentIds.length > 0) {
      console.warn('[PRODUCT] ⚠️ Blocks tanpa componentId:', missingComponentIds.length);
      console.warn('[PRODUCT] Ini bisa menyebabkan React key collision!');
    }
  }

  // Ambil logo dari settings (jika ada)
  const settings = landingpage && Array.isArray(landingpage) && landingpage.length > 0 && landingpage[0].type === 'settings'
    ? landingpage[0]
    : null;
  const logoUrl = settings?.logo || '/assets/logo.png';

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </Head>
      {/* ✅ Import Google Fonts Inter - SAMA dengan addProducts3 */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
    <div className="add-products3-container" itemScope itemType="https://schema.org/Product">
      <div className="page-builder-canvas">
        <div className="canvas-wrapper">
          {/* Logo Section - Top */}
          <div className="canvas-logo-wrapper">
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="canvas-logo"
            />
          </div>

          {/* Content Area - Center dengan padding */}
          <div className="canvas-content-area">
            {/* ✅ Render Blocks sesuai urutan array dari backend (sumber kebenaran) */}
            {/* ✅ IMPORTANT: Pass landingpage sebagai allBlocks agar section bisa menemukan child-nya */}
            {blocks.length > 0 ? (
              blocks.map((block, index) => {
                // ✅ KEY HARUS DARI componentId (WAJIB dari backend)
                // Jika componentId tidak ada, ini adalah bug backend/builder, bukan frontend
                // Fallback: gunakan kombinasi yang deterministik berdasarkan array index
                const componentId = block.config?.componentId;
                
                if (!componentId) {
                  // ⚠️ WARNING: componentId missing - ini seharusnya tidak terjadi
                  // Fallback menggunakan array index (deterministik karena urutan array tidak berubah)
                  const fallbackKey = `block-${block.type}-${index}`;
                  console.warn(`[PRODUCT] ⚠️ Block tanpa componentId, menggunakan fallback key: ${fallbackKey}`, {
                    type: block.type,
                    arrayIndex: index
                  });
                  
                  return (
                    <div key={fallbackKey} className="canvas-preview-block">
                      {renderBlock(block, landingpage || [])}
                    </div>
                  );
                }
                
                // ✅ Key dari componentId (unik dan permanen)
                // ✅ Pass landingpage sebagai allBlocks (bukan blocks) agar section bisa menemukan child
                return (
                  <div key={componentId} className="canvas-preview-block">
                    {renderBlock(block, landingpage || [])}
                  </div>
                );
              })
            ) : (
              <div className="preview-placeholder">Belum ada konten</div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {submitting && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "white",
            padding: "2rem",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              border: "4px solid #3b82f6",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem"
            }} />
            <p>Memproses pesanan Anda...</p>
          </div>
        </div>
      )}
    </>
  );
}
