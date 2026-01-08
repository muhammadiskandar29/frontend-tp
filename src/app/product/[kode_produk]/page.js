"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
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

export default function ProductPage() {
  const { kode_produk } = useParams();
  const searchParams = useSearchParams();

  const [paymentMethod, setPaymentMethod] = useState("");
  const [productData, setProductData] = useState(null);
  const [landingpage, setLandingpage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testimoniIndices, setTestimoniIndices] = useState({});

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
    kota: "",
    kecamatan: "",
    kelurahan: "",
    kode_pos: "",
  });
  const [alamatLengkap, setAlamatLengkap] = useState("");

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

  // Render Block berdasarkan struktur content/style/config - SAMA PERSIS dengan renderPreview di addProducts3
  const renderBlock = (block) => {
    if (!block || !block.type) return null;

    // Adaptasi dari format content/style/config ke format block.data (untuk kompatibilitas dengan renderPreview)
    // Di addProducts3, renderPreview menggunakan block.data, tapi di product page kita punya content/style/config
    // Jadi kita perlu mengadaptasi data untuk match dengan renderPreview logic
    
    const { type, content, style, config } = block;
    
    // Simulasi block.data dari content/style/config untuk kompatibilitas dengan renderPreview logic
    const blockData = {
      // Text data
      content: content?.html || content || "",
      textColor: style?.text?.color || style?.text?.textColor || "#000000",
      fontFamily: style?.text?.fontFamily || "inherit",
      lineHeight: style?.text?.lineHeight || 1.5,
      textAlign: style?.text?.textAlign || style?.text?.alignment || "left",
      fontWeight: style?.text?.fontWeight || "normal",
      fontStyle: style?.text?.fontStyle || "normal",
      textDecoration: style?.text?.textDecoration || "none",
      textTransform: style?.text?.textTransform || "none",
      letterSpacing: style?.text?.letterSpacing || 0,
      backgroundColor: style?.text?.backgroundColor || "transparent",
      paragraphStyle: config?.paragraphStyle || "div",
      bgType: style?.text?.bgType || "none",
      bgColor: style?.text?.bgColor || "#ffffff",
      bgImage: style?.text?.bgImage || "",
      paddingTop: style?.text?.paddingTop || style?.container?.paddingTop || 0,
      paddingRight: style?.text?.paddingRight || style?.container?.paddingRight || 0,
      paddingBottom: style?.text?.paddingBottom || style?.container?.paddingBottom || 0,
      paddingLeft: style?.text?.paddingLeft || style?.container?.paddingLeft || 0,
      
      // Image data
      src: content?.src || content?.url || "",
      alt: content?.alt || "",
      caption: content?.caption || "",
      alignment: style?.container?.alignment || "center",
      imageWidth: style?.container?.imageWidth || 100,
      imageFit: style?.container?.imageFit || "fill",
      aspectRatio: style?.container?.aspectRatio || "OFF",
      backgroundType: style?.container?.backgroundType || "none",
      backgroundColor: style?.container?.backgroundColor || "#ffffff",
      backgroundImage: style?.container?.backgroundImage || "",
      
      // Video data
      items: content?.items || [],
      videoWidth: style?.container?.videoWidth || 100,
      
      // Testimoni data
      componentTitle: content?.componentTitle || config?.title || "Testimoni Pembeli",
      
      // List data
      icon: content?.icon || "CheckCircle2",
      iconColor: content?.iconColor || "#000000",
    };

    switch (type) {
      case "text": {
        const textData = blockData;
        const textStyles = {
          lineHeight: textData.lineHeight || 1.5,
          fontFamily: textData.fontFamily && textData.fontFamily !== "Page Font" 
            ? textData.fontFamily 
            : "inherit",
          color: textData.textColor || "#000000",
          backgroundColor: textData.backgroundColor && textData.backgroundColor !== "transparent"
            ? textData.backgroundColor
            : "transparent",
          textAlign: textData.textAlign || "left",
          fontWeight: textData.fontWeight || "normal",
          fontStyle: textData.fontStyle || "normal",
          textDecoration: textData.textDecoration || "none",
          textTransform: textData.textTransform || "none",
          letterSpacing: textData.letterSpacing ? `${textData.letterSpacing}px` : "0px",
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
            dangerouslySetInnerHTML={{ __html: richContent }}
          />
        );
      }

      case "image": {
        const imageData = blockData;
        if (!imageData.src) {
          return <div className="preview-placeholder">Gambar belum diupload</div>;
        }

        // Advanced settings
        const alignment = imageData.alignment || "center";
        const imageWidth = imageData.imageWidth || 100;
        const imageFit = imageData.imageFit || "fill";
        const aspectRatio = imageData.aspectRatio || "OFF";
        const backgroundType = imageData.backgroundType || "none";
        const backgroundColor = imageData.backgroundColor || "#ffffff";
        const backgroundImage = imageData.backgroundImage || "";
        const paddingTop = style?.container?.paddingTop || 0;
        const paddingRight = style?.container?.paddingRight || 0;
        const paddingBottom = style?.container?.paddingBottom || 0;
        const paddingLeft = style?.container?.paddingLeft || 0;

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

        // Image fit style
        let objectFitValue;
        if (aspectRatio !== "OFF") {
          objectFitValue = "cover";
        } else {
          objectFitValue = imageFit === "fill" ? "fill" : imageFit === "fit" ? "contain" : "fill";
        }

        // Padding style
        const imagePaddingStyle = {
          paddingTop: `${paddingTop}px`,
          paddingRight: `${paddingRight}px`,
          paddingBottom: `${paddingBottom}px`,
          paddingLeft: `${paddingLeft}px`,
        };

        // Container style with alignment
        const containerStyle = {
          display: "flex",
          justifyContent: alignment === "left" ? "flex-start" : alignment === "right" ? "flex-end" : "center",
          width: "100%",
          ...imagePaddingStyle,
        };

        // Image wrapper style
        const imageWrapperStyle = {
          width: `${imageWidth}%`,
          ...aspectRatioStyle,
          ...imageBackgroundStyle,
          overflow: "hidden",
          borderRadius: "4px",
          position: "relative",
        };

        return (
          <div style={containerStyle}>
            <div style={imageWrapperStyle}>
              <img 
                src={imageData.src} 
                alt={imageData.alt || ""} 
                style={{
                  width: "100%",
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
        
        // Advanced settings untuk video
        const videoAlignment = style?.container?.alignment || "center";
        const videoWidth = style?.container?.videoWidth !== undefined ? style?.container?.videoWidth : 100;
        const videoPaddingTop = style?.container?.paddingTop || 0;
        const videoPaddingRight = style?.container?.paddingRight || 0;
        const videoPaddingBottom = style?.container?.paddingBottom || 0;
        const videoPaddingLeft = style?.container?.paddingLeft || 0;
        
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
        
        // Video wrapper style dengan width dan aspect ratio 16:9
        const videoWrapperStyle = {
          width: `${videoWidth}%`,
          maxWidth: "100%",
          aspectRatio: "16 / 9",
          position: "relative",
          overflow: "hidden",
          borderRadius: "8px",
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
                      borderRadius: "8px"
                    }}
                  />
                </div>
              ) : null
            ))}
          </div>
        );
      }

      case "testimoni": {
        const testimoniItems = content?.items || [];
        if (testimoniItems.length === 0) {
          return <div className="preview-placeholder">Belum ada testimoni</div>;
        }
        
        const currentIndex = testimoniIndices[block.order] || 0;
        const maxIndex = Math.max(0, testimoniItems.length - 3);
        
        const handlePrev = () => {
          setTestimoniIndices(prev => ({
            ...prev,
            [block.order]: Math.max(0, currentIndex - 1)
          }));
        };
        
        const handleNext = () => {
          setTestimoniIndices(prev => ({
            ...prev,
            [block.order]: Math.min(maxIndex, currentIndex + 1)
          }));
        };
        
        const testimoniTitle = content?.componentTitle || config?.title || "Testimoni Pembeli";
        
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
                            __html: item.isiTestimony || item.deskripsi || "<p>Deskripsi testimoni</p>" 
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
        
        const listTitle = content?.componentTitle || config?.title || "";
        const listData = {
          paddingTop: style?.container?.paddingTop || 0,
          paddingRight: style?.container?.paddingRight || 0,
          paddingBottom: style?.container?.paddingBottom || 0,
          paddingLeft: style?.container?.paddingLeft || 0,
          bgType: style?.container?.bgType || "none",
          bgColor: style?.container?.bgColor || "#ffffff",
          bgImage: style?.container?.bgImage || "",
        };
        
        // Build styles from advance settings
        const listStyles = {
          paddingTop: `${listData.paddingTop || 0}px`,
          paddingRight: `${listData.paddingRight || 0}px`,
          paddingBottom: `${listData.paddingBottom || 0}px`,
          paddingLeft: `${listData.paddingLeft || 0}px`,
        };
        
        // Background dari advance settings
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
                      <div className="preview-list-content" dangerouslySetInnerHTML={{ __html: content || `<p>Point ${i + 1}</p>` }} />
                    </li>
                  );
                })}
                <li className="preview-list-add-indicator">
                  <span>»</span>
                </li>
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
        
        return (
          <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            <section className="preview-form-section compact-form-section" aria-label="Order form">
              <h2 className="compact-form-title">Lengkapi Data:</h2>
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
                <div className="compact-field">
                  <label className="compact-label">Alamat <span className="required">*</span></label>
                  <textarea 
                    placeholder="Contoh: Jl. Peta Utara 1, No 62 RT 01/07" 
                    className="compact-input compact-textarea" 
                    rows={3}
                    value={customerForm.alamat}
                    onChange={(e) => {
                      setCustomerForm({ ...customerForm, alamat: e.target.value });
                      generateAlamatLengkap(e.target.value, ongkirAddress);
                    }}
                  />
                </div>
                
                {isFormBuku && (
                  <div className="compact-field">
                    <OngkirCalculator
                      onSelectOngkir={(info) => {
                        if (typeof info === 'object' && info.cost !== undefined) {
                          setOngkir(info.cost);
                          setOngkirInfo({ courier: info.courier || '', service: info.service || '' });
                        } else {
                          setOngkir(info);
                        }
                      }}
                      onAddressChange={(address) => {
                        setOngkirAddress(address);
                        generateAlamatLengkap(customerForm.alamat, address);
                      }}
                      defaultCourier="jne"
                      compact={true}
                    />
                  </div>
                )}
              </div>
            </section>

            <section className="preview-form-section rincian-pesanan-section" aria-label="Rincian Pesanan">
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
                      <div className="rincian-pesanan-name">Ongkir</div>
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

            <section className="preview-payment-section payment-section" aria-label="Payment methods">
              <h2 className="payment-title">Metode Pembayaran</h2>
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

      default:
        return (
          <div className="preview-placeholder">{type}</div>
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

  // Parse blocks dari landingpage array
  // Index 0 adalah settings, index 1+ adalah blocks
  const blocks = landingpage && Array.isArray(landingpage) 
    ? landingpage.filter((item, index) => index > 0 && item.type !== 'settings')
    : [];

  // Sort blocks by order - ensure numeric comparison and stable sort
  const sortedBlocks = [...blocks].sort((a, b) => {
    const orderA = typeof a.order === 'number' ? a.order : (typeof a.order === 'string' ? parseInt(a.order, 10) : Infinity);
    const orderB = typeof b.order === 'number' ? b.order : (typeof b.order === 'string' ? parseInt(b.order, 10) : Infinity);
    
    // If both orders are invalid, maintain original order
    if (isNaN(orderA) && isNaN(orderB)) {
      return 0;
    }
    if (isNaN(orderA)) return 1;
    if (isNaN(orderB)) return -1;
    
    return orderA - orderB;
  });

  // Ambil logo dari settings (jika ada)
  const settings = landingpage && Array.isArray(landingpage) && landingpage.length > 0 && landingpage[0].type === 'settings'
    ? landingpage[0]
    : null;
  const logoUrl = settings?.logo || '/assets/logo.png';

  return (
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
            {/* Render Blocks dari landingpage */}
            {sortedBlocks.map((block) => (
              <div key={block.order} className="canvas-preview-block">
                {renderBlock(block)}
              </div>
            ))}
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
    </div>
  );
}
