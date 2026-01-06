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
  AlertCircle, Info, HelpCircle as HelpCircleIcon, Ban, Shield, Key, Unlock,
  Clock
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
  SectionComponent,
  SliderComponent,
  ButtonComponent,
  EmbedComponent,
  HTMLComponent,
  DividerComponent,
  ScrollTargetComponent,
  AnimationComponent,
  CountdownComponent,
  ImageSliderComponent,
  QuotaInfoComponent,
} from './components';
import CountdownPreview from './components/CountdownPreview';
import ImageSliderPreview from './components/ImageSliderPreview';
import QuotaInfoPreview from './components/QuotaInfoPreview';
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
      { id: "countdown", name: "Countdown", icon: Clock, color: "#6b7280" },
      { id: "image-slider", name: "Image Slider", icon: ImageIcon, color: "#6b7280" },
      { id: "quota-info", name: "Info Kuota", icon: Users, color: "#6b7280" },
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
  const [selectedBundling, setSelectedBundling] = useState(null); // State untuk bundling yang dipilih
  
  // State untuk form pengaturan
  const [pengaturanForm, setPengaturanForm] = useState({
    nama: "",
    kategori: null,
    kode: "",
    url: "",
    harga: null,
    jenis_produk: "fisik", // "fisik" atau "non-fisik"
    isBundling: false,
    bundling: [], // Array of { nama: string, harga: number }
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
      faq: { items: [] },
      slider: { images: [] },
      "image-slider": { 
        images: [],
        sliderType: "gallery",
        autoslide: false,
        autoslideDuration: 5,
        showCaption: false
      },
      "quota-info": {
        totalKuota: 60,
        sisaKuota: 47,
        headline: "Sisa kuota terbatas!",
        subtext: "Jangan tunda lagi, amankan kursi Anda sebelum kuota habis.",
        highlightText: "Daftar sekarang sebelum kehabisan."
      },
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
      countdown: { 
        hours: 0, 
        minutes: 0, 
        seconds: 0, 
        promoText: "Promo Berakhir Dalam:",
        textColor: "#e5e7eb",
        bgColor: "#1f2937",
        numberStyle: "flip"
      },
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
      case "countdown":
        return <CountdownComponent {...commonProps} />;
      case "image-slider":
        return <ImageSliderComponent {...commonProps} />;
      case "quota-info":
        return <QuotaInfoComponent {...commonProps} />;
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

        // Calculate aspect ratio - ketika dipilih, gambar akan di-crop sesuai ratio
        let aspectRatioStyle = {};
        if (aspectRatio !== "OFF") {
          const [width, height] = aspectRatio.split(":").map(Number);
          if (width && height) {
            // Set aspect ratio pada wrapper untuk membuat frame crop
            // Ini akan membuat wrapper memiliki ukuran sesuai aspect ratio
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

        // Container style with alignment
        const containerStyle = {
          display: "flex",
          justifyContent: alignment === "left" ? "flex-start" : alignment === "right" ? "flex-end" : "center",
          width: "100%",
          ...imagePaddingStyle,
        };

        // Image wrapper style - ukuran akan berubah sesuai aspect ratio yang dipilih
        const imageWrapperStyle = {
          width: `${imageWidth}%`,
          ...aspectRatioStyle,
          ...imageBackgroundStyle,
          overflow: "hidden",
          borderRadius: "4px",
          position: "relative",
        };

        // Ketika aspect ratio dipilih, wrapper akan otomatis memiliki tinggi sesuai ratio
        // CSS aspect-ratio akan menghitung tinggi berdasarkan lebar dan ratio

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
      case "youtube":
      case "video":
        const videoItems = block.data.items || [];
        if (videoItems.length === 0) {
          return <div className="preview-placeholder">Belum ada video</div>;
        }
        
        // Advanced settings untuk video
        const videoData = block.data || {};
        const videoAlignment = videoData.alignment || "center";
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
        
        // Video wrapper style dengan width dan aspect ratio 16:9
        const videoWrapperStyle = {
          width: `${videoWidth}%`,
          maxWidth: "100%", // Pastikan tidak melebihi container
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
              item.embedUrl ? (
                <div key={i} className="preview-video-wrapper" style={videoWrapperStyle}>
                  <iframe 
                    src={item.embedUrl} 
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
        
        const testimoniTitle = block.data.componentTitle || "Testimoni Pembeli";
        
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
        // Gunakan productKategori dari state pengaturan
        const isFormBuku = productKategori === 4; // Kategori Buku (4)
        const isFormWorkshop = productKategori === 6; // Kategori Workshop (6)
        // Cek jenis produk untuk menentukan apakah perlu ongkir
        const isProdukFisik = pengaturanForm.jenis_produk === "fisik";
        
        return (
          <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            {/* Bundling Section - Tampilkan jika ada bundling */}
            {pengaturanForm.isBundling && pengaturanForm.bundling && pengaturanForm.bundling.length > 0 && (
              <section className="preview-form-section bundling-section" aria-label="Package Selection" style={{
                marginBottom: "24px",
                padding: "24px",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)"
              }}>
                <h2 style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#000000",
                  marginBottom: "8px",
                  lineHeight: "1.4"
                }}>
                  {pengaturanForm.nama || "Produk"}
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
                  {pengaturanForm.bundling.map((item, index) => {
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
                          // Update harga di Rincian Pemesanan
                          requestAnimationFrame(() => {
                            const hargaElement = document.querySelector('.rincian-pesanan-item .rincian-pesanan-price');
                            const totalElement = document.getElementById('rincian-total');
                            const ongkirElement = document.getElementById('rincian-ongkir');
                            
                            const harga = item.harga || 0;
                            
                            if (hargaElement && !hargaElement.id) {
                              hargaElement.textContent = `Rp ${formatHarga(harga)}`;
                            }
                            
                            if (totalElement) {
                              // Get ongkir jika ada (untuk kategori 4)
                              const ongkir = ongkirElement && ongkirElement.textContent !== "Rp 0" 
                                ? parseInt(ongkirElement.textContent.replace(/[^0-9]/g, '')) || 0 
                                : 0;
                              const total = harga + ongkir;
                              totalElement.textContent = `Rp ${formatHarga(total)}`;
                            }
                          });
                        }}
                        style={{
                          flex: "1 1 calc(33.333% - 8px)",
                          minWidth: "200px",
                          padding: "16px 20px",
                          borderRadius: "10px",
                          border: isSelected ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                          backgroundColor: isSelected ? "#3b82f6" : "#ffffff",
                          color: isSelected ? "#ffffff" : "#374151",
                          fontSize: "15px",
                          fontWeight: "500",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          textAlign: "center",
                          boxShadow: isSelected ? "0 4px 12px rgba(59, 130, 246, 0.3)" : "0 1px 3px rgba(0, 0, 0, 0.1)",
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

            {/* Form Pemesanan */}
            <section className="preview-form-section compact-form-section" aria-label="Order form">
              <h2 className="compact-form-title" style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#000000",
                marginBottom: "12px"
              }}>Lengkapi Data:</h2>
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
                
                {/* Alamat - Semua Kategori Sama: Provinsi, Kabupaten, Kecamatan, Kode Pos */}
                <div className="compact-field">
                  <label className="compact-label">Provinsi <span className="required">*</span></label>
                  <input type="text" placeholder="Contoh: DKI Jakarta" className="compact-input" />
                </div>
                <div className="compact-field">
                  <label className="compact-label">Kabupaten/Kota <span className="required">*</span></label>
                  <input type="text" placeholder="Contoh: Jakarta Selatan" className="compact-input" />
                </div>
                <div className="compact-field">
                  <label className="compact-label">Kecamatan <span className="required">*</span></label>
                  <input type="text" placeholder="Contoh: Kebayoran Baru" className="compact-input" />
                </div>
                <div className="compact-field">
                  <label className="compact-label">Kode Pos <span className="required">*</span></label>
                  <input type="text" placeholder="Contoh: 12120" className="compact-input" />
                </div>
                
                {/* Form Ongkir - Hanya untuk produk Fisik */}
                {isProdukFisik && (
                  <div className="compact-field">
                    <OngkirCalculator
                      onSelectOngkir={(info) => {
                        // Update ongkir di Rincian Pemesanan
                        const ongkirElement = document.getElementById('rincian-ongkir');
                        const totalElement = document.getElementById('rincian-total');
                        
                        const formatHarga = (harga) => {
                          if (!harga || harga === 0) return "0";
                          return harga.toLocaleString("id-ID");
                        };
                        
                        // Get harga yang aktif (bundling atau default)
                        let activeHarga = pengaturanForm.harga || 0;
                        if (pengaturanForm.isBundling && selectedBundling !== null && pengaturanForm.bundling && pengaturanForm.bundling[selectedBundling]) {
                          activeHarga = pengaturanForm.bundling[selectedBundling].harga || 0;
                        }
                        
                        if (ongkirElement && info && info.cost) {
                          const ongkir = info.cost;
                          
                          // Update ongkir display
                          ongkirElement.textContent = `Rp ${formatHarga(ongkir)}`;
                          
                          // Update total (harga aktif + ongkir)
                          if (totalElement) {
                            const total = activeHarga + ongkir;
                            totalElement.textContent = `Rp ${formatHarga(total)}`;
                          }
                        } else if (ongkirElement) {
                          ongkirElement.textContent = "Rp 0";
                          // Reset total ke harga aktif saja
                          if (totalElement) {
                            totalElement.textContent = `Rp ${formatHarga(activeHarga)}`;
                          }
                        }
                      }}
                      onAddressChange={(address) => {
                        // Reset ongkir saat alamat berubah
                        const ongkirElement = document.getElementById('rincian-ongkir');
                        const totalElement = document.getElementById('rincian-total');
                        
                        const formatHarga = (harga) => {
                          if (!harga || harga === 0) return "0";
                          return harga.toLocaleString("id-ID");
                        };
                        
                        // Get harga yang aktif (bundling atau default)
                        let activeHarga = pengaturanForm.harga || 0;
                        if (pengaturanForm.isBundling && selectedBundling !== null && pengaturanForm.bundling && pengaturanForm.bundling[selectedBundling]) {
                          activeHarga = pengaturanForm.bundling[selectedBundling].harga || 0;
                        }
                        
                        if (ongkirElement) {
                          ongkirElement.textContent = "Rp 0";
                        }
                        
                        if (totalElement) {
                          totalElement.textContent = `Rp ${formatHarga(activeHarga)}`;
                        }
                      }}
                      defaultCourier="jne"
                      compact={true}
                    />
                  </div>
                )}

                {/* Form Down Payment - Kategori Workshop (6) */}
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
                    <div className="rincian-pesanan-name">{pengaturanForm.nama || "Nama Produk"}</div>
                  </div>
                  <div className="rincian-pesanan-price">
                    {(() => {
                      const formatHarga = (harga) => {
                        if (!harga || harga === 0) return "0";
                        return harga.toLocaleString("id-ID");
                      };
                      // Gunakan harga bundling jika dipilih, jika tidak gunakan harga default
                      let harga = pengaturanForm.harga || 0;
                      if (pengaturanForm.isBundling && selectedBundling !== null && pengaturanForm.bundling && pengaturanForm.bundling[selectedBundling]) {
                        harga = pengaturanForm.bundling[selectedBundling].harga || 0;
                      }
                      return `Rp ${formatHarga(harga)}`;
                    })()}
                  </div>
                </div>
                {/* Ongkir - Hanya untuk produk Fisik */}
                {isProdukFisik && (
                  <>
                    <div className="rincian-pesanan-item">
                      <div className="rincian-pesanan-detail">
                        <div className="rincian-pesanan-name">Ongkos Kirim</div>
                      </div>
                      <div className="rincian-pesanan-price" id="rincian-ongkir">
                        Rp 0
                      </div>
                    </div>
                  </>
                )}
                <div className="rincian-pesanan-divider"></div>
                <div className="rincian-pesanan-total">
                  <span className="rincian-pesanan-total-label">Total</span>
                  <span className="rincian-pesanan-total-price" id="rincian-total">
                    {(() => {
                      const formatHarga = (harga) => {
                        if (!harga || harga === 0) return "0";
                        return harga.toLocaleString("id-ID");
                      };
                      // Gunakan harga bundling jika dipilih, jika tidak gunakan harga default
                      let harga = pengaturanForm.harga || 0;
                      if (pengaturanForm.isBundling && selectedBundling !== null && pengaturanForm.bundling && pengaturanForm.bundling[selectedBundling]) {
                        harga = pengaturanForm.bundling[selectedBundling].harga || 0;
                      }
                      // Untuk produk fisik, ongkir akan ditambahkan saat user pilih ongkir
                      // Untuk non-fisik, total = harga saja (tidak ada ongkir)
                      return `Rp ${formatHarga(harga)}`;
                    })()}
                  </span>
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
      case "countdown":
        return <CountdownPreview data={block.data || {}} index={block.id} />;
      case "image-slider":
        return <ImageSliderPreview data={block.data || {}} />;
      case "quota-info":
        return <QuotaInfoPreview data={block.data || {}} />;
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
    // Mapping FAQ berdasarkan kategori (1-7)
    const faqMap = {
      // Kategori Ebook (1)
      1: [
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
      // Kategori Webinar (2)
      2: [
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
      // Kategori Seminar (3)
      3: [
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
      // Kategori Buku (4)
      4: [
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
      // Kategori Ecourse (5)
      5: [
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
      // Kategori Workshop (6)
      6: [
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
      // Kategori Private Mentoring (7)
      7: [
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
      // Nama produk tidak auto-generate kode dan URL
      setPengaturanForm((prev) => ({ 
        ...prev, 
        nama: value
      }));
      
      // Update nama produk di Rincian Pemesanan
      requestAnimationFrame(() => {
        const namaElement = document.querySelector('.rincian-pesanan-name');
        if (namaElement) {
          namaElement.textContent = value || "Nama Produk";
        }
      });
    } else if (key === "kode") {
      // Kode produk bisa custom ketik bebas
      // URL auto-generate dari kode produk
      const url = value ? `/${generateKode(value)}` : "";
      setPengaturanForm((prev) => ({ 
        ...prev, 
        kode: value,
        url: url
      }));
    } else {
      setPengaturanForm((prev) => ({ ...prev, [key]: value }));
      
      // Update total di Rincian Pemesanan saat harga berubah
      if (key === "harga") {
        requestAnimationFrame(() => {
          const totalElement = document.getElementById('rincian-total');
          const ongkirElement = document.getElementById('rincian-ongkir');
          
          if (totalElement) {
            const harga = value || 0;
            // Hanya hitung ongkir jika produk fisik
            const ongkir = (pengaturanForm.jenis_produk === "fisik" && ongkirElement) 
              ? parseInt(ongkirElement.textContent.replace(/[^0-9]/g, '')) || 0 
              : 0;
            const total = harga + ongkir;
            
            const formatHarga = (harga) => {
              if (!harga || harga === 0) return "0";
              return harga.toLocaleString("id-ID");
            };
            
            totalElement.textContent = `Rp ${formatHarga(total)}`;
          }
          
          // Update harga produk di Rincian Pemesanan
          const hargaElement = document.querySelector('.rincian-pesanan-item .rincian-pesanan-price');
          if (hargaElement && !hargaElement.id) {
            const formatHarga = (harga) => {
              if (!harga || harga === 0) return "0";
              return harga.toLocaleString("id-ID");
            };
            hargaElement.textContent = `Rp ${formatHarga(value || 0)}`;
          }
        });
      }
      
      // Reset ongkir saat jenis produk berubah
      if (key === "jenis_produk") {
        requestAnimationFrame(() => {
          const ongkirElement = document.getElementById('rincian-ongkir');
          const totalElement = document.getElementById('rincian-total');
          
          const formatHarga = (harga) => {
            if (!harga || harga === 0) return "0";
            return harga.toLocaleString("id-ID");
          };
          
          // Get harga aktif (bundling atau default)
          let activeHarga = pengaturanForm.harga || 0;
          if (pengaturanForm.isBundling && selectedBundling !== null && pengaturanForm.bundling && pengaturanForm.bundling[selectedBundling]) {
            activeHarga = pengaturanForm.bundling[selectedBundling].harga || 0;
          }
          
          if (value === "non-fisik") {
            // Non-fisik: reset ongkir dan total = harga saja
            if (ongkirElement) {
              ongkirElement.textContent = "Rp 0";
            }
            if (totalElement) {
              totalElement.textContent = `Rp ${formatHarga(activeHarga)}`;
            }
          } else {
            // Fisik: reset ongkir ke 0, total = harga (ongkir akan dihitung saat user pilih)
            if (ongkirElement) {
              ongkirElement.textContent = "Rp 0";
            }
            if (totalElement) {
              totalElement.textContent = `Rp ${formatHarga(activeHarga)}`;
            }
          }
        });
      }
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

    if (!pengaturanForm.harga) {
      toast.error("Harga wajib diisi");
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
      harga_asli: "0", // Legacy field, tetap kirim 0
      harga_promo: String(pengaturanForm.harga || 0), // Gunakan harga untuk backward compatibility
      harga: String(pengaturanForm.harga || 0),
      jenis_produk: pengaturanForm.jenis_produk || "fisik",
      isBundling: pengaturanForm.isBundling || false,
      bundling: JSON.stringify(pengaturanForm.bundling || []),
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
                      onChange={(e) => handlePengaturanChange("kode", e.target.value)}
                      placeholder="Masukkan kode produk (custom)"
                    />
                    <small className="pengaturan-hint">Kode produk dapat diketik bebas, URL akan otomatis di-generate dari kode produk</small>
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

                {/* Jenis Produk */}
                <div className="pengaturan-section">
                  <h3 className="pengaturan-section-title">Jenis Produk</h3>
                  <p className="pengaturan-section-description">Tentukan jenis produk untuk menghitung ongkos kirim</p>
                  
                  <div className="pengaturan-form-group">
                    <label className="pengaturan-label">
                      Jenis Produk <span className="required">*</span>
                    </label>
                    <Dropdown
                      className="pengaturan-input"
                      value={pengaturanForm.jenis_produk || "fisik"}
                      options={[
                        { label: "Fisik", value: "fisik" },
                        { label: "Non-Fisik", value: "non-fisik" }
                      ]}
                      onChange={(e) => handlePengaturanChange("jenis_produk", e.value)}
                      placeholder="Pilih jenis produk"
                    />
                    <small className="pengaturan-hint">
                      Produk Fisik memerlukan ongkos kirim, Non-Fisik tidak memerlukan ongkos kirim
                    </small>
                  </div>
                </div>

                {/* Harga */}
                <div className="pengaturan-section">
                  <h3 className="pengaturan-section-title">Harga</h3>
                  
                  <div className="pengaturan-form-group">
                    <label className="pengaturan-label">
                      Harga <span className="required">*</span>
                    </label>
                    <InputNumber
                      className="pengaturan-input"
                      value={pengaturanForm.harga}
                      onValueChange={(e) => handlePengaturanChange("harga", e.value)}
                      placeholder="Masukkan harga"
                      mode="currency"
                      currency="IDR"
                      locale="id-ID"
                      useGrouping={true}
                    />
                  </div>

                  {/* Checkbox Bundling */}
                  <div className="pengaturan-form-group">
                    <label className="pengaturan-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={pengaturanForm.isBundling || false}
                        onChange={(e) => handlePengaturanChange("isBundling", e.target.checked)}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      <span>Bundling</span>
                    </label>
                  </div>

                  {/* Form Bundling */}
                  {pengaturanForm.isBundling && (
                    <div className="pengaturan-form-group" style={{ marginTop: "16px" }}>
                      <label className="pengaturan-label" style={{ marginBottom: "12px" }}>Daftar Bundling</label>
                      {(pengaturanForm.bundling || []).map((item, index) => (
                        <div key={index} style={{ marginBottom: "12px", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                          <div className="pengaturan-form-group" style={{ marginBottom: "8px" }}>
                            <label className="pengaturan-label" style={{ fontSize: "14px" }}>Nama Bundling</label>
                            <InputText
                              className="pengaturan-input"
                              value={item.nama || ""}
                              onChange={(e) => {
                                const newBundling = [...(pengaturanForm.bundling || [])];
                                newBundling[index] = { ...newBundling[index], nama: e.target.value };
                                handlePengaturanChange("bundling", newBundling);
                              }}
                              placeholder="Masukkan nama bundling"
                            />
                          </div>
                          <div className="pengaturan-form-group">
                            <label className="pengaturan-label" style={{ fontSize: "14px" }}>Harga</label>
                            <InputNumber
                              className="pengaturan-input"
                              value={item.harga || null}
                              onValueChange={(e) => {
                                const newBundling = [...(pengaturanForm.bundling || [])];
                                newBundling[index] = { ...newBundling[index], harga: e.value };
                                handlePengaturanChange("bundling", newBundling);
                              }}
                              placeholder="Masukkan harga bundling"
                              mode="currency"
                              currency="IDR"
                              locale="id-ID"
                              useGrouping={true}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newBundling = (pengaturanForm.bundling || []).filter((_, i) => i !== index);
                              handlePengaturanChange("bundling", newBundling);
                            }}
                            style={{
                              marginTop: "8px",
                              padding: "6px 12px",
                              backgroundColor: "#ef4444",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newBundling = [...(pengaturanForm.bundling || []), { nama: "", harga: null }];
                          handlePengaturanChange("bundling", newBundling);
                        }}
                        style={{
                          padding: "10px 16px",
                          backgroundColor: "#F1A124",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500"
                        }}
                      >
                        + Tambah Bundling
                      </button>
                    </div>
                  )}

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

                {/* Divider untuk memisahkan settingan produk dengan settingan landing page */}
                <div style={{
                  margin: "32px 0",
                  borderTop: "2px solid #e5e7eb",
                  paddingTop: "24px"
                }}>
                  <div style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "16px"
                  }}>
                    Pengaturan Landing Page
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
              
              {/* Preview komponen - hanya render blocks tanpa parentId (bukan child dari section) */}
              {blocks
                .filter(block => !block.parentId) // Hanya render blocks yang bukan child dari section
                .map((block) => (
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

