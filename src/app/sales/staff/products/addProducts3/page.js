"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Type, Image as ImageIcon, FileText, List, MessageSquare, 
  HelpCircle, Image as SliderIcon, Square, Youtube, Link as LinkIcon,
  MapPin, Film, Minus, Code, X, ArrowLeft
} from "lucide-react";
import {
  TextComponent,
  ImageComponent,
  VideoComponent,
  TestimoniComponent,
  ListComponent,
  FormComponent,
  FAQComponent,
  SliderComponent,
  ButtonComponent,
  EmbedComponent,
  SectionComponent,
  HTMLComponent,
  DividerComponent,
  ScrollTargetComponent,
  AnimationComponent,
} from './components';
import "@/styles/sales/add-products3.css";

// Komponen yang tersedia sesuai gambar
const COMPONENT_CATEGORIES = {
  seringDigunakan: {
    label: "Sering Digunakan",
    components: [
      { id: "text", name: "Teks", icon: Type, color: "#3b82f6" },
      { id: "image", name: "Gambar", icon: ImageIcon, color: "#10b981" },
    ]
  },
  formPemesanan: {
    label: "Form Pemesanan Online",
    components: [
      { id: "form", name: "Form Pemesanan", icon: FileText, color: "#8b5cf6" },
      { id: "list", name: "Daftar", icon: List, color: "#f59e0b" },
      { id: "testimoni", name: "Testimoni", icon: MessageSquare, color: "#ec4899" },
      { id: "faq", name: "FAQ", icon: HelpCircle, color: "#06b6d4" },
    ]
  },
  salesPage: {
    label: "Sales Page",
    components: [
      { id: "slider", name: "Gambar Slider", icon: SliderIcon, color: "#ef4444" },
      { id: "button", name: "Tombol", icon: Square, color: "#F1A124" },
      { id: "youtube", name: "YouTube", icon: Youtube, color: "#dc2626" },
      { id: "embed", name: "Embed", icon: LinkIcon, color: "#6366f1" },
      { id: "scroll-target", name: "Scroll Target", icon: MapPin, color: "#14b8a6" },
      { id: "animation", name: "Animation", icon: Film, color: "#a855f7" },
    ]
  },
  lainnya: {
    label: "Lainnya",
    components: [
      { id: "section", name: "Section", icon: Minus, color: "#64748b" },
      { id: "html", name: "HTML", icon: Code, color: "#475569" },
      { id: "divider", name: "Divider", icon: Minus, color: "#94a3b8" },
    ]
  }
};

export default function AddProducts3Page() {
  const router = useRouter();
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [expandedBlockId, setExpandedBlockId] = useState(null);
  const [testimoniIndices, setTestimoniIndices] = useState({});
  const [productKategori, setProductKategori] = useState(null); // Untuk menentukan kategori produk
  const [activeTab, setActiveTab] = useState("konten"); // State untuk tab aktif

  // Default data untuk setiap komponen
  const getDefaultData = (componentId) => {
    const defaults = {
      text: { content: "" },
      image: { src: "", alt: "", caption: "" },
      video: { url: "" },
      testimoni: { items: [] },
      list: { items: [] },
      form: { kategori: null }, // Kategori untuk form pemesanan
      faq: { items: [] },
      slider: { images: [] },
      button: { text: "Klik Disini", link: "#", style: "primary" },
      embed: { code: "" },
      section: { background: "#ffffff", padding: "20px" },
      html: { code: "" },
      divider: { style: "solid", color: "#e5e7eb" },
      "scroll-target": { target: "" },
      animation: { type: "fade" },
    };
    return defaults[componentId] || {};
  };

  // Handler untuk menambah komponen baru
  const handleAddComponent = (componentId) => {
    // Cek apakah form sudah ada
    if (componentId === "form") {
      const formExists = blocks.some(b => b.type === "form");
      if (formExists) {
        alert("Form Pemesanan sudah ada dan tidak bisa ditambahkan lagi");
        setShowComponentModal(false);
        return;
      }
    }
    
    const newBlock = {
      id: `block-${Date.now()}`,
      type: componentId,
      data: getDefaultData(componentId),
      order: blocks.length + 1,
    };
    
    setBlocks([...blocks, newBlock]);
    setExpandedBlockId(newBlock.id); // Expand komponen baru yang ditambahkan
    setShowComponentModal(false);
  };

  // Handler untuk update block data
  const handleUpdateBlock = (blockId, newData) => {
    setBlocks(blocks.map(block => 
      block.id === blockId 
        ? { ...block, data: { ...block.data, ...newData } }
        : block
    ));
  };

  // Handler untuk reorder blocks
  const moveBlock = (blockId, direction) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  // Handler untuk delete block
  const deleteBlock = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (block && block.type === "form") {
      alert("Form Pemesanan tidak bisa dihapus");
      return;
    }
    setBlocks(blocks.filter(b => b.id !== blockId));
  };

  // Handler untuk expand/collapse komponen
  const handleToggleExpand = (blockId) => {
    setExpandedBlockId(expandedBlockId === blockId ? null : blockId);
  };

  // Render komponen form editing di sidebar
  const renderComponent = (block, index) => {
    const isExpanded = expandedBlockId === block.id;
    
    const commonProps = {
      data: block.data,
      onUpdate: (newData) => handleUpdateBlock(block.id, newData),
      blockId: block.id,
      index: index,
      onMoveUp: () => moveBlock(block.id, 'up'),
      onMoveDown: () => moveBlock(block.id, 'down'),
      onDelete: () => deleteBlock(block.id),
      isExpanded: isExpanded,
      onToggleExpand: () => handleToggleExpand(block.id),
      isRequired: block.type === "form", // Form tidak bisa dihapus
    };

    switch (block.type) {
      case "text":
        return <TextComponent {...commonProps} />;
      case "image":
        return <ImageComponent {...commonProps} />;
      case "youtube":
      case "video":
        return <VideoComponent {...commonProps} />;
      case "testimoni":
        return <TestimoniComponent {...commonProps} />;
      case "list":
        return <ListComponent {...commonProps} />;
      case "form":
        return <FormComponent {...commonProps} productKategori={productKategori} />;
      case "faq":
        return <FAQComponent {...commonProps} />;
      case "slider":
        return <SliderComponent {...commonProps} />;
      case "button":
        return <ButtonComponent {...commonProps} />;
      case "embed":
        return <EmbedComponent {...commonProps} />;
      case "section":
        return <SectionComponent {...commonProps} />;
      case "html":
        return <HTMLComponent {...commonProps} />;
      case "divider":
        return <DividerComponent {...commonProps} />;
      case "scroll-target":
        return <ScrollTargetComponent {...commonProps} />;
      case "animation":
        return <AnimationComponent {...commonProps} />;
      default:
        return <div>Unknown component: {block.type}</div>;
    }
  };

  // Render preview di canvas
  const renderPreview = (block) => {
    switch (block.type) {
      case "text":
        return <div className="preview-text">{block.data.content || "Teks..."}</div>;
      case "image":
        return block.data.src ? (
          <div className="preview-image-wrapper">
            <img src={block.data.src} alt={block.data.alt || ""} className="preview-image-full" />
            {block.data.caption && <p className="preview-caption">{block.data.caption}</p>}
          </div>
        ) : (
          <div className="preview-placeholder">Gambar belum diupload</div>
        );
      case "youtube":
      case "video":
        return block.data.embedUrl ? (
          <iframe src={block.data.embedUrl} title="Video" className="preview-video-iframe" allowFullScreen />
        ) : (
          <div className="preview-placeholder">URL video belum diisi</div>
        );
      case "testimoni":
        const testimoniItems = block.data.items || [];
        if (testimoniItems.length === 0) {
          return <div className="preview-placeholder">Belum ada testimoni</div>;
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
      case "list":
        return (
          <ul className="preview-list">
            {block.data.items?.map((item, i) => (
              <li key={i}>{item.nama || `Point ${i + 1}`}</li>
            ))}
            {(!block.data.items || block.data.items.length === 0) && (
              <div className="preview-placeholder">Belum ada list point</div>
            )}
          </ul>
        );
      case "form":
        const formKategori = block.data.kategori;
        const isFormBuku = formKategori === 13;
        const isFormWorkshop = formKategori === 15;
        
        return (
          <>
            {/* Form Pemesanan */}
            <section className="preview-form-section compact-form-section" aria-label="Order form">
              <h2 className="compact-form-title">Lengkapi Data:</h2>
              <div className="compact-form-card">
                <div className="compact-field">
                  <label className="compact-label">Nama Lengkap <span className="required">*</span></label>
                  <input type="text" placeholder="Contoh: Krisdayanti" className="compact-input" />
                </div>
                <div className="compact-field">
                  <label className="compact-label">No. WhatsApp <span className="required">*</span></label>
                  <div className="wa-input-wrapper">
                    <div className="wa-prefix">
                      <span className="flag">🇮🇩</span>
                      <span className="code">+62</span>
                    </div>
                    <input type="tel" placeholder="812345678" className="compact-input wa-input" />
                  </div>
                </div>
                <div className="compact-field">
                  <label className="compact-label">Email <span className="required">*</span></label>
                  <input type="email" placeholder="email@example.com" className="compact-input" />
                </div>
                <div className="compact-field">
                  <label className="compact-label">Alamat <span className="required">*</span></label>
                  <textarea placeholder="Contoh: Jl. Peta Utara 1, No 62 RT 01/07" className="compact-input compact-textarea" rows={3} />
                </div>
                {isFormBuku && (
                  <div className="form-info-box">
                    <p className="text-sm text-gray-600">Kalkulator ongkir akan muncul di sini</p>
                  </div>
                )}
              </div>
            </section>

            {/* Rincian Pesanan - Kategori Buku */}
            {isFormBuku && (
              <section className="preview-form-section compact-form-section" aria-label="Rincian Pesanan">
                <div className="compact-form-card">
                  <div style={{ marginBottom: "16px" }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
                      Rincian Pesanan
                    </h3>
                  </div>
                  <div className="compact-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 0' }}>
                      <span className="compact-label" style={{ margin: 0 }}>Produk</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Rp 0</span>
                    </div>
                  </div>
                  <div className="compact-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 0' }}>
                      <span className="compact-label" style={{ margin: 0 }}>Ongkir</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Rp 0</span>
                    </div>
                  </div>
                  <div style={{ height: '1px', background: '#e5e7eb', margin: '12px 0' }}></div>
                  <div className="compact-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 0' }}>
                      <span className="compact-label" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>Total Pesanan</span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>Rp 0</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Down Payment - Kategori Workshop */}
            {isFormWorkshop && (
              <section className="preview-form-section compact-form-section" aria-label="Down Payment">
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
                    <input type="text" placeholder="Rp 0" className="compact-input" />
                  </div>
                </div>
              </section>
            )}

            {/* Payment Section - Selalu muncul */}
            <section className="preview-payment-section payment-section" aria-label="Payment methods">
              <h2 className="payment-title">Metode Pembayaran</h2>
              <div className="payment-options-vertical">
                <label className="payment-option-row">
                  <input type="radio" name="payment" value="manual" />
                  <span className="payment-label">Bank Transfer (Manual)</span>
                  <div className="payment-icons-inline">
                    <img className="pay-icon" src="/assets/bca.png" alt="BCA" />
                  </div>
                </label>
                <label className="payment-option-row">
                  <input type="radio" name="payment" value="ewallet" />
                  <span className="payment-label">E-Payment</span>
                  <div className="payment-icons-inline">
                    <img className="pay-icon" src="/assets/qris.svg" alt="QRIS" />
                    <img className="pay-icon" src="/assets/dana.png" alt="DANA" />
                    <img className="pay-icon" src="/assets/ovo.png" alt="OVO" />
                    <img className="pay-icon" src="/assets/link.png" alt="LinkAja" />
                  </div>
                </label>
                <label className="payment-option-row">
                  <input type="radio" name="payment" value="cc" />
                  <span className="payment-label">Credit / Debit Card</span>
                  <div className="payment-icons-inline">
                    <img className="pay-icon" src="/assets/visa.svg" alt="Visa" />
                    <img className="pay-icon" src="/assets/master.png" alt="Mastercard" />
                    <img className="pay-icon" src="/assets/jcb.png" alt="JCB" />
                  </div>
                </label>
                <label className="payment-option-row">
                  <input type="radio" name="payment" value="va" />
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
          </>
        );
      case "button":
        return (
          <button className={`preview-button preview-button-${block.data.style || 'primary'}`}>
            {block.data.text || "Klik Disini"}
          </button>
        );
      case "html":
        return <div dangerouslySetInnerHTML={{ __html: block.data.code || "" }} />;
      case "embed":
        return <div dangerouslySetInnerHTML={{ __html: block.data.code || "" }} />;
      default:
        return <div className="preview-placeholder">{block.type}</div>;
    }
  };

  // Render grid komponen dalam modal
  const renderComponentGrid = () => {
    return (
      <div className="component-modal-content">
        {Object.entries(COMPONENT_CATEGORIES).map(([key, category]) => (
          <div key={key} className="component-category">
            <h3 className="component-category-title">{category.label}</h3>
            <div className="component-grid">
              {category.components.map((component) => {
                const IconComponent = component.icon;
                return (
                  <div
                    key={component.id}
                    className="component-item"
                    onClick={() => handleAddComponent(component.id)}
                  >
                    <div 
                      className="component-icon"
                      style={{ backgroundColor: `${component.color}15` }}
                    >
                      <IconComponent 
                        size={24} 
                        style={{ color: component.color }}
                      />
                    </div>
                    <span className="component-name">{component.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="add-products3-container">
      {/* Back Button */}
      <div className="page-header-section">
        <button
          className="back-to-products-btn"
          onClick={() => router.push("/sales/products")}
          aria-label="Back to products list"
        >
          <ArrowLeft size={18} />
          <span>Back to Products</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="page-builder-main">
        {/* Left Sidebar - Form Editing */}
        <div className="page-builder-sidebar">
          {/* Tabs */}
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${activeTab === "konten" ? "active" : ""}`}
              onClick={() => setActiveTab("konten")}
            >
              Konten
            </button>
            <button
              className={`sidebar-tab ${activeTab === "pengaturan" ? "active" : ""}`}
              onClick={() => setActiveTab("pengaturan")}
            >
              Pengaturan
            </button>
          </div>

          {/* Tab Content */}
          <div className="sidebar-content">
            {activeTab === "konten" ? (
              <>
                {/* Komponen yang sudah ditambahkan */}
                {blocks.map((block, index) => (
                  <div key={block.id} className="sidebar-component-item">
                    {renderComponent(block, index)}
                  </div>
                ))}
                
                {/* Button Tambah Komponen Baru - Selalu di bawah komponen terakhir */}
                <button
                  className="add-component-btn"
                  onClick={() => setShowComponentModal(true)}
                >
                  <span className="add-component-icon">+</span>
                  <span className="add-component-text">Tambah Komponen Baru</span>
                </button>
              </>
            ) : (
              <div className="pengaturan-content">
                {/* Konten Pengaturan akan diisi nanti */}
              </div>
            )}
          </div>
        </div>

        {/* Right Canvas - Preview */}
        <div className="page-builder-canvas">
          <div className="canvas-wrapper">
            {/* Placeholder jika belum ada komponen */}
            {blocks.length === 0 && (
              <div className="canvas-empty">
                <p>Klik "Tambah Komponen Baru" untuk memulai</p>
              </div>
            )}
            
            {/* Preview komponen */}
            {blocks.map((block) => (
              <div key={block.id} className="canvas-preview-block">
                {renderPreview(block)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Component Selection Modal - Simple */}
      {showComponentModal && (
        <div className="simple-modal-overlay" onClick={() => setShowComponentModal(false)}>
          <div className="simple-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="simple-modal-header">
              <h2 className="simple-modal-title">Pilih Komponen</h2>
              <button 
                className="simple-modal-close"
                onClick={() => setShowComponentModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="simple-modal-content">
              {renderComponentGrid()}
            </div>
            
            {/* Footer */}
            <div className="simple-modal-footer">
              <button 
                className="simple-modal-cancel"
                onClick={() => setShowComponentModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

