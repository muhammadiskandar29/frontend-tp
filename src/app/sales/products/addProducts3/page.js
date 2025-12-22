"use client";

import { useState } from "react";
import { 
  Type, Image as ImageIcon, FileText, List, MessageSquare, 
  HelpCircle, Image as SliderIcon, Square, Youtube, Link as LinkIcon,
  MapPin, Film, Minus, Code, X, Save, Rocket, ChevronsLeft, Eye, EyeOff
} from "lucide-react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
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
  const [activeTab, setActiveTab] = useState("konten");
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [blocks, setBlocks] = useState([]);

  // Handler untuk menambah komponen baru
  const handleAddComponent = (componentId) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type: componentId,
      data: {},
      order: blocks.length + 1,
    };
    
    setBlocks([...blocks, newBlock]);
    setShowComponentModal(false);
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
      {/* Header dengan tabs */}
      <div className="page-builder-header">
        <div className="header-left">
          <div className="header-tabs">
            <button
              className={`header-tab ${activeTab === "konten" ? "active" : ""}`}
              onClick={() => setActiveTab("konten")}
            >
              Konten
            </button>
            <button
              className={`header-tab ${activeTab === "desain" ? "active" : ""}`}
              onClick={() => setActiveTab("desain")}
            >
              Desain
            </button>
            <button
              className={`header-tab ${activeTab === "pengaturan" ? "active" : ""}`}
              onClick={() => setActiveTab("pengaturan")}
            >
              Pengaturan
            </button>
          </div>
        </div>
        
        <div className="header-right">
          <button
            className="header-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title="Collapse sidebar"
          >
            <ChevronsLeft size={18} />
          </button>
          
          <div className="header-status">
            <span className="editing-badge">
              Only you are editing this page
            </span>
            <div className="header-icons">
              <div className="header-icon-item">
                <Eye size={16} />
                <span className="icon-count">0</span>
              </div>
              <div className="header-icon-item">
                <EyeOff size={16} />
                <span className="icon-count">0</span>
              </div>
              <div className="header-icon-item">
                <Eye size={16} />
                <span className="icon-count">0</span>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <Button
              label="Simpan"
              icon={<Save size={16} />}
              className="p-button-text p-button-secondary save-btn"
              onClick={() => {}}
            />
            <Button
              label="Simpan & Terbitkan"
              icon={<Rocket size={16} />}
              className="p-button-primary publish-btn"
              onClick={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="page-builder-main">
        {/* Left Sidebar */}
        {!sidebarCollapsed && (
          <div className="page-builder-sidebar">
            <button
              className="add-component-btn"
              onClick={() => setShowComponentModal(true)}
            >
              <span className="add-component-icon">+</span>
              <span className="add-component-text">Tambah Komponen Baru</span>
            </button>
          </div>
        )}

        {/* Main Canvas Area */}
        <div className="page-builder-canvas">
          <div className="canvas-grid">
            {/* Grid dengan 3 kolom - garis vertikal */}
            <div className="canvas-column">
              {/* Komponen akan ditambahkan di sini */}
            </div>
            <div className="canvas-column-divider"></div>
            <div className="canvas-column">
              {/* Komponen akan ditambahkan di sini */}
            </div>
            <div className="canvas-column-divider"></div>
            <div className="canvas-column">
              {/* Komponen akan ditambahkan di sini */}
            </div>
          </div>
          
          {/* Placeholder jika belum ada komponen */}
          {blocks.length === 0 && (
            <div className="canvas-empty">
              <p>Klik "Tambah Komponen Baru" untuk memulai</p>
            </div>
          )}
        </div>
      </div>

      {/* Component Selection Modal */}
      <Dialog
        visible={showComponentModal}
        onHide={() => setShowComponentModal(false)}
        header="Pilih Komponen"
        className="component-selection-modal"
        style={{ width: "90vw", maxWidth: "800px" }}
        modal
        dismissableMask
        headerStyle={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb" }}
        contentStyle={{ padding: "24px", maxHeight: "70vh", overflowY: "auto" }}
        footer={
          <div style={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end" }}>
            <Button
              label="Cancel"
              className="p-button-text p-button-secondary"
              onClick={() => setShowComponentModal(false)}
            />
          </div>
        }
        closeOnEscape
        closable
      >
        {renderComponentGrid()}
      </Dialog>
    </div>
  );
}

