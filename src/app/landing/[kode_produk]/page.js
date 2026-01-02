"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import OngkirCalculator from "@/components/OngkirCalculator";
import { getDummyProduct, isDummyProduct } from "@/data/dummy-products";
import "@/styles/sales/landing.css";
import "@/styles/sales/add-products3.css"; // Import canvas style

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

export default function LandingPage() {
  const { kode_produk } = useParams();
  const searchParams = useSearchParams();

  const [paymentMethod, setPaymentMethod] = useState(""); // cc | ewallet | va | manual
  const [data, setData] = useState(null);
  const [submitting, setSubmitting] = useState(false); // Prevent double-click
  const [testimoniIndex, setTestimoniIndex] = useState(0); // For testimoni carousel (old format)
  const [testimoniIndices, setTestimoniIndices] = useState({}); // For testimoni carousel (blocks format)

  const sumber = searchParams.get("utm_sumber") || "website";
  
  // WhatsApp Sales Admin - bisa diambil dari data produk (assign) atau hardcode
  const salesWA = "6281234567890"; // Format: 62xxxxxxxxxx (tanpa +)

  const [customerForm, setCustomerForm] = useState({
    nama: "",
    wa: "",
    email: "",
    alamat: "", // Alamat dasar yang diketik user
    custom_value: [],
  });

  const [ongkir, setOngkir] = useState(0); // Ongkir dalam rupiah
  const [ongkirInfo, setOngkirInfo] = useState({ courier: '', service: '' }); // Info courier dan service
  
  // Down Payment untuk Workshop (kategori 15)
  const [downPayment, setDownPayment] = useState(0); // Down payment dalam rupiah
  
  // Debug: log ongkir changes
  useEffect(() => {
    console.log('[LANDING] ongkir state changed:', ongkir);
  }, [ongkir]);
  const [ongkirAddress, setOngkirAddress] = useState({
    kota: "",
    kecamatan: "",
    kelurahan: "", // Kelurahan/Kabupaten
    kode_pos: "",
  }); // Detail ongkir untuk hitung ongkir dan generate alamat lengkap
  const [alamatLengkap, setAlamatLengkap] = useState(""); // Alamat lengkap yang dikirim ke backend

  const formatPrice = (price) => {
    if (!price) return "0";
    const numPrice = typeof price === "string" ? parseInt(price.replace(/[^\d]/g, "")) : price;
    return (isNaN(numPrice) ? 0 : numPrice).toLocaleString("id-ID");
  };

  // Format price untuk input (dengan Rp prefix)
  const formatPriceInput = (value) => {
    if (!value) return "";
    const numValue = typeof value === "string" ? parseInt(value.replace(/[^\d]/g, "")) : value;
    return isNaN(numValue) ? "" : `Rp ${numValue.toLocaleString("id-ID")}`;
  };

  // Parse price dari input format "Rp 1.000.000"
  const parsePriceInput = (value) => {
    if (!value) return 0;
    const numValue = parseInt(value.replace(/[^\d]/g, ""), 10);
    return isNaN(numValue) ? 0 : numValue;
  };

  // Get kategori ID dari data
  const getKategoriId = () => {
    if (!data) return null;
    return data.kategori_id 
      || (data.kategori_rel?.id ? Number(data.kategori_rel.id) : null)
      || (data.kategori ? Number(data.kategori) : null);
  };

  // Check apakah kategori memerlukan ongkir (kategori 13 = Buku)
  const isKategoriBuku = () => {
    return getKategoriId() === 13;
  };

  // Check apakah kategori Workshop (kategori 15)
  const isKategoriWorkshop = () => {
    return getKategoriId() === 15;
  };

  // ============================
  // FAQ MAPPING PER KATEGORI
  // ============================
  const getFAQByKategori = (kategoriId) => {
    const faqMap = {
      10: [ // Ebook
        {
          question: "Apa yang akan saya dapatkan dari Ebook ini?",
          answer: "Dengan membeli Ebook ini, Anda akan mendapatkan panduan lengkap dan praktis yang dapat diakses kapan saja. Ebook ini berisi materi yang telah disusun secara sistematis untuk membantu Anda memahami topik secara mendalam. Format PDF yang mudah dibaca di berbagai perangkat."
        },
        {
          question: "Bagaimana cara mengakses Ebook setelah pembayaran?",
          answer: "Setelah pembayaran Anda dikonfirmasi, Anda akan menerima email berisi link download Ebook. Link tersebut dapat digunakan untuk mengunduh file PDF yang dapat Anda simpan dan baca kapan saja. Tidak ada batasan waktu untuk mengakses Ebook ini."
        },
        {
          question: "Apakah Ebook ini bisa diakses offline?",
          answer: "Ya, setelah Anda mengunduh file PDF, Ebook dapat dibaca secara offline di perangkat Anda. Anda dapat menyimpannya di smartphone, tablet, atau laptop untuk dibaca kapan saja tanpa perlu koneksi internet."
        },
        {
          question: "Apakah ada update untuk Ebook ini?",
          answer: "Jika ada update atau revisi materi, Anda akan mendapatkan notifikasi via email dan dapat mengunduh versi terbaru secara gratis. Kami selalu berkomitmen untuk memberikan konten yang terupdate dan relevan."
        },
        {
          question: "Bisakah saya membagikan Ebook ini ke orang lain?",
          answer: "Ebook ini adalah produk berbayar dengan hak cipta. Setiap pembelian hanya untuk penggunaan pribadi. Kami tidak mengizinkan pembagian atau distribusi tanpa izin. Jika Anda ingin membagikan, silakan ajak teman untuk membeli secara terpisah."
        },
        {
          question: "Apakah ada garansi uang kembali?",
          answer: "Kami memberikan garansi kepuasan 7 hari. Jika Anda merasa tidak puas dengan konten Ebook, silakan hubungi customer service kami untuk proses refund. Kami akan mengembalikan 100% uang Anda tanpa pertanyaan."
        },
        {
          question: "Bagaimana jika saya mengalami masalah saat download?",
          answer: "Jika Anda mengalami kendala saat download atau mengakses Ebook, silakan hubungi customer service kami melalui WhatsApp atau email. Tim kami siap membantu Anda menyelesaikan masalah dengan cepat."
        }
      ],
      11: [ // Webinar
        {
          question: "Bagaimana cara mengakses Webinar setelah pembayaran?",
          answer: "Setelah pembayaran Anda dikonfirmasi, Anda akan menerima email berisi link akses Webinar dan detail meeting (Zoom/Google Meet). Link tersebut dapat digunakan untuk bergabung pada waktu yang telah ditentukan. Pastikan Anda sudah menyiapkan koneksi internet yang stabil."
        },
        {
          question: "Kapan Webinar akan dilaksanakan?",
          answer: "Jadwal Webinar akan dikirimkan melalui email setelah pembayaran dikonfirmasi. Biasanya Webinar dilaksanakan pada hari kerja atau weekend sesuai dengan kesepakatan. Anda akan mendapatkan reminder 1 hari sebelum acara dimulai."
        },
        {
          question: "Apakah Webinar ini akan direkam?",
          answer: "Ya, Webinar akan direkam dan rekaman akan dikirimkan ke email Anda setelah acara selesai. Dengan demikian, Anda dapat menonton ulang kapan saja jika melewatkan sesi atau ingin mengulang materi tertentu."
        },
        {
          question: "Bagaimana jika saya tidak bisa hadir di waktu yang ditentukan?",
          answer: "Tidak masalah! Anda tetap akan mendapatkan rekaman lengkap Webinar yang dapat ditonton kapan saja. Rekaman akan dikirimkan maksimal 24 jam setelah acara selesai. Anda juga bisa mengajukan pertanyaan via email jika ada yang ingin ditanyakan."
        },
        {
          question: "Apakah ada sesi tanya jawab dalam Webinar?",
          answer: "Ya, setiap Webinar menyediakan sesi Q&A di akhir acara. Anda dapat mengajukan pertanyaan langsung kepada pembicara. Jika waktu terbatas, pertanyaan yang tidak sempat dijawab akan dijawab via email setelah Webinar selesai."
        },
        {
          question: "Perangkat apa saja yang bisa digunakan untuk mengikuti Webinar?",
          answer: "Anda dapat mengikuti Webinar menggunakan laptop, smartphone, atau tablet. Pastikan perangkat Anda memiliki aplikasi Zoom atau Google Meet (tergantung platform yang digunakan) dan koneksi internet yang stabil untuk pengalaman terbaik."
        },
        {
          question: "Apakah saya bisa mendapatkan sertifikat setelah Webinar?",
          answer: "Ya, peserta yang mengikuti Webinar hingga selesai akan mendapatkan sertifikat digital yang dikirimkan via email. Sertifikat ini dapat digunakan untuk keperluan profesional atau portofolio Anda."
        }
      ],
      12: [ // Seminar
        {
          question: "Apa saja yang akan dibahas dalam Seminar ini?",
          answer: "Seminar ini akan membahas berbagai topik penting mulai dari dasar-dasar hingga strategi lanjutan. Anda akan mendapatkan insight langsung dari para ahli, kesempatan networking dengan peserta lain, dan materi yang dapat langsung diterapkan dalam bisnis atau karir Anda."
        },
        {
          question: "Dimana lokasi Seminar akan dilaksanakan?",
          answer: "Lokasi Seminar akan dikirimkan melalui email setelah pembayaran dikonfirmasi. Biasanya dilaksanakan di hotel atau venue yang mudah dijangkau dengan fasilitas lengkap. Pastikan Anda sudah mengetahui lokasi dan rute perjalanan sebelum hari H."
        },
        {
          question: "Apakah ada makan siang dan coffee break?",
          answer: "Ya, setiap Seminar menyediakan coffee break dan makan siang untuk semua peserta. Menu akan disesuaikan dengan durasi acara. Jika Anda memiliki kebutuhan diet khusus, silakan informasikan saat registrasi."
        },
        {
          question: "Bagaimana jika saya tidak bisa hadir di hari Seminar?",
          answer: "Jika Anda tidak bisa hadir, silakan hubungi customer service minimal 3 hari sebelum acara untuk reschedule atau refund. Kami akan membantu mencari solusi terbaik sesuai dengan kebijakan yang berlaku."
        },
        {
          question: "Apakah saya bisa mendapatkan materi Seminar?",
          answer: "Ya, semua peserta akan mendapatkan materi Seminar dalam bentuk softcopy yang dikirimkan via email setelah acara. Materi ini dapat Anda gunakan sebagai referensi dan panduan untuk implementasi selanjutnya."
        },
        {
          question: "Apakah ada sesi networking dalam Seminar?",
          answer: "Ya, Seminar ini menyediakan waktu khusus untuk networking session dimana Anda dapat berinteraksi dengan peserta lain dan pembicara. Ini adalah kesempatan emas untuk memperluas jaringan profesional Anda."
        },
        {
          question: "Apakah Seminar ini memberikan sertifikat?",
          answer: "Ya, peserta yang hadir dan mengikuti Seminar hingga selesai akan mendapatkan sertifikat kehadiran yang dapat diambil di lokasi atau dikirimkan via email dalam bentuk digital. Sertifikat ini dapat digunakan untuk keperluan profesional."
        }
      ],
      13: [ // Buku
        {
          question: "Apakah Buku ini tersedia dalam format digital?",
          answer: "Buku ini tersedia dalam format fisik yang akan dikirimkan ke alamat Anda. Setelah pembayaran dan konfirmasi alamat, buku akan dikirim menggunakan jasa kurir. Estimasi pengiriman 3-7 hari kerja tergantung lokasi Anda."
        },
        {
          question: "Berapa lama waktu pengiriman Buku?",
          answer: "Waktu pengiriman bervariasi tergantung lokasi tujuan. Untuk area Jabodetabek biasanya 2-3 hari kerja, sedangkan untuk luar kota bisa 5-7 hari kerja. Anda akan mendapatkan nomor resi untuk tracking pengiriman."
        },
        {
          question: "Apakah ongkir sudah termasuk dalam harga?",
          answer: "Ongkir dihitung terpisah berdasarkan alamat pengiriman Anda. Setelah Anda mengisi alamat lengkap, sistem akan menghitung ongkir secara otomatis. Anda dapat memilih kurir dan layanan pengiriman yang diinginkan."
        },
        {
          question: "Bagaimana jika Buku yang diterima rusak?",
          answer: "Jika Buku yang Anda terima dalam kondisi rusak atau tidak sesuai, silakan hubungi customer service kami dengan foto bukti. Kami akan mengganti dengan buku baru atau mengembalikan uang Anda sesuai kebijakan garansi."
        },
        {
          question: "Apakah Buku ini bisa dikirim ke luar negeri?",
          answer: "Saat ini pengiriman hanya untuk wilayah Indonesia. Untuk pengiriman ke luar negeri, silakan hubungi customer service terlebih dahulu untuk informasi ongkir dan estimasi waktu pengiriman yang lebih detail."
        },
        {
          question: "Apakah ada edisi terbaru dari Buku ini?",
          answer: "Jika ada edisi terbaru atau revisi, informasi akan dikirimkan via email kepada pembeli. Kami selalu berusaha memberikan konten yang terupdate dan relevan untuk pembaca."
        },
        {
          question: "Bisakah saya membeli Buku ini sebagai hadiah untuk orang lain?",
          answer: "Tentu saja! Saat checkout, Anda dapat mengisi alamat pengiriman yang berbeda dengan alamat Anda. Buku akan dikirim langsung ke alamat yang Anda tentukan dengan catatan khusus jika diperlukan."
        }
      ],
      14: [ // Ecourse
        {
          question: "Berapa lama akses Ecourse ini berlaku?",
          answer: "Akses Ecourse ini berlaku seumur hidup. Setelah pembayaran dikonfirmasi, Anda dapat mengakses semua materi kapan saja dan mempelajarinya sesuai dengan kecepatan Anda sendiri. Tidak ada batasan waktu untuk menyelesaikan course."
        },
        {
          question: "Bagaimana cara mengakses Ecourse setelah pembayaran?",
          answer: "Setelah pembayaran dikonfirmasi, Anda akan menerima email berisi link akses ke platform Ecourse dan kredensial login. Anda dapat langsung mulai belajar melalui dashboard yang telah disediakan."
        },
        {
          question: "Apakah Ecourse ini bisa diakses dari smartphone?",
          answer: "Ya, platform Ecourse kami responsive dan dapat diakses melalui smartphone, tablet, atau laptop. Anda dapat belajar kapan saja dan dimana saja dengan koneksi internet yang stabil."
        },
        {
          question: "Apakah ada tugas atau quiz dalam Ecourse ini?",
          answer: "Ya, Ecourse ini dilengkapi dengan quiz dan tugas praktis di setiap modul untuk memastikan Anda memahami materi. Setelah menyelesaikan semua modul, Anda akan mendapatkan sertifikat penyelesaian."
        },
        {
          question: "Apakah ada support dari mentor selama belajar?",
          answer: "Ya, Anda akan mendapatkan akses ke grup diskusi atau forum dimana Anda dapat bertanya kepada mentor dan berdiskusi dengan peserta lain. Mentor akan merespons pertanyaan Anda dalam waktu 24-48 jam."
        },
        {
          question: "Apakah materi Ecourse akan diupdate?",
          answer: "Ya, kami secara berkala mengupdate materi Ecourse untuk memastikan konten tetap relevan dan terbaru. Semua update akan otomatis tersedia untuk Anda tanpa biaya tambahan."
        },
        {
          question: "Apakah saya bisa mendapatkan refund jika tidak puas?",
          answer: "Kami memberikan garansi kepuasan 14 hari. Jika Anda merasa tidak puas dengan Ecourse, silakan hubungi customer service untuk proses refund. Kami akan mengembalikan 100% uang Anda."
        }
      ],
      15: [ // Workshop
        {
          question: "Apa yang membedakan Workshop ini dengan yang lain?",
          answer: "Workshop ini dirancang dengan pendekatan praktis dan interaktif. Anda akan mendapatkan hands-on experience, feedback langsung dari mentor, dan kesempatan untuk berdiskusi dengan peserta lain. Materi disusun berdasarkan pengalaman nyata di lapangan."
        },
        {
          question: "Berapa jumlah Down Payment yang harus dibayar?",
          answer: "Down Payment dapat Anda tentukan sendiri sesuai dengan kemampuan. Minimum down payment adalah 30% dari total harga Workshop. Sisa pembayaran dapat dilunasi sebelum atau saat Workshop dimulai."
        },
        {
          question: "Kapan sisa pembayaran harus dilunasi?",
          answer: "Sisa pembayaran dapat dilunasi kapan saja sebelum Workshop dimulai atau saat registrasi di lokasi. Kami akan mengirimkan reminder via email dan WhatsApp untuk memastikan pembayaran Anda lengkap."
        },
        {
          question: "Apakah Workshop ini menyediakan sertifikat?",
          answer: "Ya, peserta yang mengikuti Workshop hingga selesai dan menyelesaikan semua tugas praktis akan mendapatkan sertifikat penyelesaian. Sertifikat ini dapat digunakan untuk keperluan profesional atau portofolio."
        },
        {
          question: "Berapa jumlah peserta dalam satu batch Workshop?",
          answer: "Workshop ini dibatasi maksimal 20-30 peserta per batch untuk memastikan kualitas pembelajaran dan interaksi yang optimal. Dengan jumlah terbatas, mentor dapat memberikan perhatian lebih kepada setiap peserta."
        },
        {
          question: "Apakah ada materi yang bisa dibawa pulang?",
          answer: "Ya, semua peserta akan mendapatkan modul Workshop, worksheet, dan materi pendukung lainnya yang dapat dibawa pulang. Materi ini akan membantu Anda mengimplementasikan ilmu yang didapat setelah Workshop selesai."
        },
        {
          question: "Bagaimana jika saya tidak bisa hadir di hari Workshop?",
          answer: "Jika Anda tidak bisa hadir, silakan hubungi customer service minimal 7 hari sebelum acara untuk reschedule ke batch berikutnya. Down payment yang sudah dibayar tetap berlaku untuk batch yang baru."
        }
      ],
      16: [ // Private Mentoring
        {
          question: "Bagaimana sistem Private Mentoring ini berjalan?",
          answer: "Private Mentoring memberikan Anda akses eksklusif untuk konsultasi langsung dengan mentor berpengalaman. Anda akan mendapatkan sesi one-on-one yang disesuaikan dengan kebutuhan dan tujuan Anda, dengan jadwal yang fleksibel sesuai kesepakatan."
        },
        {
          question: "Berapa lama durasi satu sesi Private Mentoring?",
          answer: "Satu sesi Private Mentoring biasanya berdurasi 60-90 menit. Durasi dapat disesuaikan sesuai kebutuhan Anda. Anda dapat membahas topik spesifik yang ingin dipelajari atau mendapatkan solusi untuk masalah yang sedang dihadapi."
        },
        {
          question: "Bagaimana cara menentukan jadwal sesi?",
          answer: "Setelah pembayaran dikonfirmasi, tim kami akan menghubungi Anda untuk koordinasi jadwal. Anda dapat memilih waktu yang paling sesuai dengan aktivitas Anda. Sesi dapat dilakukan via Zoom, Google Meet, atau offline sesuai kesepakatan."
        },
        {
          question: "Apakah saya bisa memilih mentor yang diinginkan?",
          answer: "Ya, Anda dapat memilih mentor sesuai dengan expertise yang dibutuhkan. Tim kami akan membantu menyesuaikan mentor terbaik berdasarkan kebutuhan dan tujuan Anda. Jika ada mentor spesifik yang diinginkan, silakan informasikan saat registrasi."
        },
        {
          question: "Berapa banyak sesi yang saya dapatkan?",
          answer: "Jumlah sesi tergantung pada paket yang Anda pilih. Setiap paket memiliki jumlah sesi yang berbeda. Detail jumlah sesi akan dikirimkan via email setelah pembayaran dikonfirmasi."
        },
        {
          question: "Apakah sesi Private Mentoring direkam?",
          answer: "Sesi dapat direkam atas permintaan Anda. Rekaman akan dikirimkan via email setelah sesi selesai sehingga Anda dapat menonton ulang atau membuat catatan tambahan. Privasi dan kerahasiaan informasi Anda dijamin."
        },
        {
          question: "Apakah ada follow-up setelah sesi selesai?",
          answer: "Ya, setelah setiap sesi, mentor akan memberikan action plan dan follow-up via email. Anda juga dapat mengajukan pertanyaan lanjutan melalui email atau WhatsApp dalam waktu 7 hari setelah sesi."
        }
      ]
    };

    // Default FAQ jika kategori tidak ditemukan
    const defaultFAQ = [
      {
        question: "Bagaimana cara mengakses produk setelah pembayaran?",
        answer: "Setelah pembayaran Anda dikonfirmasi, Anda akan menerima email berisi instruksi akses dan detail produk. Silakan ikuti langkah-langkah yang tertera untuk mulai menggunakan produk."
      },
      {
        question: "Apakah ada garansi untuk produk ini?",
        answer: "Ya, kami memberikan garansi kepuasan untuk semua produk kami. Jika Anda tidak puas, silakan hubungi customer service untuk proses refund atau pertukaran sesuai dengan kebijakan yang berlaku."
      }
    ];

    return faqMap[kategoriId] || defaultFAQ;
  };

  // ============================
  // RENDER BLOCKS (Canvas Style)
  // Untuk produk dengan format blocks
  // ============================

  const renderBlocks = (blocks, productData) => {
    if (!blocks || !Array.isArray(blocks)) return null;

    // Sort blocks by order
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
                    className="preview-image-full"
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
          return (
            <div key={block.id} className="canvas-preview-block">
              <div className="preview-videos">
                {videoItems.map((item, i) => (
                  item.embedUrl ? (
                    <div key={i} className="preview-video-wrapper">
                      <iframe 
                        src={item.embedUrl} 
                        title={`Video ${i + 1}`} 
                        className="preview-video-iframe" 
                        allowFullScreen 
                      />
                    </div>
                  ) : null
                ))}
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
              {/* Form Pemesanan */}
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
                  
                  {/* Form Ongkir - Kategori Buku (13) */}
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

                  {/* Form Down Payment - Kategori Workshop (15) */}
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

              {/* Rincian Pesanan */}
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
                    <>
                      <div className="rincian-pesanan-item">
                        <div className="rincian-pesanan-detail">
                          <div className="rincian-pesanan-name">Ongkir</div>
                        </div>
                        <div className="rincian-pesanan-price">Rp {formatPrice(ongkir)}</div>
                      </div>
                    </>
                  )}
                  {isFormWorkshop && downPayment > 0 && (
                    <>
                      <div className="rincian-pesanan-item">
                        <div className="rincian-pesanan-detail">
                          <div className="rincian-pesanan-name">Down Payment</div>
                        </div>
                        <div className="rincian-pesanan-price">Rp {formatPrice(downPayment)}</div>
                      </div>
                    </>
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

              {/* Payment Section */}
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

              {/* Button Pesan Sekarang */}
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

  // Generate alamat lengkap dengan format: "alamat dasar, kec. [kecamatan], kel/kab. [kelurahan], kode pos [kode pos]"
  const generateAlamatLengkap = (alamatDasar, addressDetail) => {
    const parts = [];
    
    // Alamat dasar
    if (alamatDasar && alamatDasar.trim()) {
      parts.push(alamatDasar.trim());
    }
    
    // Detail ongkir
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

  /**
   * Helper: Build image URL dari path backend
   * Backend mengembalikan path tanpa "storage/" prefix, contoh: "produk/header/xxx.png"
   * Frontend harus generate: /api/image?path=produk/header/xxx.png
   * Proxy akan menambahkan /storage/ prefix
   */
  const buildImageUrl = (path) => {
    if (!path) return "";
    if (typeof path !== "string") return "";
    
    // Jika sudah absolute HTTPS URL, return langsung
    if (path.startsWith("https://")) return path;
    
    // Bersihkan path
    let cleanPath = path;
    
    // Jika path adalah full URL HTTP, extract pathname saja
    if (path.startsWith("http://")) {
      try {
        const url = new URL(path);
        cleanPath = url.pathname;
      } catch {
        cleanPath = path;
      }
    }
    
    // Normalize backslashes to forward slashes (untuk Windows path)
    cleanPath = cleanPath.replace(/\\/g, "/");
    
    // Hapus leading slash jika ada (proxy akan handle)
    cleanPath = cleanPath.replace(/^\/+/, "");
    
    // Hapus "storage/" prefix jika sudah ada (proxy akan menambahkan)
    cleanPath = cleanPath.replace(/^storage\//, "");
    
    // Hapus double slash
    cleanPath = cleanPath.replace(/\/+/g, "/");
    
    // Encode URL untuk handle special characters
    const encodedPath = encodeURIComponent(cleanPath);
    
    // Gunakan proxy untuk menghindari mixed content HTTPS/HTTP
    return `/api/image?path=${encodedPath}`;
  };

  const resolveHeaderSource = (header) => {
    if (!header) return "";
    let rawPath = "";
    if (typeof header === "string") {
      rawPath = header;
    } else if (header?.path && typeof header.path === "string") {
      rawPath = header.path;
    } else if (header?.value && typeof header.value === "string") {
      rawPath = header.value;
    }
    // Normalize backslashes to forward slashes
    if (rawPath) {
      rawPath = rawPath.replace(/\\/g, '/');
    }
    return buildImageUrl(rawPath);
  };

  // --- SAFE JSON ---
  const safeParse = (value, fallback) => {
    if (!value) return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  // --- FETCH PRODUK ---
  useEffect(() => {
    async function fetchData() {
      try {
        // Check dummy product first (untuk testing sebelum backend siap)
        if (isDummyProduct(kode_produk)) {
          const dummyData = getDummyProduct(kode_produk);
          if (dummyData) {
            console.log("[LANDING] Using dummy product:", kode_produk);
            setData(dummyData);
            return;
          }
        }

        // Fetch dari API (produk real)
        const res = await fetch(`/api/landing/${kode_produk}`, {
          cache: "no-store",
        });
        
        const json = await res.json();

        if (!json.success || !json.data) return setData(null);

        const d = json.data;

        // Parse gambar dan testimoni dengan handle escaped backslashes
        const parsedGambar = safeParse(d.gambar, []);
        const parsedTestimoni = safeParse(d.testimoni, []);
        
        // Normalize path di gambar (handle escaped backslashes dari JSON string)
        const normalizedGambar = Array.isArray(parsedGambar) 
          ? parsedGambar.map(g => ({
              ...g,
              path: typeof g.path === 'string' ? g.path.replace(/\\/g, '/') : g.path
            }))
          : [];
        
        // Normalize path di testimoni
        const normalizedTestimoni = Array.isArray(parsedTestimoni)
          ? parsedTestimoni.map(t => ({
              ...t,
              gambar: typeof t.gambar === 'string' ? t.gambar.replace(/\\/g, '/') : t.gambar
            }))
          : [];

        // Normalize header path juga
        const normalizedHeader = typeof d.header === 'string' 
          ? d.header.replace(/\\/g, '/') 
          : d.header;

        // Get kategori ID dari data
        const kategoriId = d.kategori_rel?.id 
          ? Number(d.kategori_rel.id) 
          : (d.kategori ? Number(d.kategori) : null);

        setData({
          ...d,
          header: normalizedHeader, // Normalize header path
          product_name: d.nama,
          landingpage: d.landingpage || "1", // 1 = non-fisik, 2 = fisik (backward compatibility)
          kategori_id: kategoriId, // Kategori ID untuk template selection
          kategori_rel: d.kategori_rel || null, // Kategori relation
          gambar: normalizedGambar,
          custom_field: safeParse(d.custom_field, []),
          assign: safeParse(d.assign, []),
          video: safeParse(d.video, []),
          testimoni: normalizedTestimoni,
          list_point: safeParse(d.list_point, []),
          fb_pixel: safeParse(d.fb_pixel, []),
          event_fb_pixel: safeParse(d.event_fb_pixel, []),
          gtm: safeParse(d.gtm, []),
        });
      } catch (err) {
        console.error("Landing fetch failed:", err);
      }
    }

    fetchData();
  }, [kode_produk]);

  // SEO Meta Tags & Structured Data - Optimized
  useEffect(() => {
    if (!data) return;

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    // resolveHeaderSource sudah mengembalikan absolute URL
    // Add null check for data.header
    const fullImageUrl = data?.header ? resolveHeaderSource(data.header) : "";

    // Update document title - Gunakan page_title jika ada, jika tidak gunakan nama produk
    const title = data.page_title 
      ? data.page_title 
      : `${data.nama} - Beli Sekarang | Ternak Properti`;
    document.title = title;

    // Update meta description
    const description = data.deskripsi 
      ? `${data.deskripsi.substring(0, 155)}...` 
      : `Dapatkan ${data.nama} dengan harga terbaik. ${data.harga_asli ? `Hanya Rp ${formatPrice(data.harga_asli)}` : ''} - Tawaran terbatas!`;
    
    const updateMetaTag = (name, content, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let metaTag = document.querySelector(selector);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        if (isProperty) {
          metaTag.setAttribute('property', name);
        } else {
          metaTag.setAttribute('name', name);
        }
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    };

    // Basic Meta Tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', `${data.nama}, ${data.kategori_rel?.nama || 'Produk'}, Ternak Properti, Beli Online`);
    updateMetaTag('author', 'Ternak Properti');
    updateMetaTag('robots', 'index, follow');
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // Open Graph Tags - Gunakan title yang sama dengan document title
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', 'product', true);
    updateMetaTag('og:url', currentUrl, true);
    if (fullImageUrl) {
      updateMetaTag('og:image', fullImageUrl, true);
      updateMetaTag('og:image:width', '1200', true);
      updateMetaTag('og:image:height', '630', true);
      updateMetaTag('og:image:alt', data.nama, true);
    }
    updateMetaTag('og:site_name', 'Ternak Properti', true);
    updateMetaTag('og:locale', 'id_ID', true);

    // Twitter Card Tags
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    if (fullImageUrl) {
      updateMetaTag('twitter:image', fullImageUrl, true);
    }

    // Add structured data (JSON-LD) - Enhanced
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": data.nama,
      "description": data.deskripsi || description,
      "image": fullImageUrl ? [fullImageUrl] : [],
      "sku": data.kode || data.id?.toString(),
      "mpn": data.id?.toString(),
      "brand": {
        "@type": "Brand",
        "name": "Ternak Properti"
      },
      "category": data.kategori_rel?.nama || "Produk",
      "offers": {
        "@type": "Offer",
        "price": data.harga_asli || "0",
        "priceCurrency": "IDR",
        "availability": "https://schema.org/InStock",
        "url": currentUrl,
        "priceValidUntil": data.tanggal_event || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "seller": {
          "@type": "Organization",
          "name": "Ternak Properti"
        }
      },
      "aggregateRating": data.testimoni?.length > 0 ? {
        "@type": "AggregateRating",
        "ratingValue": "5",
        "reviewCount": data.testimoni.length.toString()
      } : undefined,
      "review": data.testimoni?.length > 0 ? data.testimoni.slice(0, 5).map(t => ({
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": t.nama
        },
        "reviewBody": t.deskripsi,
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5"
        }
      })) : undefined
    };

    // Remove undefined fields
    Object.keys(structuredData).forEach(key => {
      if (structuredData[key] === undefined) {
        delete structuredData[key];
      }
    });

    // Remove existing structured data
    const existingScript = document.getElementById('product-structured-data');
    if (existingScript) existingScript.remove();

    // Add new structured data
    const script = document.createElement('script');
    script.id = 'product-structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('product-structured-data');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [data]);

  // Safety check - ensure data exists before using
  // Return empty div instead of null to avoid loading indicator
  if (!data) {
    return <div style={{ display: 'none' }}></div>;
  }

  const form = data;

  // ==========================================================
  // 🔥 SUBMIT ORDER → OTP VERIFICATION → PEMBAYARAN
  // ==========================================================
  const handleSubmit = async () => {
    // Prevent double-click
    if (submitting) return;
    
    if (!paymentMethod) return toast.error("Silakan pilih metode pembayaran");
    if (!customerForm.nama || !customerForm.email || !customerForm.wa)
      return toast.error("Silakan lengkapi data yang diperlukan");
    
    // Validasi ongkir untuk produk fisik (landingpage = "2")
    // Deteksi berdasarkan kategori ID, bukan landingpage
    const isFisik = isKategoriBuku(); // Kategori 13 (Buku) memerlukan ongkir
    if (isFisik && (!ongkir || ongkir === 0)) {
      return toast.error("Silakan hitung ongkir terlebih dahulu");
    }

    setSubmitting(true);

    // Payload sesuai format backend requirement
    // Backend mengharapkan harga dan total_harga sebagai STRING
    // Untuk dummy products, ID tetap ada (999, 998, 997, dll)
    if (!form) {
      return toast.error("Data produk tidak valid");
    }
    
    // Untuk dummy products, gunakan ID yang ada (akan dikirim ke backend)
    // Backend akan handle validasi apakah produk ID valid atau tidak
    if (!form.id) {
      console.warn("[LANDING] Product ID tidak ditemukan, menggunakan ID dummy");
    }

    // Gunakan harga_promo jika ada, jika tidak gunakan harga_asli
    const hargaProduk = parseInt(form.harga_promo || form.harga_asli || '0', 10);
    const ongkirValue = isKategoriBuku() ? (ongkir || 0) : 0;
    const downPaymentValue = isKategoriWorkshop() ? (downPayment || 0) : 0;
    
    // Untuk Workshop: total = down payment
    // Untuk Buku: total = harga + ongkir
    // Untuk lainnya: total = harga
    const totalHarga = isKategoriWorkshop() 
      ? downPaymentValue 
      : (isKategoriBuku() ? hargaProduk + ongkirValue : hargaProduk);

    const payload = {
      nama: customerForm.nama,
      wa: customerForm.wa,
      email: customerForm.email,
      alamat: alamatLengkap || customerForm.alamat || '', // Gunakan alamat lengkap yang sudah di-generate
      produk: parseInt(form.id, 10), // produk tetap integer
      harga: String(hargaProduk), // harga sebagai string (harga_promo atau harga_asli)
      ongkir: String(ongkirValue), // ongkir dari hasil cek Raja Ongkir (hanya untuk kategori 13)
      down_payment: isKategoriWorkshop() ? String(downPaymentValue) : undefined, // down payment untuk kategori 15
      total_harga: String(totalHarga), // total_harga sesuai kategori
      metode_bayar: paymentMethod,
      sumber: sumber || 'website',
      custom_value: Array.isArray(customerForm.custom_value) 
        ? customerForm.custom_value 
        : (customerForm.custom_value ? [customerForm.custom_value] : []), // array
      // product_name hanya untuk Midtrans, tidak dikirim ke /api/order
      product_name: form.product_name || form.nama,
    };

    try {
      // Hapus product_name dari payload karena tidak diperlukan di /api/order
      const { product_name, ...orderPayload } = payload;
      
      // Simpan order ke DB via API proxy
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const order = await response.json();
      
      console.log("📥 Order response:", order);

      // Cek apakah order berhasil
      if (!response.ok || !order?.success) {
        const errorMessage = order?.message || order?.error || "Gagal membuat order";
        throw new Error(errorMessage);
      }

      // Ambil data dari response - handle berbagai format response
      const orderResponseData = order?.data?.order || order?.data || {};
      const orderId = orderResponseData?.id;
      
      // Customer bisa berupa:
      // - Integer langsung: customer: 5
      // - Object dengan id: customer: { id: 5, nama: "..." }
      // - Di field lain: customer_id, id_customer
      let customerId = null;
      const rawCustomer = orderResponseData?.customer || orderResponseData?.customer_id || orderResponseData?.id_customer;
      
      if (typeof rawCustomer === 'object' && rawCustomer !== null) {
        customerId = rawCustomer.id || rawCustomer.customer_id;
      } else if (typeof rawCustomer === 'number' || typeof rawCustomer === 'string') {
        customerId = rawCustomer;
      }


      // Simpan data untuk verifikasi OTP + URL landing untuk redirect balik
      const hargaProdukFinal = parseInt(form.harga_promo || form.harga_asli || '0', 10);
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
        productName: form.nama || form.product_name || "Produk",
        totalHarga: String(totalHargaFinal), // total_harga = harga + ongkir
        paymentMethod: paymentMethod,
        landingUrl: window.location.pathname, // URL untuk balik setelah payment
      };

      console.log("📦 [LANDING] Saving pending order:", pendingOrder);
      localStorage.setItem("pending_order", JSON.stringify(pendingOrder));

      // Tampilkan toast sesuai kondisi
      if (customerId) {
        toast.success("Kode OTP telah dikirim ke WhatsApp Anda!");
      } else {
        toast.success("Order berhasil! Lanjut ke pembayaran...");
      }

      // Redirect ke halaman verifikasi OTP
      await new Promise((r) => setTimeout(r, 500));
      window.location.href = "/verify-order";

    } catch (err) {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
      setSubmitting(false);
    }
  };

  // ==========================================================
  // RENDER PAGE
  // ==========================================================
  
  // Log kategori untuk debugging
  useEffect(() => {
    if (data) {
      const kategoriId = getKategoriId();
      console.log("========================================");
      console.log("🏷️ LANDING PAGE - KATEGORI DETECTION");
      console.log("========================================");
      console.log("📦 Kategori ID:", kategoriId);
      console.log("📝 Kategori Nama:", data.kategori_rel?.nama || "Unknown");
      console.log("🔍 Is Kategori Buku (13):", isKategoriBuku());
      console.log("🔍 Is Kategori Workshop (15):", isKategoriWorkshop());
      console.log("📋 Kategori Mapping:", {
        10: "Ebook",
        11: "Webinar",
        12: "Seminar",
        13: "Buku (dengan ongkir)",
        14: "Ecourse",
        15: "Workshop (dengan down payment)",
        16: "Private Mentoring",
      });
      console.log("========================================");
    }
  }, [data]);

  const headerSrc = resolveHeaderSource(form.header);

  // Check apakah produk menggunakan format blocks (canvas style)
  const isCanvasFormat = data?.blocks && Array.isArray(data.blocks) && data.blocks.length > 0;

  return (
    <article className="landing-wrapper" itemScope itemType="https://schema.org/Product">
      <div className="produk-preview">
          
          {/* Logo Section - Top */}
          <div className="logo-section">
            <img 
              src="/assets/logo.png" 
              alt="Logo" 
              className="landing-logo"
            />
          </div>

          {/* Top Section - No Background */}
          <div className="top-section">
            {/* Promo Card - Highlight Orange */}
            <div className="promo-card-highlight" role="banner">
              <div className="promo-label">Tawaran Terbatas</div>
              <h1 className="promo-title-professional">Isi Form Hari Ini Untuk Mendapatkan Akses Group Exclusive</h1>
            </div>

            {/* Nama Produk - Black Color */}
            <h1 className="preview-title-professional" itemProp="name">{form?.nama || "Nama Produk"}</h1>
          </div>

          {/* RENDER CANVAS STYLE (Format Blocks) */}
          {isCanvasFormat ? (
            <div className="canvas-wrapper">
              {renderBlocks(data.blocks, data)}
            </div>
          ) : (
            <>
              {/* RENDER OLD STYLE (Format Lama) */}

          {/* Header - Outside orange section, with reduced overlap for closer spacing */}
          <div className="header-wrapper header-overlap">
            {headerSrc ? (
              <img 
                src={headerSrc} 
                alt={`${form.nama} - Header Image`}
                className="preview-header-img"
                itemProp="image"
                loading="eager"
                width="900"
                height="500"
              />
            ) : (
              <div className="preview-header-img" style={{ background: "#e5e7eb" }} aria-label="Product header placeholder" />
            )}
          </div>
          
          {/* Deskripsi */}
          {form.deskripsi && (
            <div className="preview-description" itemProp="description">
              {form.deskripsi}
            </div>
          )}

        

        {/* Profil Pembicara Workshop - 6 Speakers */}
        <section className="speaker-profile-section" aria-label="Speaker profile">
          <div className="speaker-banner-image">
            <img 
              src="/assets/talent ternak properti.png" 
              alt="Talent Ternak Properti"
              className="talent-banner-img"
            />
          </div>
          <h2 className="speaker-profile-title">Profil Pembicara</h2>
          <div className="speakers-inline-list">
            {/* Speaker 1: Dimas Dwi Ananto */}
            <div className="speaker-card-separated">
              <div className="speaker-photo-card">
                <img 
                  src="/assets/Dimas Dwi Ananto.png" 
                  alt="Dimas Dwi Ananto"
                  className="speaker-photo-img"
                />
              </div>
              <div className="speaker-info-card">
                <div className="speaker-info-role">Praktisi Lelang Properti</div>
                <div className="speaker-info-name">DIMAS DWI ANANTO</div>
                <div className="speaker-info-bio">
                  Praktisi lelang properti berpengalaman dengan <strong>track record</strong> mengakuisisi properti dengan harga murah dan menjualnya kembali dengan keuntungan tinggi. Spesialisasi dalam strategi investasi properti tanpa KPR.
                </div>
              </div>
            </div>

            {/* Speaker 2: Salvian Kumara */}
            <div className="speaker-card-separated">
              <div className="speaker-photo-card">
                <img 
                  src="/assets/Salvian Kumara.png" 
                  alt="Salvian Kumara"
                  className="speaker-photo-img"
                />
              </div>
              <div className="speaker-info-card">
                <div className="speaker-info-role">Expert Real Estate Investment</div>
                <div className="speaker-info-name">SALVIAN KUMARA</div>
                <div className="speaker-info-bio">
                  Expert di bidang real estate investment dengan pengalaman lebih dari 10 tahun. Fokus pada <strong>analisis pasar properti</strong> dan strategi investasi jangka panjang yang menguntungkan.
                </div>
              </div>
            </div>

            {/* Speaker 3: Rhesa Yogaswara */}
            <div className="speaker-card-separated">
              <div className="speaker-photo-card">
                <img 
                  src="/assets/Rhesa Yogaswara.png" 
                  alt="Rhesa Yogaswara"
                  className="speaker-photo-img"
                />
              </div>
              <div className="speaker-info-card">
                <div className="speaker-info-role">Property Consultant & Trainer</div>
                <div className="speaker-info-name">RHESA YOGASWARA</div>
                <div className="speaker-info-bio">
                  Property consultant dan trainer yang telah membantu ratusan investor dalam <strong>membangun portofolio properti</strong>. Spesialis dalam riset pasar dan identifikasi peluang investasi.
                </div>
              </div>
            </div>

            {/* Speaker 4: Stephanus P H A S */}
            <div className="speaker-card-separated">
              <div className="speaker-photo-card">
                <img 
                  src="/assets/Stephanus P H A S.png" 
                  alt="Stephanus P H A S"
                  className="speaker-photo-img"
                />
              </div>
              <div className="speaker-info-card">
                <div className="speaker-info-role">Business Development Specialist</div>
                <div className="speaker-info-name">STEPHANUS P H A S</div>
                <div className="speaker-info-bio">
                  Business development specialist dengan expertise dalam <strong>strategi pertumbuhan bisnis</strong> dan pengembangan pasar. Berpengalaman dalam transformasi organisasi dan ekspansi bisnis.
                </div>
              </div>
            </div>

            {/* Speaker 5: Theo Ariandyen */}
            <div className="speaker-card-separated">
              <div className="speaker-photo-card">
                <img 
                  src="/assets/Theo Ariandyen.png" 
                  alt="Theo Ariandyen"
                  className="speaker-photo-img"
                />
              </div>
              <div className="speaker-info-card">
                <div className="speaker-info-role">Investment Strategist</div>
                <div className="speaker-info-name">THEO ARIANDYEN</div>
                <div className="speaker-info-bio">
                  Investment strategist yang fokus pada <strong>investasi properti strategis</strong> dan manajemen portofolio. Membantu investor dalam membuat keputusan investasi yang tepat berdasarkan analisis mendalam.
                </div>
              </div>
            </div>

            {/* Speaker 6: Erzon Djazai */}
            <div className="speaker-card-separated">
              <div className="speaker-photo-card">
                <img 
                  src="/assets/Erzon Djazai.png" 
                  alt="Erzon Djazai"
                  className="speaker-photo-img"
                />
              </div>
              <div className="speaker-info-card">
                <div className="speaker-info-role">Property Investment Advisor</div>
                <div className="speaker-info-name">ERZON DJAZAI</div>
                <div className="speaker-info-bio">
                  Property investment advisor dengan pengalaman luas dalam <strong>mengidentifikasi peluang investasi properti</strong> dan memberikan konsultasi strategis untuk investor pemula maupun berpengalaman.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Special Offer Card - Combined Benefit & Price */}
        {(form.list_point?.length > 0 || form.harga_coret || form.harga_asli) && (
          <section className="special-offer-card" aria-label="Special offer" itemScope itemType="https://schema.org/Offer">
            <h2 className="special-offer-title">Special Offer!</h2>
            
            {/* Price Section */}
            {(form.harga_coret || form.harga_asli) && (
              <div className="special-offer-price">
                {form.harga_coret && (
                  <span className="price-old" aria-label="Harga lama">
                    Rp {formatPrice(form.harga_coret)}
                  </span>
                )}
                {form.harga_asli && (
                  <span className="price-new" itemProp="price" content={form.harga_asli}>
                    Rp {formatPrice(form.harga_asli)}
                  </span>
                )}
              </div>
            )}
            
            {/* Benefit List */}
            {form.list_point?.length > 0 && (
              <div className="special-offer-benefits">
                <h3>Benefit yang akan Anda dapatkan:</h3>
                <ul itemProp="featureList">
                  {form.list_point.map((p, i) => (
                    <li key={i} itemProp="itemListElement">
                      <span className="benefit-check">✓</span>
                      {p.nama}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <meta itemProp="priceCurrency" content="IDR" />
            <meta itemProp="availability" content="https://schema.org/InStock" />
          </section>
        )}



        {/* Gallery */}
        {form.gambar?.length > 0 && (
          <section className="preview-gallery" aria-label="Product gallery">
            <h2 className="gallery-title"></h2>
            <div className="gallery-images-full" itemProp="image">
              {form.gambar.map((g, i) => {
                const imgSrc = buildImageUrl(g.path);
                return imgSrc ? (
                  <img 
                    key={i} 
                    src={imgSrc} 
                    alt={g.caption || `${form.nama} - Gambar ${i + 1}`}
                    className="gallery-image-full"
                    loading="lazy"
                  />
                ) : null;
              })}
            </div>
          </section>
        )}

        {/* Video */}
        {form.video?.length > 0 && (
          <section className="preview-video" aria-label="Product videos">
            <h2 className="video-title"></h2>
            {form.video.map((v, i) => {
              let url = v;
              if (url.includes("watch?v=")) url = url.replace("watch?v=", "embed/");
              return (
                <iframe 
                  key={i} 
                  src={url} 
                  allowFullScreen
                  title={`Video ${form.nama} - ${i + 1}`}
                  loading="lazy"
                />
              );
            })}
          </section>
        )}

{/* INFORMASI DASAR - Compact Form */}
<section className="compact-form-section" aria-label="Order form">
  <h2 className="compact-form-title">Lengkapi Data:</h2>
  
  <div className="compact-form-card">
    {/* Nama Lengkap */}
    <div className="compact-field">
      <label className="compact-label">
        Nama Lengkap <span className="required">*</span>
      </label>
      <input
        type="text"
        placeholder="Contoh: Krisdayanti"
        className="compact-input"
        value={customerForm.nama}
        onChange={(e) => setCustomerForm({ ...customerForm, nama: e.target.value })}
      />
    </div>

    {/* No. WhatsApp */}
    <div className="compact-field">
      <label className="compact-label">
        No. WhatsApp <span className="required">*</span>
      </label>
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

    {/* Email */}
    <div className="compact-field">
      <label className="compact-label">
        Email <span className="required">*</span>
      </label>
      <input
        type="email"
        placeholder="email@example.com"
        className="compact-input"
        value={customerForm.email}
        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
      />
    </div>

    {/* Alamat Dasar */}
    <div className="compact-field">
      <label className="compact-label">
        Alamat <span className="required">*</span>
      </label>
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

    {/* Ongkir Calculator - Tampilkan jika kategori 13 (Buku), di dalam card yang sama */}
    {isKategoriBuku() && (
      <OngkirCalculator
        onSelectOngkir={(info) => {
          console.log('[LANDING] onSelectOngkir called with info:', info);
          // Handle both old format (number) and new format (object)
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
    )}
  </div>
</section>


        {/* Custom Field - Same Compact Style */}
        {form.custom_field?.length > 0 && (
          <section className="compact-form-section" aria-label="Additional information">
            <h2 className="compact-form-title">Lengkapi Data Tambahan:</h2>

            <div className="compact-form-card">
              {form.custom_field.map((f, i) => (
                <div key={i} className="compact-field">
                  <label className="compact-label">{f.nama_field}</label>
                  <input
                    type="text"
                    placeholder={`Masukkan ${f.nama_field}`}
                    className="compact-input"
                    onChange={(e) => {
                      const temp = [...customerForm.custom_value];
                      temp[i] = {
                        nama: f.nama_field,
                        value: e.target.value,
                      };
                      setCustomerForm({ ...customerForm, custom_value: temp });
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rincian Pesanan Card - Tampilkan jika kategori 13 (Buku) dan ongkir sudah dihitung */}
        {isKategoriBuku() && ongkir > 0 && (() => {
          // Parse harga produk ke number
          const hargaProduk = typeof form.harga_asli === "string" 
            ? parseInt(form.harga_asli.replace(/[^\d]/g, ""), 10) || 0
            : (typeof form.harga_asli === "number" ? form.harga_asli : 0);
          
          // Pastikan ongkir adalah number
          const ongkirValue = typeof ongkir === "number" ? ongkir : parseInt(ongkir, 10) || 0;
          
          // Hitung total
          const grandTotal = hargaProduk + ongkirValue;
          
          // Format courier dan service: "JNE Express - REG"
          const courierLabel = ongkirInfo.courier ? ongkirInfo.courier.toUpperCase() : 'JNE';
          const serviceLabel = ongkirInfo.service || 'REG';
          const ongkirLabel = `${courierLabel} Express - ${serviceLabel}`;
          
          return (
            <section className="compact-form-section" aria-label="Rincian Pesanan">
              <div className="compact-form-card">
                {/* Judul */}
                <div style={{ marginBottom: "16px" }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Rincian Pesanan
                  </h3>
                </div>
                
                {/* Nama Produk */}
                <div className="compact-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 0' }}>
                    <span className="compact-label" style={{ margin: 0 }}>{form.nama || 'Produk'}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Rp {formatPrice(form.harga_asli || "0")}
                    </span>
                  </div>
                </div>
                
                {/* Ongkir */}
                <div className="compact-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 0' }}>
                    <span className="compact-label" style={{ margin: 0 }}>Ongkir ({ongkirLabel})</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Rp {formatPrice(ongkirValue)}
                    </span>
                  </div>
                </div>
                
                {/* Garis Pemisah */}
                <div style={{ height: '1px', background: '#e5e7eb', margin: '12px 0' }}></div>
                
                {/* Total Pesanan */}
                <div className="compact-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 0' }}>
                    <span className="compact-label" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>Total Pesanan</span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                      Rp {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* Down Payment Input - Tampilkan jika kategori 15 (Workshop) */}
        {isKategoriWorkshop() && (
          <section className="compact-form-section" aria-label="Down Payment">
            <div className="compact-form-card">
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
                  Masukan Jumlah Down Payment
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>
                  Masukkan jumlah uang muka yang ingin Anda bayar
                </p>
              </div>
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
                  onBlur={(e) => {
                    // Format ulang saat blur
                    const parsed = parsePriceInput(e.target.value);
                    if (parsed > 0) {
                      e.target.value = formatPriceInput(parsed);
                    }
                  }}
                />
                {downPayment > 0 && (
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
                    Down payment: {formatPriceInput(downPayment)}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Payment - Vertical Layout, Horizontal Items */}
        <section className="payment-section" aria-label="Payment methods">
          <h2 className="payment-title">Metode Pembayaran</h2>
          <div className="payment-options-vertical">
            {/* Manual Transfer */}
            <label className="payment-option-row">
              <input
                type="radio"
                name="payment"
                value="manual"
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span className="payment-label">Bank Transfer (Manual)</span>
              <div className="payment-icons-inline">
                <img className="pay-icon" src="/assets/bca.png" alt="BCA" />
              </div>
            </label>
            {/* E-Payment */}
            <label className="payment-option-row">
              <input
                type="radio"
                name="payment"
                value="ewallet"
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

            {/* Credit */}
            <label className="payment-option-row">
              <input
                type="radio"
                name="payment"
                value="cc"
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span className="payment-label">Credit / Debit Card</span>
              <div className="payment-icons-inline">
                <img className="pay-icon" src="/assets/visa.svg" alt="Visa" />
                <img className="pay-icon" src="/assets/master.png" alt="Mastercard" />
                <img className="pay-icon" src="/assets/jcb.png" alt="JCB" />
              </div>
            </label>

            {/* Virtual Account */}
            <label className="payment-option-row">
              <input
                type="radio"
                name="payment"
                value="va"
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

        {/* CTA */}
        <button 
          className={`cta-button ${submitting ? 'cta-loading' : ''}`}
          onClick={handleSubmit}
          disabled={submitting}
          aria-label={`Pesan ${form.nama} sekarang`}
          itemProp="offers"
        >
          {submitting ? (
            <>
              <span className="cta-spinner"></span>
              Memproses...
            </>
          ) : (
            "Pesan Sekarang"
          )}
        </button>

{/* Testimoni - Google Review Style with Horizontal Scroll */}
{form.testimoni?.length > 0 && (
          <section className="preview-testimonials" aria-label="Customer testimonials">
            <h2>Testimoni Pembeli</h2>
            <div className="testimonials-carousel-wrapper-new">
              {testimoniIndex > 0 && (
                <button 
                  className="testimoni-nav-btn-new testimoni-nav-prev-new"
                  onClick={() => setTestimoniIndex(Math.max(0, testimoniIndex - 1))}
                  aria-label="Previous testimonials"
                >
                  ‹
                </button>
              )}
              <div className="testimonials-carousel-new" itemScope itemType="https://schema.org/Review">
                <div 
                  className="testimonials-track-new"
                  style={{ transform: `translateX(-${testimoniIndex * 28}%)` }}
                >
                  {form.testimoni.map((t, i) => {
                    const testiImgSrc = buildImageUrl(t.gambar);
                    return (
                      <article key={i} className="testi-card-new" itemScope itemType="https://schema.org/Review">
                        <div className="testi-header-new">
                          {testiImgSrc ? (
                            <div className="testi-avatar-wrapper-new">
                              <img 
                                src={testiImgSrc} 
                                alt={`Foto ${t.nama}`}
                                className="testi-avatar-new"
                                itemProp="author"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="testi-avatar-wrapper-new">
                              <div className="testi-avatar-placeholder-new">
                                {t.nama?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                            </div>
                          )}
                          <div className="testi-info-new">
                            <div className="testi-name-new" itemProp="author" itemScope itemType="https://schema.org/Person">
                              <span itemProp="name">{t.nama}</span>
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
                        <div className="testi-desc-new" itemProp="reviewBody">{t.deskripsi}</div>
                      </article>
                    );
                  })}
                </div>
              </div>
              {testimoniIndex < Math.max(0, form.testimoni.length - 3) && form.testimoni.length > 3 && (
                <button 
                  className="testimoni-nav-btn-new testimoni-nav-next-new"
                  onClick={() => setTestimoniIndex(Math.min(Math.max(0, form.testimoni.length - 3), testimoniIndex + 1))}
                  aria-label="Next testimonials"
                >
                  ›
                </button>
              )}
            </div>
          </section>
        )}

{/* CTA WhatsApp Sales Section */}
<section className="whatsapp-cta-section" aria-label="Contact sales">
          <div className="whatsapp-cta-content">
            <p className="whatsapp-cta-text">
              Masih ada pertanyaan? Ingin konsultasi lebih detail sebelum memutuskan?
            </p>
            <p className="whatsapp-cta-subtext">
              Tim sales kami siap membantu Anda. Hubungi kami melalui WhatsApp untuk mendapatkan informasi lengkap.
            </p>
            <a
              href={`https://wa.me/${salesWA}?text=${encodeURIComponent(`Halo, saya tertarik dengan produk: ${form.nama}\n\nBisa tolong berikan informasi lebih detail?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-cta-button"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>Hubungi Sales via WhatsApp</span>
            </a>
          </div>
        </section>

{/* FAQ Section - Berdasarkan Kategori */}
{form && (
          <section className="faq-section" aria-label="Frequently Asked Questions">
            <h2 className="faq-title">Pertanyaan yang Sering Diajukan</h2>
            <div className="faq-container">
              {getFAQByKategori(getKategoriId()).map((faq, index) => (
                <FAQItem 
                  key={index}
                  question={faq.question} 
                  answer={faq.answer}
                />
              ))}
            </div>
          </section>
        )}
        
            </>
          )}

        {/* Loading Overlay saat submit */}
        {submitting && (
          <div className="submit-overlay">
            <div className="submit-overlay-content">
              <div className="submit-spinner">
                <span></span><span></span><span></span>
              </div>
              <p>Memproses pesanan Anda...</p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
