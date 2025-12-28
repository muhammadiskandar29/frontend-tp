"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import OngkirCalculator from "@/components/OngkirCalculator";
import { getDummyProduct, isDummyProduct } from "@/data/dummy-products";
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
  const [data, setData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [testimoniIndices, setTestimoniIndices] = useState({});

  const sumber = searchParams.get("utm_sumber") || "website";
  const salesWA = "6281234567890";

  const [customerForm, setCustomerForm] = useState({
    nama: "",
    wa: "",
    email: "",
    alamat: "",
    custom_value: [],
  });

  const [ongkir, setOngkir] = useState(0);
  const [ongkirInfo, setOngkirInfo] = useState({ courier: '', service: '' });
  const [downPayment, setDownPayment] = useState(0);
  const [ongkirAddress, setOngkirAddress] = useState({
    kota: "",
    kecamatan: "",
    kelurahan: "",
    kode_pos: "",
  });
  const [alamatLengkap, setAlamatLengkap] = useState("");
  const [validProductId, setValidProductId] = useState(null); // ID produk valid dari database (untuk dummy products)

  const formatPrice = (price) => {
    if (!price) return "0";
    const numPrice = typeof price === "string" ? parseInt(price.replace(/[^\d]/g, "")) : price;
    return (isNaN(numPrice) ? 0 : numPrice).toLocaleString("id-ID");
  };

  const formatPriceInput = (value) => {
    if (!value) return "";
    const numValue = typeof value === "string" ? parseInt(value.replace(/[^\d]/g, "")) : value;
    return isNaN(numValue) ? "" : `Rp ${numValue.toLocaleString("id-ID")}`;
  };

  const parsePriceInput = (value) => {
    if (!value) return 0;
    const numValue = parseInt(value.replace(/[^\d]/g, ""), 10);
    return isNaN(numValue) ? 0 : numValue;
  };

  const getKategoriId = () => {
    if (!data) return null;
    return data.kategori_id 
      || (data.kategori_rel?.id ? Number(data.kategori_rel.id) : null)
      || (data.kategori ? Number(data.kategori) : null);
  };

  const isKategoriBuku = () => {
    return getKategoriId() === 13;
  };

  const isKategoriWorkshop = () => {
    return getKategoriId() === 15;
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

  // Render Blocks
  const renderBlocks = (blocks, productData) => {
    if (!blocks || !Array.isArray(blocks)) return null;
    const sortedBlocks = [...blocks].sort((a, b) => (a.order || 0) - (b.order || 0));

    return sortedBlocks.map((block) => {
      switch (block.type) {
        case "text":
          return (
            <div key={block.id} className="canvas-preview-block">
              <div className="preview-text">{block.data.content || "Teks..."}</div>
            </div>
          );

        case "image":
          return (
            <div key={block.id} className="canvas-preview-block">
              {block.data.src ? (
                <div className="preview-image-wrapper">
                  <img 
                    src={block.data.src} 
                    alt={block.data.alt || ""} 
                    className="preview-image-full preview-image-auto-aspect"
                    loading="lazy"
                  />
                  {block.data.caption && <p className="preview-caption">{block.data.caption}</p>}
                </div>
              ) : (
                <div className="preview-placeholder">Gambar belum diupload</div>
              )}
            </div>
          );

        case "youtube":
        case "video":
          const videoItems = block.data.items || [];
          if (videoItems.length === 0) {
            return (
              <div key={block.id} className="canvas-preview-block">
                <div className="preview-placeholder">Belum ada video</div>
              </div>
            );
          }
          
          // Helper function untuk convert YouTube watch URL ke embed URL
          const convertToEmbedUrl = (url) => {
            if (!url) return null;
            // Jika sudah embed URL, return langsung
            if (url.includes("/embed/")) return url;
            // Jika watch URL, convert ke embed
            if (url.includes("watch?v=")) {
              const videoId = url.split("watch?v=")[1]?.split("&")[0];
              return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
            }
            // Jika short URL (youtu.be), convert ke embed
            if (url.includes("youtu.be/")) {
              const videoId = url.split("youtu.be/")[1]?.split("?")[0];
              return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
            }
            return url;
          };
          
          return (
            <div key={block.id} className="canvas-preview-block">
              <div className="preview-videos">
                {videoItems.map((item, i) => {
                  const embedUrl = item.embedUrl ? convertToEmbedUrl(item.embedUrl) : null;
                  return embedUrl ? (
                    <div key={i} className="preview-video-wrapper preview-video-thumbnail">
                      <iframe 
                        src={embedUrl} 
                        title={`Video ${i + 1}`} 
                        className="preview-video-iframe" 
                        allowFullScreen 
                      />
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          );

        case "testimoni":
          const testimoniItems = block.data.items || [];
          if (testimoniItems.length === 0) {
            return (
              <div key={block.id} className="canvas-preview-block">
                <div className="preview-placeholder">Belum ada testimoni</div>
              </div>
            );
          }
          
          const currentIndex = testimoniIndices[block.id] || 0;
          const maxIndex = Math.max(0, testimoniItems.length - 3);
          
          const handlePrev = () => {
            setTestimoniIndices(prev => ({
              ...prev,
              [block.id]: Math.max(0, currentIndex - 1)
            }));
          };
          
          const handleNext = () => {
            setTestimoniIndices(prev => ({
              ...prev,
              [block.id]: Math.min(maxIndex, currentIndex + 1)
            }));
          };
          
          return (
            <div key={block.id} className="canvas-preview-block">
              <section className="preview-testimonials" aria-label="Customer testimonials">
                <h2>Testimoni Pembeli</h2>
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
                      style={{ transform: `translateX(-${currentIndex * 28}%)` }}
                    >
                      {testimoniItems.map((item, i) => (
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
                              </div>
                              <div className="testi-stars-new">
                                <span className="star-new">★</span>
                                <span className="star-new">★</span>
                                <span className="star-new">★</span>
                                <span className="star-new">★</span>
                                <span className="star-new">★</span>
                              </div>
                            </div>
                          </div>
                          <div className="testi-desc-new" itemProp="reviewBody">{item.deskripsi || "Deskripsi testimoni"}</div>
                        </article>
                      ))}
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
            </div>
          );

        case "list":
          return (
            <div key={block.id} className="canvas-preview-block">
              <ul className="preview-list">
                {block.data.items?.map((item, i) => (
                  <li key={i}>{item.nama || `Point ${i + 1}`}</li>
                ))}
                {(!block.data.items || block.data.items.length === 0) && (
                  <div className="preview-placeholder">Belum ada list point</div>
                )}
              </ul>
            </div>
          );

        case "faq":
          const kategoriId = getKategoriId();
          const faqItems = getFAQByKategori(kategoriId);
          
          return (
            <div key={block.id} className="canvas-preview-block">
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

        case "form":
          const isFormBuku = getKategoriId() === 13;
          const isFormWorkshop = getKategoriId() === 15;
          
          return (
            <div key={block.id} className="canvas-preview-block">
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

                  {isFormWorkshop && (
                    <div className="compact-field">
                      <label className="compact-label">
                        Jumlah Down Payment <span className="required">*</span>
                      </label>
                      <input 
                        type="text" 
                        placeholder="Rp 0" 
                        className="compact-input"
                        value={formatPriceInput(downPayment)}
                        onChange={(e) => {
                          const value = e.target.value;
                          const parsed = parsePriceInput(value);
                          setDownPayment(parsed);
                        }}
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
                      Rp {formatPrice(productData?.harga_promo || productData?.harga_asli || 0)}
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
                  {isFormWorkshop && downPayment > 0 && (
                    <div className="rincian-pesanan-item">
                      <div className="rincian-pesanan-detail">
                        <div className="rincian-pesanan-name">Down Payment</div>
                      </div>
                      <div className="rincian-pesanan-price">Rp {formatPrice(downPayment)}</div>
                    </div>
                  )}
                  <div className="rincian-pesanan-divider"></div>
                  <div className="rincian-pesanan-total">
                    <span className="rincian-pesanan-total-label">Total</span>
                    <span className="rincian-pesanan-total-price">
                      Rp {formatPrice(
                        isFormWorkshop 
                          ? downPayment 
                          : (isFormBuku ? (parseInt(productData?.harga_promo || productData?.harga_asli || 0) + ongkir) : parseInt(productData?.harga_promo || productData?.harga_asli || 0))
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

        case "price":
          const hargaAsli = productData?.harga_asli || productData?.harga_coret || 0;
          const hargaPromo = productData?.harga_promo || productData?.harga_asli || 0;
          
          return (
            <div key={block.id} className="canvas-preview-block">
              <section className="preview-price-section special-offer-card" aria-label="Special offer" itemScope itemType="https://schema.org/Offer">
                <h2 className="special-offer-title">Special Offer!</h2>
                <div className="special-offer-price">
                  {hargaAsli > 0 && hargaAsli > hargaPromo && (
                    <span className="price-old" aria-label="Harga lama">
                      Rp {formatPrice(hargaAsli)}
                    </span>
                  )}
                  <span className="price-new" itemProp="price" content={hargaPromo}>
                    Rp {formatPrice(hargaPromo)}
                  </span>
                </div>
                <meta itemProp="priceCurrency" content="IDR" />
                <meta itemProp="availability" content="https://schema.org/InStock" />
              </section>
            </div>
          );

        default:
          return (
            <div key={block.id} className="canvas-preview-block">
              <div className="preview-placeholder">{block.type}</div>
            </div>
          );
      }
    });
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

    if (!data) {
      return toast.error("Data produk tidak valid");
    }
    
    const hargaProduk = parseInt(data.harga_promo || data.harga_asli || '0', 10);
    const ongkirValue = isKategoriBuku() ? (ongkir || 0) : 0;
    const downPaymentValue = isKategoriWorkshop() ? (downPayment || 0) : 0;
    
    const totalHarga = isKategoriWorkshop() 
      ? downPaymentValue 
      : (isKategoriBuku() ? hargaProduk + ongkirValue : hargaProduk);

    // Untuk dummy products, gunakan validProductId jika ada, jika tidak gunakan data.id
    // Backend akan validasi produk ID, jadi kita perlu ID yang valid dari database
    const productIdToUse = isDummyProduct(kode_produk) && validProductId 
      ? validProductId 
      : parseInt(data.id, 10);
    
    // Jika dummy product dan tidak ada validProductId, tampilkan warning
    if (isDummyProduct(kode_produk) && !validProductId) {
      console.warn("[PRODUCT] ⚠️ Dummy product tanpa validProductId, akan menggunakan dummy ID:", data.id);
      console.warn("[PRODUCT] ⚠️ Backend mungkin akan error karena produk ID tidak ditemukan di database");
      console.warn("[PRODUCT] 💡 Solusi: Pastikan ada produk real di database, atau buat produk dummy di backend");
    }
    
    const isWorkshop = isKategoriWorkshop();
    const kategoriId = getKategoriId();
    
    console.log("[PRODUCT] Submitting order with product ID:", productIdToUse, {
      isDummy: isDummyProduct(kode_produk),
      validProductId: validProductId,
      dataId: data.id,
      willUse: productIdToUse,
      kategoriId: kategoriId,
      isWorkshop: isWorkshop,
      kategori: data.kategori,
      kategori_rel: data.kategori_rel
    });

    const payload = {
      nama: customerForm.nama,
      wa: customerForm.wa,
      email: customerForm.email,
      alamat: alamatLengkap || customerForm.alamat || '',
      produk: productIdToUse, // Gunakan validProductId untuk dummy products
      harga: String(hargaProduk),
      ongkir: String(ongkirValue),
      down_payment: isWorkshop ? String(downPaymentValue) : undefined,
      total_harga: String(totalHarga),
      metode_bayar: paymentMethod,
      sumber: sumber || 'website',
      custom_value: Array.isArray(customerForm.custom_value) 
        ? customerForm.custom_value 
        : (customerForm.custom_value ? [customerForm.custom_value] : []),
      // Untuk Workshop (kategori 15), tambahkan status_pembayaran: 4
      ...(isWorkshop ? { status_pembayaran: 4 } : {}),
      // Tambahkan flag untuk dummy products (opsional, untuk tracking)
      ...(isDummyProduct(kode_produk) ? { dummy_product_kode: kode_produk } : {}),
    };

    console.log("[PRODUCT] Order payload:", {
      ...payload,
      hasStatusPembayaran: payload.status_pembayaran !== undefined,
      statusPembayaran: payload.status_pembayaran,
      hasDownPayment: payload.down_payment !== undefined,
      downPayment: payload.down_payment
    });

    try {
      const { product_name, ...orderPayload } = payload;
      
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const order = await response.json();
      
      console.log("📥 Order response:", order);

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

      const hargaProdukFinal = parseInt(data.harga_promo || data.harga_asli || '0', 10);
      const ongkirValueFinal = isKategoriBuku() ? (ongkir || 0) : 0;
      const downPaymentValueFinal = isKategoriWorkshop() ? (downPayment || 0) : 0;
      const totalHargaFinal = isKategoriWorkshop() 
        ? downPaymentValueFinal 
        : (isKategoriBuku() ? hargaProdukFinal + ongkirValueFinal : hargaProdukFinal);

      const pendingOrder = {
        orderId: orderId,
        customerId: customerId,
        nama: customerForm.nama,
        wa: customerForm.wa,
        email: customerForm.email,
        productName: data.nama || "Produk",
        totalHarga: String(totalHargaFinal),
        paymentMethod: paymentMethod,
        landingUrl: window.location.pathname,
      };

      console.log("📦 [PRODUCT] Saving pending order:", pendingOrder);
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

  // Fetch Data
  useEffect(() => {
    async function fetchData() {
      try {
        // Check dummy product first
        if (isDummyProduct(kode_produk)) {
          const dummyData = getDummyProduct(kode_produk);
          if (dummyData) {
            console.log("[PRODUCT] Using dummy product:", kode_produk);
            setData(dummyData);
            
            // Untuk dummy products, kita perlu produk ID yang valid dari database
            // Fetch produk pertama yang ada di database untuk digunakan sebagai fallback
            try {
              const token = localStorage.getItem("token");
              const headers = token ? { Authorization: `Bearer ${token}` } : {};
              
              const productsRes = await fetch("/api/sales/produk", { headers });
              const productsJson = await productsRes.json();
              
              if (productsJson.success && Array.isArray(productsJson.data) && productsJson.data.length > 0) {
                // Ambil produk pertama yang aktif
                const firstProduct = productsJson.data.find(p => p.status === "1" || p.status === 1) || productsJson.data[0];
                if (firstProduct && firstProduct.id) {
                  console.log("[PRODUCT] Using valid product ID for dummy product:", firstProduct.id);
                  setValidProductId(Number(firstProduct.id));
                }
              }
            } catch (err) {
              console.warn("[PRODUCT] Failed to fetch valid product ID, will use dummy ID:", err);
              // Jika gagal fetch, tetap gunakan dummy ID (backend akan handle error)
            }
            
            return;
          }
        }

        // TODO: Fetch dari API untuk produk real (nanti saat backend siap)
        // const res = await fetch(`/api/product/${kode_produk}`, { cache: "no-store" });
        // const json = await res.json();
        // if (json.success && json.data) {
        //   setData(json.data);
        // }

      } catch (err) {
        console.error("Product fetch failed:", err);
      }
    }

    fetchData();
  }, [kode_produk]);

  if (!data) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Memuat produk...</p>
      </div>
    );
  }

  return (
    <div className="add-products3-container" itemScope itemType="https://schema.org/Product">
      <div className="page-builder-canvas">
        <div className="canvas-wrapper">
          {/* Nama Produk - Selalu muncul di paling atas */}
          {data.nama && (
            <div className="canvas-preview-block canvas-product-title-block">
              <h1 className="preview-product-title" itemProp="name">{data.nama}</h1>
            </div>
          )}
          
          {/* Render Blocks */}
          {data.blocks && renderBlocks(data.blocks, data)}
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

