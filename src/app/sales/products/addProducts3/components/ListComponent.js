"use client";

import { useState, useEffect, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputSwitch } from "primereact/inputswitch";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { 
  Trash2, ChevronDown as ChevronDownIcon, ChevronUp,
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered,
  Monitor, Tablet, Smartphone,
  X, CheckCircle2, Circle, Minus, ArrowRight, ArrowRightCircle,
  ArrowLeft, ArrowLeftRight, ChevronRight, CheckSquare, ShieldCheck,
  Lock, Dot, Target, Link as LinkIcon, PlusCircle, MinusCircle,
  Check, Star, Heart, ThumbsUp, Award, Zap, Flame, Sparkles,
  ArrowUp, ArrowDown, ArrowUpCircle, ArrowDownCircle, PlayCircle,
  PauseCircle, StopCircle, Radio, Square, Hexagon, Triangle,
  AlertCircle, Info, HelpCircle, Ban, Shield, Key, Unlock
} from "lucide-react";
import ComponentWrapper from "./ComponentWrapper";

// Icon options - banyak icon seperti di gambar
const ICON_OPTIONS = [
  { name: "CheckCircle2", component: CheckCircle2 },
  { name: "Circle", component: Circle },
  { name: "Minus", component: Minus },
  { name: "ArrowRight", component: ArrowRight },
  { name: "ArrowRightCircle", component: ArrowRightCircle },
  { name: "ArrowLeft", component: ArrowLeft },
  { name: "ArrowLeftRight", component: ArrowLeftRight },
  { name: "ChevronRight", component: ChevronRight },
  { name: "CheckSquare", component: CheckSquare },
  { name: "ShieldCheck", component: ShieldCheck },
  { name: "Lock", component: Lock },
  { name: "Dot", component: Dot },
  { name: "Target", component: Target },
  { name: "Link", component: LinkIcon },
  { name: "PlusCircle", component: PlusCircle },
  { name: "MinusCircle", component: MinusCircle },
  { name: "Check", component: Check },
  { name: "X", component: X },
  { name: "Star", component: Star },
  { name: "Heart", component: Heart },
  { name: "ThumbsUp", component: ThumbsUp },
  { name: "Award", component: Award },
  { name: "Zap", component: Zap },
  { name: "Flame", component: Flame },
  { name: "Sparkles", component: Sparkles },
  { name: "ArrowUp", component: ArrowUp },
  { name: "ArrowDown", component: ArrowDown },
  { name: "ArrowUpCircle", component: ArrowUpCircle },
  { name: "ArrowDownCircle", component: ArrowDownCircle },
  { name: "PlayCircle", component: PlayCircle },
  { name: "PauseCircle", component: PauseCircle },
  { name: "StopCircle", component: StopCircle },
  { name: "Radio", component: Radio },
  { name: "Square", component: Square },
  { name: "Hexagon", component: Hexagon },
  { name: "Triangle", component: Triangle },
  { name: "AlertCircle", component: AlertCircle },
  { name: "Info", component: Info },
  { name: "HelpCircle", component: HelpCircle },
  { name: "Ban", component: Ban },
  { name: "Shield", component: Shield },
  { name: "Key", component: Key },
  { name: "Unlock", component: Unlock },
];

// Preset colors untuk icon
const PRESET_ICON_COLORS = [
  "#374151", // Dark grey
  "#10b981", // Green
  "#f59e0b", // Yellow
  "#ef4444", // Red
  "#3b82f6", // Blue
];

export default function ListComponent({ data = {}, onUpdate, onMoveUp, onMoveDown, onDelete, index }) {
  const items = data.items || [];
  const componentTitle = data.componentTitle || "";
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [showIconPicker, setShowIconPicker] = useState({});
  const [showAdvance, setShowAdvance] = useState(false);
  
  // Advance settings
  const paddingTop = data.paddingTop || 0;
  const paddingRight = data.paddingRight || 0;
  const paddingBottom = data.paddingBottom || 0;
  const paddingLeft = data.paddingLeft || 0;
  const bgType = data.bgType || "none";
  const bgColor = data.bgColor || "#ffffff";
  const bgImage = data.bgImage || "";
  const deviceView = data.deviceView || "desktop";
  const componentId = data.componentId || `list-${Date.now()}`;

  const handleChange = (field, value) => {
    onUpdate?.({ ...data, [field]: value });
  };

  const addItem = () => {
    const newItems = [...items, { 
      nama: "",
      content: "<p></p>",
      icon: "CheckCircle2",
      iconColor: "#10b981"
    }];
    onUpdate?.({ ...data, items: newItems });
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdate?.({ ...data, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate?.({ ...data, items: newItems });
  };

  const toggleItemExpand = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const toggleIconPicker = (index) => {
    setShowIconPicker(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Close icon picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.icon-picker-trigger') && !event.target.closest('.icon-picker-grid')) {
        setShowIconPicker({});
      }
    };

    if (Object.values(showIconPicker).some(v => v)) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showIconPicker]);

  // Rich text editor handlers untuk setiap item
  const handleEditorInput = (index) => {
    const editor = document.getElementById(`list-editor-${index}`);
    if (editor) {
      const html = editor.innerHTML;
      updateItem(index, "content", html);
    }
  };

  const formatSelection = (index, command, value = null) => {
    const editor = document.getElementById(`list-editor-${index}`);
    if (!editor) return;
    
    editor.focus();
    document.execCommand(command, false, value);
    handleEditorInput(index);
  };

  return (
    <ComponentWrapper
      title="Daftar / List Point"
      index={index}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onDelete={onDelete}
    >
      <div className="list-component-content">
        {/* Judul Komponen */}
        <div className="form-field-group">
          <label className="form-label-small">Judul Komponen</label>
          <InputText
            value={componentTitle || ""}
            onChange={(e) => handleChange("componentTitle", e.target.value)}
            placeholder="List"
            className="w-full form-input"
          />
        </div>

        {items.map((item, i) => {
          const isExpanded = expandedItems.has(i);
          const showPicker = showIconPicker[i] || false;
          const IconComponent = ICON_OPTIONS.find(opt => opt.name === item.icon)?.component || CheckCircle2;
          const iconColor = item.iconColor || "#10b981";
          
          return (
            <div key={i} className="list-item-editor-wrapper">
              {/* List Item Header */}
              <div 
                className="list-item-header"
                onClick={() => toggleItemExpand(i)}
              >
                <div className="list-item-header-left">
                  <ChevronDownIcon 
                    size={16} 
                    className={`list-item-chevron ${isExpanded ? "expanded" : ""}`}
                  />
                  <span className="list-item-label">Daftar {i + 1}</span>
                </div>
                <Button
                  icon={<Trash2 size={14} />}
                  severity="danger"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(i);
                  }}
                />
              </div>

              {/* List Item Content */}
              {isExpanded && (
                <div className="list-item-content">
                  {/* Item Label */}
                  <div className="form-field-group">
                    <label className="form-label-small">Item</label>
                    
                    {/* Rich Text Editor Toolbar */}
                    <div className="text-editor-toolbar">
                      <div className="toolbar-row">
                        <button 
                          className="toolbar-btn"
                          title="Bold"
                          onClick={() => formatSelection(i, "bold")}
                        >
                          <Bold size={16} />
                        </button>
                        <button 
                          className="toolbar-btn"
                          title="Italic"
                          onClick={() => formatSelection(i, "italic")}
                        >
                          <Italic size={16} />
                        </button>
                        <button 
                          className="toolbar-btn"
                          title="Underline"
                          onClick={() => formatSelection(i, "underline")}
                        >
                          <Underline size={16} />
                        </button>
                        <button 
                          className="toolbar-btn"
                          title="Strikethrough"
                          onClick={() => formatSelection(i, "strikeThrough")}
                        >
                          <Strikethrough size={16} />
                        </button>
                        <div className="toolbar-align-group">
                          <button
                            className="toolbar-btn"
                            title="Align Left"
                            onClick={() => formatSelection(i, "justifyLeft")}
                          >
                            <AlignLeft size={16} />
                          </button>
                          <button
                            className="toolbar-btn"
                            title="Align Center"
                            onClick={() => formatSelection(i, "justifyCenter")}
                          >
                            <AlignCenter size={16} />
                          </button>
                          <button
                            className="toolbar-btn"
                            title="Align Right"
                            onClick={() => formatSelection(i, "justifyRight")}
                          >
                            <AlignRight size={16} />
                          </button>
                          <button
                            className="toolbar-btn"
                            title="Justify"
                            onClick={() => formatSelection(i, "justifyFull")}
                          >
                            <AlignJustify size={16} />
                          </button>
                        </div>
                        <button 
                          className="toolbar-btn"
                          title="Bullet List"
                          onClick={() => formatSelection(i, "insertUnorderedList")}
                        >
                          <List size={16} />
                        </button>
                        <button 
                          className="toolbar-btn"
                          title="Numbered List"
                          onClick={() => formatSelection(i, "insertOrderedList")}
                        >
                          <ListOrdered size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Rich Text Editor Area */}
                    <div className="text-editor-area">
                      <div
                        id={`list-editor-${i}`}
                        contentEditable
                        onInput={() => handleEditorInput(i)}
                        className="rich-text-editor"
                        dir="ltr"
                        style={{
                          minHeight: "100px",
                          padding: "12px 14px",
                          direction: "ltr",
                          textAlign: "left",
                        }}
                        data-placeholder="Insert text here ..."
                        dangerouslySetInnerHTML={{ __html: item.content || "<p></p>" }}
                      />
                    </div>
                  </div>

                  {/* Icon Picker Section */}
                  <div className="form-field-group">
                    <label className="form-label-small">Pilih Icon</label>
                    
                    {/* Color Swatches */}
                    <div className="icon-color-swatches">
                      {PRESET_ICON_COLORS.map((color, idx) => (
                        <button
                          key={idx}
                          className={`icon-color-swatch ${iconColor === color ? "selected" : ""}`}
                          style={{ 
                            backgroundColor: color,
                            border: iconColor === color ? "2px solid #3b82f6" : "1px solid #e5e7eb"
                          }}
                          onClick={() => updateItem(i, "iconColor", color)}
                          title={color}
                        />
                      ))}
                    </div>

                    {/* Icon Picker Button */}
                    <button
                      className="icon-picker-trigger"
                      onClick={() => toggleIconPicker(i)}
                    >
                      <IconComponent size={20} style={{ color: iconColor }} />
                      <ChevronDownIcon size={14} />
                    </button>

                    {/* Icon Grid */}
                    {showPicker && (
                      <div className="icon-picker-grid">
                        {ICON_OPTIONS.map((iconOpt, idx) => {
                          const IconOptComponent = iconOpt.component;
                          return (
                            <button
                              key={idx}
                              className={`icon-picker-item ${item.icon === iconOpt.name ? "selected" : ""}`}
                              onClick={() => {
                                updateItem(i, "icon", iconOpt.name);
                                setShowIconPicker(prev => ({ ...prev, [i]: false }));
                              }}
                              title={iconOpt.name}
                            >
                              <IconOptComponent size={20} style={{ color: iconColor }} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <Button
          label="+ Tambah Daftar"
          icon="pi pi-plus"
          size="small"
          onClick={addItem}
          className="add-item-btn"
        />
      </div>

      {/* Advance Section */}
      <div className="component-advance-section">
        <button 
          className="component-advance-toggle"
          onClick={() => setShowAdvance(!showAdvance)}
        >
          <span>Advance</span>
          {showAdvance ? <ChevronUp size={16} /> : <ChevronDownIcon size={16} />}
        </button>
        
        {showAdvance && (
          <div className="component-advance-content">
            {/* Desain - Background */}
            <div className="advance-section-group">
              <div className="advance-section-label">Desain</div>
              <div className="advance-section-sublabel">Latar (Background)</div>
              <div className="advance-bg-type-buttons">
                <button
                  className={`advance-bg-type-btn ${bgType === "none" ? "active" : ""}`}
                  onClick={() => handleChange("bgType", "none")}
                  title="No Background"
                >
                  <X size={18} />
                </button>
                <button
                  className={`advance-bg-type-btn ${bgType === "color" ? "active" : ""}`}
                  onClick={() => handleChange("bgType", "color")}
                  title="Warna"
                >
                  Warna
                </button>
                <button
                  className={`advance-bg-type-btn ${bgType === "image" ? "active" : ""}`}
                  onClick={() => handleChange("bgType", "image")}
                  title="Gambar"
                >
                  Gambar
                </button>
              </div>
              
              {bgType === "color" && (
                <div className="form-field-group" style={{ marginTop: "12px" }}>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => handleChange("bgColor", e.target.value)}
                    className="advance-color-input"
                  />
                  <InputText
                    value={bgColor}
                    onChange={(e) => handleChange("bgColor", e.target.value)}
                    placeholder="#ffffff"
                    className="w-full form-input"
                    style={{ marginTop: "8px" }}
                  />
                </div>
              )}
              
              {bgType === "image" && (
                <div className="form-field-group" style={{ marginTop: "12px" }}>
                  <InputText
                    value={bgImage}
                    onChange={(e) => handleChange("bgImage", e.target.value)}
                    placeholder="URL gambar"
                    className="w-full form-input"
                  />
                </div>
              )}
            </div>

            {/* Device View */}
            <div className="advance-section-group">
              <div className="advance-device-view-buttons">
                <button
                  className={`advance-device-btn ${deviceView === "desktop" ? "active" : ""}`}
                  onClick={() => handleChange("deviceView", "desktop")}
                  title="Desktop"
                >
                  <Monitor size={16} />
                  <span>Desktop</span>
                </button>
                <button
                  className={`advance-device-btn ${deviceView === "tablet" ? "active" : ""}`}
                  onClick={() => handleChange("deviceView", "tablet")}
                  title="Tablet"
                >
                  <Tablet size={16} />
                  <span>Tablet</span>
                </button>
                <button
                  className={`advance-device-btn ${deviceView === "mobile" ? "active" : ""}`}
                  onClick={() => handleChange("deviceView", "mobile")}
                  title="Mobile"
                >
                  <Smartphone size={16} />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Padding Settings */}
            <div className="advance-section-group">
              <div className="advance-padding-grid">
                <div className="advance-padding-item">
                  <label className="advance-padding-label">Padding Atas</label>
                  <div className="advance-padding-input-wrapper">
                    <InputNumber
                      value={paddingTop}
                      onValueChange={(e) => handleChange("paddingTop", e.value || 0)}
                      min={0}
                      max={200}
                      className="advance-padding-input"
                    />
                    <span className="advance-padding-unit">px</span>
                  </div>
                </div>
                <div className="advance-padding-item">
                  <label className="advance-padding-label">Padding Kanan</label>
                  <div className="advance-padding-input-wrapper">
                    <InputNumber
                      value={paddingRight}
                      onValueChange={(e) => handleChange("paddingRight", e.value || 0)}
                      min={0}
                      max={200}
                      className="advance-padding-input"
                    />
                    <span className="advance-padding-unit">px</span>
                  </div>
                </div>
                <div className="advance-padding-item">
                  <label className="advance-padding-label">Padding Bawah</label>
                  <div className="advance-padding-input-wrapper">
                    <InputNumber
                      value={paddingBottom}
                      onValueChange={(e) => handleChange("paddingBottom", e.value || 0)}
                      min={0}
                      max={200}
                      className="advance-padding-input"
                    />
                    <span className="advance-padding-unit">px</span>
                  </div>
                </div>
                <div className="advance-padding-item">
                  <label className="advance-padding-label">Padding Kiri</label>
                  <div className="advance-padding-input-wrapper">
                    <InputNumber
                      value={paddingLeft}
                      onValueChange={(e) => handleChange("paddingLeft", e.value || 0)}
                      min={0}
                      max={200}
                      className="advance-padding-input"
                    />
                    <span className="advance-padding-unit">px</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Component ID */}
            <div className="advance-section-group">
              <div className="advance-section-label">Pengaturan Lainnya</div>
              <div className="form-field-group">
                <label className="form-label-small">
                  Component ID <span className="required">*</span>
                </label>
                <InputText
                  value={componentId}
                  onChange={(e) => handleChange("componentId", e.target.value)}
                  placeholder="list-area-87nnmcFZXQ"
                  className="w-full form-input"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ComponentWrapper>
  );
}
