"use client";

import { useState, useEffect, useRef } from "react";
import { InputTextarea } from "primereact/inputtextarea";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { 
  Bold, Italic, Underline, Strikethrough, 
  Subscript, Superscript, Link, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Image as ImageIcon, Smile,
  ChevronDown as ChevronDownIcon
} from "lucide-react";
import ComponentWrapper from "./ComponentWrapper";

export default function TextComponent({ data = {}, onUpdate, onMoveUp, onMoveDown, onDelete, index }) {
  const content = data.content || "Text Baru";
  const darkEditor = data.darkEditor || false;
  const fontSize = data.fontSize || 16;
  const lineHeight = data.lineHeight || 1.5;
  const fontFamily = data.fontFamily || "Page Font";
  const textColor = data.textColor || "#000000";
  const backgroundColor = data.backgroundColor || "transparent";
  const textAlign = data.textAlign || "left";
  const fontWeight = data.fontWeight || "normal";
  const fontStyle = data.fontStyle || "normal";
  const textDecoration = data.textDecoration || "none";
  const textTransform = data.textTransform || "none";
  const letterSpacing = data.letterSpacing || 0;
  const [showAdvance, setShowAdvance] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const colorPickerRef = useRef(null);
  const bgColorPickerRef = useRef(null);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false);
      }
      if (bgColorPickerRef.current && !bgColorPickerRef.current.contains(event.target)) {
        setShowBgColorPicker(false);
      }
    };

    if (showColorPicker || showBgColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorPicker, showBgColorPicker]);

  const handleChange = (field, value) => {
    onUpdate?.({ ...data, [field]: value });
  };

  const toggleFormat = (field, value) => {
    const currentValue = data[field];
    if (field === "fontWeight") {
      handleChange(field, currentValue === "bold" ? "normal" : "bold");
    } else if (field === "fontStyle") {
      handleChange(field, currentValue === "italic" ? "normal" : "italic");
    } else if (field === "textDecoration") {
      if (value === "line-through") {
        handleChange(field, currentValue === "line-through" ? "none" : "line-through");
      } else if (value === "underline") {
        handleChange(field, currentValue === "underline" ? "none" : "underline");
      }
    } else {
      handleChange(field, value);
    }
  };

  const paragraphStyles = [
    { label: "Normal", value: "normal" },
    { label: "Heading 1", value: "h1" },
    { label: "Heading 2", value: "h2" },
    { label: "Heading 3", value: "h3" },
  ];

  const fontFamilyOptions = [
    { label: "Page Font", value: "Page Font" },
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
    { label: "Times New Roman", value: "'Times New Roman', serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Verdana", value: "Verdana, sans-serif" },
    { label: "Courier New", value: "'Courier New', monospace" },
    { label: "Roboto", value: "'Roboto', sans-serif" },
    { label: "Open Sans", value: "'Open Sans', sans-serif" },
    { label: "Lato", value: "'Lato', sans-serif" },
    { label: "Montserrat", value: "'Montserrat', sans-serif" },
    { label: "Poppins", value: "'Poppins', sans-serif" },
  ];

  const textAlignOptions = [
    { label: "Kiri", value: "left", icon: AlignLeft },
    { label: "Tengah", value: "center", icon: AlignCenter },
    { label: "Kanan", value: "right", icon: AlignRight },
    { label: "Rata Kiri-Kanan", value: "justify", icon: AlignJustify },
  ];

  return (
    <ComponentWrapper
      title="Text"
      index={index}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onDelete={onDelete}
    >
      {/* Toggle Dark Editor */}
      <div className="text-editor-toggle">
        <span>Background Editor Gelap</span>
        <InputSwitch
          checked={darkEditor}
          onChange={(e) => handleChange("darkEditor", e.value)}
        />
      </div>

      {/* Formatting Toolbar */}
      <div className="text-editor-toolbar">
        {/* Top Row - Formatting Buttons */}
        <div className="toolbar-row">
          <button 
            className={`toolbar-btn ${fontWeight === "bold" ? "active" : ""}`}
            title="Bold"
            onClick={() => toggleFormat("fontWeight", "bold")}
          >
            <Bold size={16} />
          </button>
          <button 
            className={`toolbar-btn ${fontStyle === "italic" ? "active" : ""}`}
            title="Italic"
            onClick={() => toggleFormat("fontStyle", "italic")}
          >
            <Italic size={16} />
          </button>
          <div className="toolbar-color-picker-wrapper" ref={colorPickerRef}>
            <button 
              className={`toolbar-btn ${showColorPicker ? "active" : ""}`}
              title="Text Color"
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              <span style={{ 
                textDecoration: 'underline',
                color: textColor
              }}>A</span>
              <ChevronDownIcon size={12} />
            </button>
            {showColorPicker && (
              <div className="toolbar-color-picker-popup">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => {
                    handleChange("textColor", e.target.value);
                    setShowColorPicker(false);
                  }}
                  style={{ width: "100%", height: "40px", cursor: "pointer" }}
                />
              </div>
            )}
          </div>
          <button 
            className={`toolbar-btn ${textDecoration === "line-through" ? "active" : ""}`}
            title="Strikethrough"
            onClick={() => toggleFormat("textDecoration", "line-through")}
          >
            <Strikethrough size={16} />
          </button>
          <button 
            className={`toolbar-btn ${textDecoration === "underline" ? "active" : ""}`}
            title="Underline"
            onClick={() => toggleFormat("textDecoration", "underline")}
          >
            <Underline size={16} />
          </button>
          <button 
            className="toolbar-btn"
            title="Superscript"
            onClick={() => handleChange("textTransform", data.textTransform === "uppercase" ? "none" : "uppercase")}
          >
            <Superscript size={16} />
          </button>
          <button 
            className="toolbar-btn"
            title="Subscript"
            onClick={() => handleChange("textTransform", data.textTransform === "lowercase" ? "none" : "lowercase")}
          >
            <Subscript size={16} />
          </button>
        </div>

        {/* Middle Row - Paragraph Style, Font Size, Text Align */}
        <div className="toolbar-row">
          <Dropdown
            value={data.paragraphStyle || "normal"}
            options={paragraphStyles}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => handleChange("paragraphStyle", e.value)}
            className="toolbar-dropdown"
            placeholder="Normal"
          />
          <div className="toolbar-input-group">
            <InputNumber
              value={fontSize}
              onValueChange={(e) => handleChange("fontSize", e.value || 16)}
              min={8}
              max={200}
              suffix="px"
              className="toolbar-input"
              placeholder="16"
            />
          </div>
          <div className="toolbar-align-group">
            {textAlignOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.value}
                  className={`toolbar-btn ${textAlign === option.value ? "active" : ""}`}
                  title={option.label}
                  onClick={() => handleChange("textAlign", option.value)}
                >
                  <IconComponent size={16} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Row - Font Family, Line Height, Background Color */}
        <div className="toolbar-row">
          <Dropdown
            value={fontFamily}
            options={fontFamilyOptions}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => handleChange("fontFamily", e.value)}
            className="toolbar-dropdown"
            placeholder="Font Family"
          />
          <div className="toolbar-input-group">
            <InputNumber
              value={lineHeight}
              onValueChange={(e) => handleChange("lineHeight", e.value || 1.5)}
              min={0.5}
              max={3}
              step={0.1}
              className="toolbar-input"
              placeholder="1.5"
            />
          </div>
          <div className="toolbar-color-picker-wrapper" ref={bgColorPickerRef}>
            <button 
              className={`toolbar-btn ${showBgColorPicker ? "active" : ""}`}
              title="Background Color"
              onClick={() => setShowBgColorPicker(!showBgColorPicker)}
            >
              <span style={{ 
                backgroundColor: backgroundColor === "transparent" ? "#f0f0f0" : backgroundColor,
                padding: "2px 6px",
                borderRadius: "2px"
              }}>Bg</span>
            </button>
            {showBgColorPicker && (
              <div className="toolbar-color-picker-popup">
                <input
                  type="color"
                  value={backgroundColor === "transparent" ? "#ffffff" : backgroundColor}
                  onChange={(e) => {
                    handleChange("backgroundColor", e.target.value);
                    setShowBgColorPicker(false);
                  }}
                  style={{ width: "100%", height: "40px", cursor: "pointer", marginBottom: "8px" }}
                />
                <button 
                  className="toolbar-transparent-btn"
                  onClick={() => {
                    handleChange("backgroundColor", "transparent");
                    setShowBgColorPicker(false);
                  }}
                >
                  Transparent
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Text Editor Area */}
      <div className={`text-editor-area ${darkEditor ? 'dark' : ''}`}>
        <InputTextarea
          value={content}
          onChange={(e) => handleChange("content", e.target.value)}
          placeholder="Masukkan teks..."
          rows={8}
          className="w-full text-editor-textarea"
        />
      </div>

      {/* Advance Section */}
      <div className="component-advance-section">
        <button 
          className="component-advance-toggle"
          onClick={() => setShowAdvance(!showAdvance)}
        >
          <span>Advance</span>
          <ChevronDownIcon 
            size={16} 
            className={showAdvance ? "rotate-180" : ""}
          />
        </button>
        
        {showAdvance && (
          <div className="component-advance-content">
            <div className="form-field-group">
              <label className="form-label-small">Letter Spacing</label>
              <InputNumber
                value={letterSpacing}
                onValueChange={(e) => handleChange("letterSpacing", e.value || 0)}
                min={-2}
                max={10}
                step={0.1}
                suffix="px"
                className="w-full form-input"
              />
            </div>
            
            <div className="form-field-group">
              <label className="form-label-small">Text Transform</label>
              <Dropdown
                value={textTransform}
                options={[
                  { label: "None", value: "none" },
                  { label: "Uppercase", value: "uppercase" },
                  { label: "Lowercase", value: "lowercase" },
                  { label: "Capitalize", value: "capitalize" },
                ]}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => handleChange("textTransform", e.value)}
                className="w-full form-input"
                placeholder="Text Transform"
              />
            </div>

            <div className="form-field-group">
              <label className="form-label-small">Font Weight</label>
              <Dropdown
                value={fontWeight}
                options={[
                  { label: "Normal", value: "normal" },
                  { label: "Bold", value: "bold" },
                  { label: "100", value: "100" },
                  { label: "200", value: "200" },
                  { label: "300", value: "300" },
                  { label: "400", value: "400" },
                  { label: "500", value: "500" },
                  { label: "600", value: "600" },
                  { label: "700", value: "700" },
                  { label: "800", value: "800" },
                  { label: "900", value: "900" },
                ]}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => handleChange("fontWeight", e.value)}
                className="w-full form-input"
                placeholder="Font Weight"
              />
            </div>
          </div>
        )}
      </div>
    </ComponentWrapper>
  );
}

