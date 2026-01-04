"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
  Type, Image as ImageIcon, FileText, List, MessageSquare, 
  HelpCircle, Youtube, X, ArrowLeft, ChevronDown, Layout,
  CheckCircle2, Circle, Minus, ArrowRight, ArrowRightCircle,
  ArrowLeft as ArrowLeftIcon, ArrowLeftRight, ChevronRight, CheckSquare, ShieldCheck,
  Lock, Dot, Target, Link as LinkIcon, PlusCircle, MinusCircle,
  Check, Star, Heart, ThumbsUp, Award, Zap, Flame, Sparkles,
  ArrowUp, ArrowDown, ArrowUpCircle, ArrowDownCircle, PlayCircle,
  PauseCircle, StopCircle, Radio, Square, Hexagon, Triangle,
  AlertCircle, Info, HelpCircle as HelpCircleIcon, Ban, Shield, Key, Unlock
} from "lucide-react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { MultiSelect } from "primereact/multiselect";
import OngkirCalculator from "@/components/OngkirCalculator";
import {
  TextComponent,
  ImageComponent,
  VideoComponent,
  TestimoniComponent,
  ListComponent,
  FormComponent,
  FAQComponent,
  PriceComponent,
  SectionComponent,
  SliderComponent,
  ButtonComponent,
  EmbedComponent,
  HTMLComponent,
  DividerComponent,
  ScrollTargetComponent,
  AnimationComponent,
} from './components';
// PrimeReact Theme & Core
import "primereact/resources/themes/lara-light-amber/theme.css";
import "primereact/resources/primereact.min.css";
import "@/styles/sales/add-products3.css";
import "@/styles/ongkir.css";

// Komponen yang tersedia
const COMPONENT_CATEGORIES = {
  seringDigunakan: {
    label: "Sering Digunakan",
    components: [
      { id: "text", name: "Teks", icon: Type, color: "#6b7280" },
      { id: "image", name: "Gambar", icon: ImageIcon, color: "#6b7280" },
      { id: "price", name: "Harga", icon: FileText, color: "#6b7280" },
      { id: "youtube", name: "Video", icon: Youtube, color: "#6b7280" },
      { id: "section", name: "Section", icon: Layout, color: "#6b7280" },
    ]
  },
  formPemesanan: {
    label: "Form Pemesanan Online",
    components: [
      { id: "form", name: "Form Pemesanan", icon: FileText, color: "#6b7280" },
      { id: "list", name: "Daftar", icon: List, color: "#6b7280" },
      { id: "testimoni", name: "Testimoni", icon: MessageSquare, color: "#6b7280" },
      { id: "faq", name: "FAQ", icon: HelpCircle, color: "#6b7280" },
    ]
  }
};

export default function AddProducts3Page() {
  const router = useRouter();
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [blocks, setBlocks] = useState([]);
  // Default expanded untuk semua komponen - gunakan Set untuk track collapsed blocks
  const [collapsedBlockIds, setCollapsedBlockIds] = useState(new Set());
  const [testimoniIndices, setTestimoniIndices] = useState({});
  const [productKategori, setProductKategori] = useState(null); // Untuk menentukan kategori produk
  const [activeTab, setActiveTab] = useState("konten"); // State untuk tab aktif
  
  // State untuk form pengaturan
  const [pengaturanForm, setPengaturanForm] = useState({
    nama: "",
    kategori: null,
    kode: "",
    url: "",
    harga_asli: null,
    harga_promo: null,
    tanggal_event: null,
    assign: [],
    background_color: "#ffffff", // Default putih
    page_title: "" // Custom page title
  });
  
  // State untuk options dropdown
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const bgColorPickerRef = useRef(null);
  
  // Refs untuk scroll ke komponen di sidebar
  const componentRefs = useRef({});

  // Close background color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bgColorPickerRef.current && !bgColorPickerRef.current.contains(event.target)) {
        setShowBgColorPicker(false);
      }
    };

    if (showBgColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showBgColorPicker]);

  // Preset background colors - Primary color #FF9900 (rgb(255, 153, 0))
  const presetBgColors = [
    { name: "Primary Orange", value: "#FF9900" }, // Primary color - rgb(255, 153, 0)
    { name: "Putih", value: "#ffffff" },
    { name: "Hitam", value: "#000000" },
    { name: "Abu-abu Terang", value: "#f3f4f6" },
    { name: "Abu-abu Gelap", value: "#374151" },
    { name: "Biru Muda", value: "#dbeafe" },
    { name: "Biru", value: "#3b82f6" },
    { name: "Hijau Muda", value: "#d1fae5" },
    { name: "Hijau", value: "#10b981" },
    { name: "Kuning Muda", value: "#fef3c7" },
    { name: "Kuning", value: "#f59e0b" },
    { name: "Merah Muda", value: "#fce7f3" },
    { name: "Merah", value: "#ef4444" },
    { name: "Ungu Muda", value: "#e9d5ff" },
    { name: "Ungu", value: "#8b5cf6" },
    { name: "Orange Muda", value: "#fed7aa" },
    { name: "Orange", value: "#f97316" },
  ];


  // Default data untuk setiap komponen
  const getDefaultData = (componentId) => {
    const defaults = {
      text: { content: "<p></p>" },
      image: { src: "", alt: "", caption: "" },
      video: { items: [] },
      testimoni: { items: [] },
      list: { items: [], componentTitle: "" },
      form: { kategori: null }, // Kategori untuk form pemesanan
      price: {},
      faq: { items: [] },
      slider: { images: [] },
      button: { text: "Klik Disini", link: "#", style: "primary" },
      embed: { code: "" },
      section: { 
        children: [], // Array of block IDs that are children of this section
        marginRight: 0,
        marginLeft: 0,
        marginBetween: 16,
        border: 0,
        borderColor: "#000000",
        borderRadius: "none",
        boxShadow: "none",
        responsiveType: "vertical",
        componentId: `section-${Date.now()}`,
        title: "Section"
      },
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
    // Komponen baru default expanded (tidak perlu ditambahkan ke collapsedBlockIds)
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

  // Handler untuk menambah child block ke section
  const handleAddChildBlock = (newBlock) => {
    setBlocks([...blocks, newBlock]);
  };

  // Handler untuk update child block
  const handleUpdateChildBlock = (childId, newData) => {
    setBlocks(blocks.map(block => 
      block.id === childId 
        ? { ...block, data: { ...block.data, ...newData } }
        : block
    ));
  };

  // Handler untuk delete child block
  const handleDeleteChildBlock = (childId) => {
    setBlocks(blocks.filter(block => block.id !== childId));
  };

  // Handler untuk move child block
  const handleMoveChildBlock = (childId, direction) => {
    // Find the block and its parent section
    const childBlock = blocks.find(b => b.id === childId);
    if (!childBlock || !childBlock.parentId) return;
    
    // Find parent section by componentId
    const parentSection = blocks.find(b => 
      b.type === "section" && 
      (b.data.componentId === childBlock.parentId || b.id === childBlock.parentId)
    );
    if (!parentSection || !parentSection.data.children) return;
    
    const children = parentSection.data.children;
    const currentIndex = children.indexOf(childId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= children.length) return;
    
    const newChildren = [...children];
    [newChildren[currentIndex], newChildren[newIndex]] = [newChildren[newIndex], newChildren[currentIndex]];
    
    handleUpdateBlock(parentSection.id, { ...parentSection.data, children: newChildren });
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
    console.log('[handleToggleExpand] Called with blockId:', blockId);
    console.log('[handleToggleExpand] Current collapsedBlockIds:', Array.from(collapsedBlockIds));
    console.log('[handleToggleExpand] Block exists?', blocks.find(b => b.id === blockId));
    
    setCollapsedBlockIds((prev) => {
      const newSet = new Set(prev);
      const wasCollapsed = newSet.has(blockId);
      console.log('[handleToggleExpand] Before toggle - wasCollapsed:', wasCollapsed);
      
      if (wasCollapsed) {
        // Jika sudah collapsed, expand (hapus dari set)
        newSet.delete(blockId);
        console.log('[handleToggleExpand] Expanding block - removed from set');
      } else {
        // Jika sudah expanded, collapse (tambah ke set)
        newSet.add(blockId);
        console.log('[handleToggleExpand] Collapsing block - added to set');
      }
      
      console.log('[handleToggleExpand] After toggle - newSet:', Array.from(newSet));
      console.log('[handleToggleExpand] BlockId:', blockId, 'Now Collapsed:', newSet.has(blockId));
      return newSet;
    });
  };

  // Render komponen form editing di sidebar
  const renderComponent = (block, index) => {
    // Default expanded, kecuali jika ada di collapsedBlockIds
    const isExpanded = !collapsedBlockIds.has(block.id);
    
    console.log('[renderComponent] Block:', block.id, 'Type:', block.type, 'isExpanded:', isExpanded, 'inCollapsedSet:', collapsedBlockIds.has(block.id));
    
    const commonProps = {
      data: block.data,
      onUpdate: (newData) => handleUpdateBlock(block.id, newData),
      blockId: block.id,
      index: index,
      onMoveUp: () => moveBlock(block.id, 'up'),
      onMoveDown: () => moveBlock(block.id, 'down'),
      onDelete: () => deleteBlock(block.id),
      isExpanded: isExpanded,
      onToggleExpand: () => {
        console.log('[renderComponent] onToggleExpand callback called for block:', block.id);
        handleToggleExpand(block.id);
      },
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
      case "price":
        return <PriceComponent {...commonProps} />;
      case "testimoni":
        return <TestimoniComponent {...commonProps} />;
      case "list":
        return <ListComponent {...commonProps} />;
      case "form":
        return <FormComponent {...commonProps} productKategori={productKategori} />;
      case "faq":
        return <FAQComponent {...commonProps} productKategori={productKategori} />;
      case "slider":
        return <SliderComponent {...commonProps} />;
      case "button":
        return <ButtonComponent {...commonProps} />;
      case "embed":
        return <EmbedComponent {...commonProps} />;
      case "section":
        return (
          <SectionComponent 
            {...commonProps}
            allBlocks={blocks}
            onAddChildBlock={handleAddChildBlock}
            onUpdateChildBlock={handleUpdateChildBlock}
            onDeleteChildBlock={handleDeleteChildBlock}
            onMoveChildBlock={handleMoveChildBlock}
          />
        );
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
        const textData = block.data || {};
        const textStyles = {
          // fontSize removed - now handled by inline styles in HTML content
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
      case "image":
        const imageData = block.data;
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
        const paddingTop = imageData.paddingTop || 0;
        const paddingRight = imageData.paddingRight || 0;
        const paddingBottom = imageData.paddingBottom || 0;
        const paddingLeft = imageData.paddingLeft || 0;

        // Calculate aspect ratio
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
        const objectFit = imageFit === "fill" ? "fill" : imageFit === "fit" ? "contain" : "fill";

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
        };

        return (
          <div style={containerStyle}>
            <div style={imageWrapperStyle}>
              <img 
                src={imageData.src} 
                alt={imageData.alt || ""} 
                style={{
                  width: "100%",
                  height: aspectRatio !== "OFF" ? "100%" : "auto",
                  objectFit: objectFit,
                  display: "block",
                }}
              />
            </div>
            {imageData.caption && <p className="preview-caption">{imageData.caption}</p>}
          </div>
        );
      case "youtube":
      case "video":
        const videoItems = block.data.items || [];
        if (videoItems.length === 0) {
          return <div className="preview-placeholder">Belum ada video</div>;
        }
        return (
          <div className="preview-videos">
            {videoItems.map((item, i) => (
              item.embedUrl ? (
                <div key={i} className="preview-video-wrapper">
                  <iframe src={item.embedUrl} title={`Video ${i + 1}`} className="preview-video-iframe" allowFullScreen />
                </div>
              ) : null
            ))}
          </div>
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
      case "list":
        const listItems = block.data.items || [];
        
        // Icon mapping
        const iconMap = {
          CheckCircle2, Circle, Minus, ArrowRight, ArrowRightCircle,
          ArrowLeft: ArrowLeftIcon, ArrowLeftRight, ChevronRight, CheckSquare, ShieldCheck,
          Lock, Dot, Target, Link: LinkIcon, PlusCircle, MinusCircle,
          Check, Star, Heart, ThumbsUp, Award, Zap, Flame, Sparkles,
          ArrowUp, ArrowDown, ArrowUpCircle, ArrowDownCircle, PlayCircle,
          PauseCircle, StopCircle, Radio, Square, Hexagon, Triangle,
          AlertCircle, Info, HelpCircle: HelpCircleIcon, Ban, Shield, Key, Unlock
        };
        
        const listTitle = block.data.componentTitle || "";
        const listData = block.data || {};
        
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
                <h3 className="preview-list-title">{listTitle}</h3>
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
      case "faq":
        // Generate FAQ berdasarkan kategori produk
        const faqItems = generateFAQByKategori(productKategori);
        
        // FAQ Item Component untuk preview
        const FAQItem = ({ question, answer }) => {
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
        };
        
        if (!productKategori) {
          return (
            <section className="preview-faq-section">
              <h2 className="faq-title">Pertanyaan yang Sering Diajukan</h2>
              <div className="faq-container">
                <div className="preview-placeholder">
                  Pilih kategori produk di tab Pengaturan untuk melihat FAQ otomatis
                </div>
              </div>
            </section>
          );
        }
        
        return (
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
        );
      case "form":
        // Gunakan productKategori dari state pengaturan, bukan dari block.data.kategori
        const isFormBuku = productKategori === 13;
        const isFormWorkshop = productKategori === 15;
        
        return (
          <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
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
                
                {/* Form Ongkir - Kategori Buku (13) */}
            {isFormBuku && (
                  <div className="compact-field">
                    <OngkirCalculator
                      onSelectOngkir={(info) => {
                        // Handle ongkir selection if needed
                        console.log('Ongkir selected:', info);
                      }}
                      onAddressChange={(address) => {
                        // Handle address change if needed
                        console.log('Address changed:', address);
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
                    <input type="text" placeholder="Rp 0" className="compact-input" />
                  </div>
                )}
                </div>
              </section>

            {/* Rincian Pesanan - General untuk semua kategori */}
            <section className="preview-form-section rincian-pesanan-section" aria-label="Rincian Pesanan">
              <div className="rincian-pesanan-card">
                <h3 className="rincian-pesanan-title">RINCIAN PESANAN:</h3>
                <div className="rincian-pesanan-item">
                  <div className="rincian-pesanan-detail">
                    <div className="rincian-pesanan-name">Nama Produk</div>
                  </div>
                  <div className="rincian-pesanan-price">Rp 0</div>
                </div>
                <div className="rincian-pesanan-divider"></div>
                <div className="rincian-pesanan-total">
                  <span className="rincian-pesanan-total-label">Total</span>
                  <span className="rincian-pesanan-total-price">Rp 0</span>
                </div>
              </div>
            </section>

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

            {/* Button Pesan Sekarang */}
            <div className="preview-form-submit-wrapper">
              <button type="button" className="preview-form-submit-btn">
                Pesan Sekarang
              </button>
            </div>
          </div>
        );
      case "price":
        // Format harga untuk ditampilkan
        const formatHarga = (harga) => {
          if (!harga || harga === 0) return "0";
          return harga.toLocaleString("id-ID");
        };
        
        const hargaAsli = pengaturanForm.harga_asli || 0;
        const hargaPromo = pengaturanForm.harga_promo || 0;
        
        return (
          <section className="preview-price-section special-offer-card" aria-label="Special offer" itemScope itemType="https://schema.org/Offer">
            <h2 className="special-offer-title">Special Offer!</h2>
            <div className="special-offer-price">
              {hargaAsli > 0 && hargaAsli > hargaPromo && (
              <span className="price-old" aria-label="Harga lama">
                  Rp {formatHarga(hargaAsli)}
              </span>
              )}
              <span className="price-new" itemProp="price" content={hargaPromo}>
                Rp {formatHarga(hargaPromo)}
              </span>
            </div>
            <meta itemProp="priceCurrency" content="IDR" />
            <meta itemProp="availability" content="https://schema.org/InStock" />
          </section>
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
      case "section":
        const sectionData = block.data || {};
        const sectionComponentId = sectionData.componentId || `section-${block.id}`;
        const sectionChildren = sectionData.children || [];
        
        // Find child blocks by both parentId and children array
        const sectionChildBlocks = blocks.filter(b => 
          b.parentId === sectionComponentId || sectionChildren.includes(b.id)
        );
        
        // Build section styles from advance settings
        const sectionStyles = {
          marginRight: `${sectionData.marginRight || 0}px`,
          marginLeft: `${sectionData.marginLeft || 0}px`,
          marginBottom: `${sectionData.marginBetween || 16}px`,
          border: sectionData.border ? `${sectionData.border}px solid ${sectionData.borderColor || "#000000"}` : "none",
          borderRadius: sectionData.borderRadius === "none" ? "0" : sectionData.borderRadius || "0",
          boxShadow: sectionData.boxShadow === "none" ? "none" : sectionData.boxShadow || "none",
          display: "block",
          width: "100%",
          padding: "16px",
        };
        
        return (
          <div className="preview-section" style={sectionStyles}>
            {sectionChildBlocks.length === 0 ? (
              <div className="preview-placeholder">Section kosong - tambahkan komponen</div>
            ) : (
              sectionChildBlocks.map((childBlock) => (
                <div key={childBlock.id} className="preview-section-child">
                  {renderPreview(childBlock)}
                </div>
              ))
            )}
          </div>
        );
      default:
        return <div className="preview-placeholder">{block.type}</div>;
    }
  };

  // Fungsi untuk generate FAQ berdasarkan kategori
  const generateFAQByKategori = (kategoriId) => {
    // Mapping FAQ berdasarkan kategori
    const faqMap = {
      // Kategori Ebook (10)
      10: [
        {
          question: "Apa saja yang akan saya dapatkan jika membeli ebook ini?",
          answer: "Anda akan mendapatkan akses ke file ebook dalam format PDF yang dapat diunduh dan dibaca kapan saja, plus bonus materi tambahan jika tersedia."
        },
        {
          question: "Bagaimana cara mengakses ebook setelah pembelian?",
          answer: "Setelah pembayaran dikonfirmasi, Anda akan menerima email berisi link download dan akses ke member area untuk mengunduh ebook."
        },
        {
          question: "Apakah ebook bisa diunduh berkali-kali?",
          answer: "Ya, setelah pembelian, Anda memiliki akses seumur hidup dan dapat mengunduh ebook berkali-kali sesuai kebutuhan."
        },
        {
          question: "Apakah ebook bisa dibaca di semua perangkat?",
          answer: "Ya, ebook dalam format PDF dapat dibaca di smartphone, tablet, laptop, dan komputer dengan aplikasi PDF reader."
        },
        {
          question: "Apakah ada garansi untuk ebook yang dibeli?",
          answer: "Kami memberikan garansi kepuasan. Jika tidak puas dengan konten ebook, silakan hubungi customer service kami untuk bantuan."
        }
      ],
      // Kategori Webinar (11)
      11: [
        {
          question: "Apa saja yang akan saya dapatkan dari webinar ini?",
          answer: "Anda akan mendapatkan akses live webinar, rekaman lengkap yang dapat ditonton ulang, materi presentasi, dan sertifikat kehadiran."
        },
        {
          question: "Bagaimana cara mengikuti webinar?",
          answer: "Setelah pembayaran dikonfirmasi, Anda akan menerima email berisi link Zoom/meeting room dan jadwal webinar. Link akan dikirim 1 hari sebelum acara."
        },
        {
          question: "Apakah ada rekaman jika saya tidak bisa hadir live?",
          answer: "Ya, semua peserta akan mendapatkan akses ke rekaman webinar yang dapat ditonton ulang kapan saja setelah acara selesai."
        },
        {
          question: "Berapa lama akses rekaman webinar tersedia?",
          answer: "Akses rekaman webinar tersedia seumur hidup. Anda dapat menonton ulang kapan saja melalui member area."
        },
        {
          question: "Apakah saya bisa bertanya langsung kepada pembicara?",
          answer: "Ya, pada sesi live webinar akan ada waktu untuk tanya jawab langsung dengan pembicara melalui fitur Q&A atau chat."
        }
      ],
      // Kategori Seminar (12)
      12: [
        {
          question: "Apa saja yang akan saya dapatkan dari seminar ini?",
          answer: "Anda akan mendapatkan tiket masuk seminar, materi presentasi, sertifikat kehadiran, networking session, dan coffee break."
        },
        {
          question: "Di mana lokasi seminar akan dilaksanakan?",
          answer: "Lokasi seminar akan diinformasikan melalui email setelah pembayaran dikonfirmasi. Biasanya di hotel atau venue yang mudah dijangkau."
        },
        {
          question: "Apakah ada rekaman seminar yang bisa saya akses?",
          answer: "Tergantung kebijakan acara. Jika tersedia, rekaman akan dibagikan kepada peserta setelah seminar selesai melalui email."
        },
        {
          question: "Bagaimana jika saya tidak bisa hadir di tanggal yang ditentukan?",
          answer: "Silakan hubungi customer service kami untuk informasi refund atau transfer tiket ke peserta lain. Kebijakan dapat berbeda tergantung waktu pemberitahuan."
        },
        {
          question: "Apakah ada diskon untuk pembelian tiket grup?",
          answer: "Ya, tersedia diskon khusus untuk pembelian tiket grup minimal 5 orang. Hubungi customer service kami untuk informasi lebih lanjut."
        }
      ],
      // Kategori Buku (13)
      13: [
        {
          question: "Apa saja yang akan saya dapatkan jika membeli buku ini?",
          answer: "Anda akan mendapatkan buku fisik berkualitas tinggi dengan konten lengkap dan terpercaya, plus akses ke materi tambahan jika tersedia."
        },
        {
          question: "Berapa lama waktu pengiriman buku?",
          answer: "Waktu pengiriman bervariasi tergantung lokasi Anda. Untuk wilayah Jabodetabek biasanya 2-3 hari kerja, sedangkan luar kota 3-7 hari kerja."
        },
        {
          question: "Apakah buku ini tersedia dalam format digital?",
          answer: "Saat ini buku tersedia dalam format fisik. Format digital akan diinformasikan lebih lanjut jika tersedia."
        },
        {
          question: "Bagaimana cara menghitung ongkos kirim?",
          answer: "Ongkos kirim akan dihitung otomatis berdasarkan alamat pengiriman Anda. Anda dapat melihat estimasi ongkir setelah memasukkan alamat lengkap."
        },
        {
          question: "Apakah ada garansi untuk buku yang dibeli?",
          answer: "Kami memberikan garansi untuk buku yang rusak atau cacat saat pengiriman. Silakan hubungi customer service kami jika mengalami masalah."
        }
      ],
      // Kategori Ecourse (14)
      14: [
        {
          question: "Apa saja yang akan saya dapatkan dari ecourse ini?",
          answer: "Anda akan mendapatkan akses ke semua modul pembelajaran, video tutorial, materi download, quiz, sertifikat, dan akses ke komunitas eksklusif."
        },
        {
          question: "Berapa lama akses ke ecourse tersedia?",
          answer: "Akses ke ecourse tersedia seumur hidup. Anda dapat belajar kapan saja dan mengulang materi sesuai kebutuhan."
        },
        {
          question: "Apakah ada support atau mentoring selama belajar?",
          answer: "Ya, tersedia support melalui grup komunitas, email, atau sesi Q&A berkala dengan instruktur untuk membantu proses pembelajaran Anda."
        },
        {
          question: "Apakah ecourse bisa diakses dari mobile?",
          answer: "Ya, platform ecourse kami mobile-friendly dan dapat diakses melalui smartphone, tablet, atau laptop dengan koneksi internet."
        },
        {
          question: "Apakah ada ujian atau sertifikat setelah menyelesaikan ecourse?",
          answer: "Ya, setelah menyelesaikan semua modul dan quiz, Anda akan mendapatkan sertifikat kelulusan yang dapat diunduh dan dicetak."
        }
      ],
      // Kategori Workshop (15)
      15: [
        {
          question: "Apa saja yang akan saya dapatkan dari workshop ini?",
          answer: "Anda akan mendapatkan materi lengkap, sertifikat, akses ke recording, dan komunitas eksklusif peserta workshop."
        },
        {
          question: "Apakah workshop ini cocok untuk pemula?",
          answer: "Ya, workshop ini dirancang untuk semua level, termasuk pemula. Materi akan disampaikan secara bertahap dan mudah dipahami."
        },
        {
          question: "Bagaimana sistem pembayaran untuk workshop?",
          answer: "Anda dapat melakukan pembayaran penuh atau menggunakan sistem down payment (uang muka) terlebih dahulu, kemudian melunasi sebelum workshop dimulai."
        },
        {
          question: "Apakah ada rekaman workshop yang bisa saya akses nanti?",
          answer: "Ya, semua peserta akan mendapatkan akses ke rekaman workshop yang dapat ditonton ulang kapan saja."
        },
        {
          question: "Bagaimana jika saya tidak bisa hadir di tanggal yang ditentukan?",
          answer: "Anda tetap bisa mengikuti workshop melalui rekaman yang akan diberikan. Namun, untuk interaksi langsung, disarankan hadir sesuai jadwal."
        }
      ],
      // Kategori Private Mentoring (16)
      16: [
        {
          question: "Apa saja yang akan saya dapatkan dari private mentoring ini?",
          answer: "Anda akan mendapatkan sesi mentoring one-on-one dengan mentor berpengalaman, personalized action plan, follow-up support, dan akses ke materi eksklusif."
        },
        {
          question: "Berapa kali sesi mentoring yang akan saya dapatkan?",
          answer: "Jumlah sesi mentoring tergantung paket yang dipilih. Detail lengkap akan diinformasikan setelah pembayaran dikonfirmasi."
        },
        {
          question: "Bagaimana cara menjadwalkan sesi mentoring?",
          answer: "Setelah pembayaran dikonfirmasi, tim kami akan menghubungi Anda untuk mengatur jadwal sesi mentoring yang sesuai dengan waktu luang Anda."
        },
        {
          question: "Apakah sesi mentoring dilakukan online atau offline?",
          answer: "Tersedia pilihan online (via Zoom/Google Meet) atau offline (jika memungkinkan). Detail akan dibahas saat konfirmasi jadwal."
        },
        {
          question: "Apakah ada follow-up setelah sesi mentoring selesai?",
          answer: "Ya, tersedia follow-up support melalui email atau grup komunitas untuk memastikan Anda dapat menerapkan ilmu yang didapat."
        }
      ]
    };

    // Return FAQ sesuai kategori, atau default jika tidak ada
    return faqMap[kategoriId] || [
      {
        question: "Apa saja yang akan saya dapatkan dari produk ini?",
        answer: "Anda akan mendapatkan akses penuh ke semua fitur dan konten yang tersedia dalam paket produk ini."
      },
      {
        question: "Bagaimana cara menggunakan produk ini?",
        answer: "Setelah pembayaran dikonfirmasi, Anda akan mendapatkan panduan lengkap dan akses ke platform produk."
      },
      {
        question: "Apakah ada garansi untuk produk ini?",
        answer: "Kami memberikan garansi kepuasan. Jika tidak puas, silakan hubungi customer service kami untuk bantuan."
      },
      {
        question: "Bagaimana sistem pembayarannya?",
        answer: "Pembayaran dapat dilakukan melalui berbagai metode yang tersedia. Setelah pembayaran dikonfirmasi, akses akan segera diberikan."
      },
      {
        question: "Apakah ada dukungan setelah pembelian?",
        answer: "Ya, tim customer service kami siap membantu Anda selama menggunakan produk ini. Hubungi kami kapan saja jika ada pertanyaan."
      }
    ];
  };

  // Fetch kategori dan user options
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch kategori
        const kategoriRes = await fetch("/api/sales/kategori-produk", { headers });
        const kategoriData = await kategoriRes.json();
        
        const activeCategories = Array.isArray(kategoriData.data)
          ? kategoriData.data.filter((k) => k.status === "1")
          : [];
        
        const kategoriOpts = activeCategories.map((k) => ({
          label: `${k.id} - ${k.nama}`,
          value: String(k.id),
        }));
        setKategoriOptions(kategoriOpts);

        // Fetch sales list from /api/sales/lead/sales-list
        const salesRes = await fetch("/api/sales/lead/sales-list", { headers });
        const salesJson = await salesRes.json();
        
        const salesOpts = Array.isArray(salesJson.data)
          ? salesJson.data.map((sales) => ({
              label: sales.nama || sales.name || `Sales ${sales.id}`,
              value: String(sales.id),
            }))
          : [];
        setUserOptions(salesOpts);
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    }
    fetchInitialData();
  }, []);

  // Fungsi untuk generate kode dari nama (slugify)
  const generateKode = (text) => {
    if (!text) return "";
    
    return text
      .toLowerCase()
      .trim()
      // Hapus karakter khusus, hanya simpan huruf, angka, spasi, dan dash
      .replace(/[^a-z0-9\s-]/g, "")
      // Ganti multiple spaces dengan single space
      .replace(/\s+/g, " ")
      // Ganti spasi dengan dash
      .replace(/\s/g, "-")
      // Hapus multiple dash menjadi single dash
      .replace(/-+/g, "-")
      // Hapus dash di awal dan akhir
      .replace(/^-+|-+$/g, "");
  };

  // Handler untuk update form pengaturan
  const handlePengaturanChange = (key, value) => {
    if (key === "nama") {
      // Auto-generate kode dan URL dari nama
      const kode = generateKode(value);
      const url = kode ? `/${kode}` : "";
      console.log("[AUTO-GENERATE] Nama:", value, "→ Kode:", kode, "→ URL:", url);
      setPengaturanForm((prev) => ({ 
        ...prev, 
        nama: value,
        kode: kode,
        url: url
      }));
    } else {
      setPengaturanForm((prev) => ({ ...prev, [key]: value }));
    }
  };

  // Handler untuk save dan publish
  const handleSaveAndPublish = async () => {
    // Validasi
    if (!pengaturanForm.nama || !pengaturanForm.nama.trim()) {
      toast.error("Nama produk wajib diisi");
      return;
    }

    if (!pengaturanForm.kategori) {
      toast.error("Kategori wajib dipilih");
      return;
    }

    if (!pengaturanForm.harga_promo) {
      toast.error("Harga promo wajib diisi");
      return;
    }

    if (!pengaturanForm.assign || pengaturanForm.assign.length === 0) {
      toast.error("Penanggung jawab wajib dipilih");
      return;
    }

    // Format tanggal event
    let formattedDate = null;
    if (pengaturanForm.tanggal_event) {
      const date = new Date(pengaturanForm.tanggal_event);
      formattedDate = date.toISOString();
    }

    // Prepare payload
    const payload = {
      nama: pengaturanForm.nama.trim(),
      kategori: String(pengaturanForm.kategori),
      kode: pengaturanForm.kode || generateKode(pengaturanForm.nama),
      url: pengaturanForm.url || `/${generateKode(pengaturanForm.nama)}`,
      harga_asli: pengaturanForm.harga_asli ? String(pengaturanForm.harga_asli) : "0",
      harga_promo: String(pengaturanForm.harga_promo),
      tanggal_event: formattedDate,
      assign: pengaturanForm.assign,
      background_color: pengaturanForm.background_color || "#ffffff",
      page_title: pengaturanForm.page_title || "",
      landingpage: "1",
      status: "1",
      blocks: blocks.map(block => ({
        type: block.type,
        data: block.data,
        order: block.order
      }))
    };

    try {
      toast.loading("Menyimpan produk...", { id: "save-product" });
      
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      
      const response = await fetch("/api/sales/produk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        const errorMessage = data?.message || "Gagal menyimpan produk";
        toast.error(errorMessage, { id: "save-product" });
        return;
      }

      toast.success("Produk berhasil disimpan dan dipublish!", { id: "save-product" });
      
      // Redirect ke halaman products
      setTimeout(() => {
        router.push("/sales/products");
      }, 1000);

    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Terjadi kesalahan saat menyimpan produk", { id: "save-product" });
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
                    title={component.name}
                  >
                    <div 
                      className="component-icon"
                      style={{ backgroundColor: "#f3f4f6" }}
                    >
                      <IconComponent 
                        size={24} 
                        style={{ color: "#6b7280" }}
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
      {/* Header Section with Back Button and Save Button */}
      <div className="page-header-section">
        <button
          className="back-to-products-btn"
          onClick={() => router.push("/sales/products")}
          aria-label="Back to products list"
        >
          <ArrowLeft size={18} />
          <span>Back to Products</span>
        </button>
        <button
          className="save-publish-btn"
          onClick={handleSaveAndPublish}
          aria-label="Simpan dan Publish"
        >
          <span>Simpan dan Publish</span>
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
              <div 
                key={block.id} 
                className="sidebar-component-item"
                ref={(el) => {
                  if (el) {
                    componentRefs.current[block.id] = el;
                  }
                }}
              >
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
                {/* Informasi Dasar */}
                <div className="pengaturan-section">
                  <h3 className="pengaturan-section-title">Informasi Dasar</h3>
                  <p className="pengaturan-section-description">Data utama produk yang akan ditampilkan</p>
                  
                  <div className="pengaturan-form-group">
                    <label className="pengaturan-label">
                      Nama Produk <span className="required">*</span>
                    </label>
                    <InputText
                      className="pengaturan-input"
                      value={pengaturanForm.nama}
                      onChange={(e) => handlePengaturanChange("nama", e.target.value)}
                      placeholder="Masukkan nama produk"
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="form-label">
                      Kategori <span className="required">*</span>
                    </label>
                    <Dropdown
                      className="w-full form-input"
                      value={pengaturanForm.kategori}
                      options={kategoriOptions}
                      optionLabel="label"
                      optionValue="value"
                      onChange={(e) => {
                        const selectedValue = e.value;
                        const finalValue = selectedValue !== null && selectedValue !== undefined && selectedValue !== ""
                          ? String(selectedValue) 
                          : null;
                        handlePengaturanChange("kategori", finalValue);
                        setProductKategori(finalValue ? Number(finalValue) : null);
                      }}
                      placeholder="Pilih Kategori"
                      showClear
                      filter
                      filterPlaceholder="Cari kategori..."
                    />
                    {!pengaturanForm.kategori && (
                      <small className="field-hint" style={{ color: "#ef4444" }}>
                        Kategori wajib dipilih
                      </small>
                    )}
                  </div>

                  <div className="pengaturan-form-group">
                    <label className="pengaturan-label">Kode Produk</label>
                    <InputText
                      className="pengaturan-input"
                      value={pengaturanForm.kode || ""}
                      placeholder="Otomatis dari nama produk"
                      readOnly
                      style={{ background: "#f9fafb", cursor: "not-allowed" }}
                    />
                    <small className="pengaturan-hint">Kode otomatis di-generate dari nama produk</small>
                  </div>

                  <div className="pengaturan-form-group">
                    <label className="pengaturan-label">URL</label>
                    <InputText
                      className="pengaturan-input"
                      value={pengaturanForm.url || ""}
                      placeholder="Otomatis dari kode produk"
                      readOnly
                      style={{ background: "#f9fafb", cursor: "not-allowed" }}
                    />
                    <small className="pengaturan-hint">URL otomatis di-generate dari kode produk</small>
                  </div>
                </div>

                {/* Harga Asli */}
                <div className="pengaturan-section">
                  <h3 className="pengaturan-section-title">Harga</h3>
                  
                  <div className="pengaturan-form-group">
                    <label className="pengaturan-label">Harga Normal</label>
                    <InputNumber
                      className="pengaturan-input"
                      value={pengaturanForm.harga_asli}
                      onValueChange={(e) => handlePengaturanChange("harga_asli", e.value)}
                      placeholder="Masukkan harga asli"
                      mode="currency"
                      currency="IDR"
                      locale="id-ID"
                      useGrouping={true}
                    />
                  </div>

                  <div className="pengaturan-form-group">
                    <label className="pengaturan-label">
                      Harga Promo <span className="required">*</span>
                    </label>
                    <InputNumber
                      className="pengaturan-input"
                      value={pengaturanForm.harga_promo}
                      onValueChange={(e) => handlePengaturanChange("harga_promo", e.value)}
                      placeholder="Masukkan harga promo"
                      mode="currency"
                      currency="IDR"
                      locale="id-ID"
                      useGrouping={true}
                    />
                  </div>

                  <div className="pengaturan-form-group">
                    <label className="pengaturan-label">Tanggal Event</label>
                    <Calendar
                      className="pengaturan-input"
                      value={pengaturanForm.tanggal_event}
                      onChange={(e) => handlePengaturanChange("tanggal_event", e.value)}
                      placeholder="Pilih tanggal dan jam event"
                      showIcon
                      showTime
                      hourFormat="24"
                      dateFormat="dd/mm/yy"
                      timeOnly={false}
                      showSeconds={false}
                      showButtonBar
                    />
                  </div>
                </div>

                {/* Penanggung Jawab */}
                <div className="pengaturan-section">
                  <div className="form-field-group">
                    <label className="form-label">
                      Penanggung Jawab (Assign By) <span className="required">*</span>
                    </label>
                    <MultiSelect
                      className="w-full form-input"
                      value={pengaturanForm.assign}
                      options={userOptions}
                      onChange={(e) => handlePengaturanChange("assign", e.value || [])}
                      placeholder="Pilih penanggung jawab produk"
                      display="chip"
                      showClear
                      filter
                      filterPlaceholder="Cari user..."
                    />
                    <p className="field-hint">Pilih user yang bertanggung jawab menangani produk ini</p>
                  </div>
                </div>

                {/* Page Title - SEO Meta Tag */}
                <div className="pengaturan-section">
                  <h3 className="pengaturan-section-title">SEO & Meta</h3>
                  <p className="pengaturan-section-description">Pengaturan untuk SEO dan meta tag halaman</p>
                  
                  <div className="pengaturan-form-group">
                    <label className="pengaturan-label">
                      Page Title (Browser Tab Title)
                    </label>
                    <InputText
                      className="pengaturan-input"
                      value={pengaturanForm.page_title || ""}
                      onChange={(e) => handlePengaturanChange("page_title", e.target.value)}
                      placeholder="Contoh: BANDUNG- Seminar Ternak Properti"
                    />
                    <small className="pengaturan-hint">Judul yang akan muncul di browser tab dan hasil pencarian Google. Jika kosong, akan menggunakan nama produk.</small>
                  </div>
                </div>

                {/* Background Color */}
                <div className="pengaturan-section">
                  <h3 className="pengaturan-section-title">Tampilan</h3>
                  <p className="pengaturan-section-description">Pengaturan tampilan halaman landing page</p>

                  <div className="pengaturan-form-group">
                    <label className="pengaturan-label">
                      Background Color
                    </label>
                    
                    {/* Modern Background Color Picker */}
                    <div className="modern-bg-color-picker" ref={bgColorPickerRef}>
                      {/* Current Color Preview */}
                      <div 
                        className="modern-bg-color-preview"
                        style={{ backgroundColor: pengaturanForm.background_color || "#ffffff" }}
                        onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                      >
                        <div className="modern-bg-color-preview-inner">
                          <span className="modern-bg-color-hex">
                            {pengaturanForm.background_color || "#ffffff"}
                          </span>
                          <ChevronDown size={16} />
                        </div>
                      </div>

                      {/* Color Picker Dropdown */}
                      {showBgColorPicker && (
                        <div className="modern-bg-color-picker-popup">
                          <div className="modern-bg-color-header">
                            <span>Pilih Warna Background</span>
                            <button
                              className="modern-bg-color-close"
                              onClick={() => setShowBgColorPicker(false)}
                            >
                              <X size={16} />
                            </button>
                          </div>

                          {/* Preset Colors Grid */}
                          <div className="modern-bg-color-presets">
                            <div className="modern-bg-color-presets-label">Warna Cepat</div>
                            <div className="modern-bg-color-presets-grid">
                              {presetBgColors.map((color, idx) => (
                                <button
                                  key={idx}
                                  className={`modern-bg-color-preset-item ${
                                    (pengaturanForm.background_color || "#ffffff") === color.value ? "selected" : ""
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                  onClick={() => {
                                    handlePengaturanChange("background_color", color.value);
                                    setShowBgColorPicker(false);
                                  }}
                                  title={color.name}
                                >
                                  {(pengaturanForm.background_color || "#ffffff") === color.value && (
                                    <div className="modern-bg-color-check">✓</div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="modern-bg-color-divider"></div>

                          {/* Custom Color Picker */}
                          <div className="modern-bg-color-custom">
                            <div className="modern-bg-color-custom-label">Warna Kustom</div>
                            <div className="modern-bg-color-custom-picker">
                              <input
                                type="color"
                                value={pengaturanForm.background_color || "#ffffff"}
                                onChange={(e) => handlePengaturanChange("background_color", e.target.value)}
                                className="modern-bg-color-input"
                              />
                              <InputText
                                className="pengaturan-input"
                                value={pengaturanForm.background_color || "#ffffff"}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === "") {
                                    handlePengaturanChange("background_color", value || "#ffffff");
                                  }
                                }}
                                placeholder="#ffffff"
                                style={{ flex: 1, fontFamily: "monospace" }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <small className="pengaturan-hint">Pilih warna background untuk halaman landing page</small>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Canvas - Preview */}
        <div className="page-builder-canvas">
          <div 
            className="canvas-wrapper"
            style={{ 
              backgroundColor: pengaturanForm.background_color || "#ffffff"
            }}
          >
            {/* Logo - Hardcode di bagian atas center */}
            <div className="canvas-logo-wrapper">
              <img 
                src="/assets/logo.png" 
                alt="Logo" 
                className="canvas-logo"
              />
            </div>
            
            {/* Content Area */}
            <div className="canvas-content-area">
              {/* Placeholder jika belum ada komponen */}
              {blocks.length === 0 && !pengaturanForm.nama && (
                <div className="canvas-empty">
                  <p>Klik "Tambah Komponen Baru" untuk memulai</p>
                </div>
              )}
              
              {/* Preview komponen */}
              {blocks.map((block) => (
                <div 
                  key={block.id} 
                  className="canvas-preview-block"
                  onClick={() => {
                    // Scroll ke komponen di sidebar
                    const componentElement = componentRefs.current[block.id];
                    if (componentElement) {
                      componentElement.scrollIntoView({ behavior: "smooth", block: "center" });
                      // Expand komponen jika collapsed
                      if (collapsedBlockIds.has(block.id)) {
                        handleToggleExpand(block.id);
                      }
                    }
                  }}
                  style={{ cursor: "pointer" }}
                  title="Klik untuk scroll ke komponen di sidebar"
                >
                  {renderPreview(block)}
                </div>
              ))}
            </div>

            {/* Footer */}
            <footer className="canvas-footer">
              <div className="canvas-footer-content">
                <p className="canvas-footer-brand">Ternak Properti</p>
                <p className="canvas-footer-copyright">Copyright 2018-2025, All Rights Reserved</p>
              </div>
            </footer>
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

