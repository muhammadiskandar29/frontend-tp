"use client";

import { useState, useEffect, useRef } from "react";
import { InputTextarea } from "primereact/inputtextarea";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { 
  Bold, Italic, Underline, Strikethrough, 
  Subscript, Superscript, Link, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Image as ImageIcon, Smile,
  ChevronDown as ChevronDownIcon, ChevronUp,
  X, Monitor, Tablet, Smartphone
} from "lucide-react";
import ComponentWrapper from "./ComponentWrapper";

export default function TextComponent({ data = {}, onUpdate, onMoveUp, onMoveDown, onDelete, index }) {
  const content = data.content || "<p>Text Baru</p>";
  const darkEditor = data.darkEditor || false;
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
  
  // Advance settings
  const paddingTop = data.paddingTop || 0;
  const paddingRight = data.paddingRight || 0;
  const paddingBottom = data.paddingBottom || 0;
  const paddingLeft = data.paddingLeft || 0;
  const bgType = data.bgType || "none"; // none, color, image
  const bgColor = data.bgColor || "#ffffff";
  const bgImage = data.bgImage || "";
  const deviceView = data.deviceView || "desktop";
  const componentId = data.componentId || `text-${Date.now()}`;
  
  const [showAdvance, setShowAdvance] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showMoreColors, setShowMoreColors] = useState(false);
  const [showMoreBgColors, setShowMoreBgColors] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedBgColor, setSelectedBgColor] = useState("#FFFF00");
  const [selectedFontSize, setSelectedFontSize] = useState(16);
  
  // Current style from selection/cursor position
  const [currentBold, setCurrentBold] = useState(false);
  const [currentItalic, setCurrentItalic] = useState(false);
  const [currentUnderline, setCurrentUnderline] = useState(false);
  const [currentStrikethrough, setCurrentStrikethrough] = useState(false);
  const [currentTextColor, setCurrentTextColor] = useState("#000000");
  const [currentBgColor, setCurrentBgColor] = useState("transparent");
  
  const colorPickerRef = useRef(null);
  const bgColorPickerRef = useRef(null);
  const editorRef = useRef(null);

  // Preset colors seperti MS Word - Primary color #FF9900 (rgb(255, 153, 0))
  const presetColors = [
    "#FF9900", // Primary color - rgb(255, 153, 0)
    "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF",
    "#800000", "#008000", "#000080", "#808000", "#800080", "#008080", "#C0C0C0", "#808080",
    "#FF9999", "#99FF99", "#9999FF", "#FFFF99", "#FF99FF", "#99FFFF", "#FFCC99", "#CC99FF"
  ];

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false);
        setShowMoreColors(false);
      }
      if (bgColorPickerRef.current && !bgColorPickerRef.current.contains(event.target)) {
        setShowBgColorPicker(false);
        setShowMoreBgColors(false);
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

  // Rich text editor handlers
  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      handleChange("content", html);
      // Detect styles after input
      setTimeout(detectStyles, 10);
    }
  };

  const handleEditorKeyDown = (e) => {
    // Allow Enter to create new paragraph without inheriting styles
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Create a new paragraph without any formatting
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const p = document.createElement("p");
        p.innerHTML = "<br>";
        try {
          range.deleteContents();
          range.insertNode(p);
          // Move cursor to the new paragraph
          range.setStart(p, 0);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (err) {
          // Fallback to default behavior
          document.execCommand("insertParagraph", false, null);
        }
      }
      handleEditorInput();
    }
  };

  // Format selection handlers
  const formatSelection = (command, value = null) => {
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const applyTextColor = (color) => {
    formatSelection("foreColor", color);
    setSelectedColor(color);
    setCurrentTextColor(color);
    setShowColorPicker(false);
    setTimeout(detectStyles, 10);
  };

  const applyBgColor = (color) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;
    
    if (color === "transparent") {
      // Remove background color by removing highlight spans
      if (range.collapsed) {
        // For cursor position, we can't remove background
        return;
      } else {
        // For selection, wrap in span and set transparent
        const span = document.createElement("span");
        span.style.backgroundColor = "transparent";
        try {
          range.surroundContents(span);
        } catch (e) {
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
        }
      }
    } else {
      // Apply background color using backColor command
      document.execCommand("backColor", false, color);
    }
    
    setSelectedBgColor(color);
    setCurrentBgColor(color);
    setShowBgColorPicker(false);
    handleEditorInput();
    setTimeout(detectStyles, 10);
  };

  // Apply font size to selection
  const applyFontSize = (size) => {
    if (!editorRef.current) return;
    
    // Focus editor first
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    // Check if selection is within editor
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      return;
    }
    
    // Create span with font size
    const span = document.createElement("span");
    span.style.fontSize = `${size}px`;
    
    if (range.collapsed) {
      // If no selection, insert a span at cursor position
      span.innerHTML = "&nbsp;";
      try {
        range.insertNode(span);
        // Move cursor after the span
        range.setStartAfter(span);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        console.error("Error inserting font size:", e);
      }
    } else {
      // If there's a selection, wrap it in a span
      try {
        // Try to surround contents first (works for simple selections)
        range.surroundContents(span);
      } catch (e) {
        // If surroundContents fails (e.g., selection spans multiple nodes),
        // extract contents and wrap
        try {
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
        } catch (e2) {
          console.error("Error applying font size:", e2);
          return;
        }
      }
    }
    
    handleEditorInput();
    setTimeout(detectStyles, 10);
  };

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current) {
      if (!content || content === "Text Baru") {
        editorRef.current.innerHTML = "<p></p>";
      } else {
        editorRef.current.innerHTML = content;
      }
      // Detect styles after content is loaded
      setTimeout(detectStyles, 100);
    }
  }, []);

  // Detect all styles from current selection/cursor
  const detectStyles = () => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    // Check if selection is within editor
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      return;
    }
    
    let node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }
    
    // Detect styles by walking up the DOM tree
    let detectedBold = false;
    let detectedItalic = false;
    let detectedUnderline = false;
    let detectedStrikethrough = false;
    let detectedFontSize = 16;
    let detectedTextColor = "#000000";
    let detectedBgColor = "transparent";
    
    while (node && node !== editorRef.current) {
      const computedStyle = window.getComputedStyle(node);
      
      // Detect bold
      if (computedStyle.fontWeight === "bold" || 
          computedStyle.fontWeight === "700" || 
          computedStyle.fontWeight === "600" ||
          node.tagName === "B" || node.tagName === "STRONG") {
        detectedBold = true;
      }
      
      // Detect italic
      if (computedStyle.fontStyle === "italic" || node.tagName === "I" || node.tagName === "EM") {
        detectedItalic = true;
      }
      
      // Detect underline
      if (computedStyle.textDecoration.includes("underline") || node.tagName === "U") {
        detectedUnderline = true;
      }
      
      // Detect strikethrough
      if (computedStyle.textDecoration.includes("line-through") || node.tagName === "S" || node.tagName === "STRIKE") {
        detectedStrikethrough = true;
      }
      
      // Detect font size
      if (node.style && node.style.fontSize) {
        const fontSize = parseInt(node.style.fontSize);
        if (!isNaN(fontSize)) {
          detectedFontSize = fontSize;
        }
      }
      
      // Detect text color
      if (node.style && node.style.color) {
        detectedTextColor = node.style.color;
      } else if (computedStyle.color && computedStyle.color !== "rgb(0, 0, 0)") {
        // Convert rgb to hex if needed
        const rgb = computedStyle.color.match(/\d+/g);
        if (rgb && rgb.length === 3) {
          detectedTextColor = "#" + rgb.map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          }).join("");
        }
      }
      
      // Detect background color
      if (node.style && node.style.backgroundColor && node.style.backgroundColor !== "transparent" && node.style.backgroundColor !== "rgba(0, 0, 0, 0)") {
        detectedBgColor = node.style.backgroundColor;
      } else if (computedStyle.backgroundColor && computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)" && computedStyle.backgroundColor !== "transparent") {
        const rgb = computedStyle.backgroundColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          detectedBgColor = "#" + rgb.slice(0, 3).map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          }).join("");
        }
      }
      
      node = node.parentElement;
    }
    
    // Update states
    setCurrentBold(detectedBold);
    setCurrentItalic(detectedItalic);
    setCurrentUnderline(detectedUnderline);
    setCurrentStrikethrough(detectedStrikethrough);
    setSelectedFontSize(detectedFontSize);
    setCurrentTextColor(detectedTextColor);
    setCurrentBgColor(detectedBgColor);
    setSelectedColor(detectedTextColor);
    if (detectedBgColor !== "transparent") {
      setSelectedBgColor(detectedBgColor);
    }
  };

  // Update styles display when selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      detectStyles();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  // Formatting functions - only apply to selection, don't change global state
  const toggleBold = () => {
    formatSelection("bold");
    setTimeout(detectStyles, 10); // Re-detect after formatting
  };

  const toggleItalic = () => {
    formatSelection("italic");
    setTimeout(detectStyles, 10);
  };

  const toggleUnderline = () => {
    formatSelection("underline");
    setTimeout(detectStyles, 10);
  };

  const toggleStrikethrough = () => {
    formatSelection("strikeThrough");
    setTimeout(detectStyles, 10);
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
            className={`toolbar-btn ${currentBold ? "active" : ""}`}
            title="Bold"
            onClick={toggleBold}
          >
            <Bold size={16} />
          </button>
          <button 
            className={`toolbar-btn ${currentItalic ? "active" : ""}`}
            title="Italic"
            onClick={toggleItalic}
          >
            <Italic size={16} />
          </button>
          {/* Text Color Button - Like Image */}
          <div className="toolbar-color-picker-wrapper word-style-color-picker" ref={colorPickerRef}>
            <button 
              className={`toolbar-btn-text-color ${showColorPicker ? "active" : ""}`}
              title="Font Color (Warna Font)"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowMoreColors(false);
              }}
            >
              <div className="text-color-button-content">
                <span className="text-color-letter">A</span>
                <div className="text-color-bar" style={{ backgroundColor: currentTextColor }}></div>
              </div>
              <ChevronDownIcon size={10} style={{ marginLeft: "4px" }} />
            </button>
            {showColorPicker && (
              <div className="word-color-picker-popup">
                <div className="word-color-picker-header">Font Color</div>
                <div className="word-color-preset-grid">
                  {presetColors.map((color, idx) => (
                    <button
                      key={idx}
                      className={`word-color-preset-item ${selectedColor === color ? "selected" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => applyTextColor(color)}
                      title={color}
                    />
                  ))}
                </div>
                <div className="word-color-picker-divider"></div>
                <button
                  className="word-color-more-btn"
                  onClick={() => {
                    setShowMoreColors(!showMoreColors);
                  }}
                >
                  More Colors...
                </button>
                {showMoreColors && (
                  <div className="word-color-more-panel">
                    <div className="word-color-more-label">Custom Color</div>
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => applyTextColor(e.target.value)}
                      style={{ width: "100%", height: "40px", cursor: "pointer", marginBottom: "8px" }}
                    />
                    <input
                      type="text"
                      value={selectedColor}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === "") {
                          applyTextColor(value || "#000000");
                        }
                      }}
                      placeholder="#000000"
                      className="word-color-hex-input"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <button 
            className={`toolbar-btn ${currentStrikethrough ? "active" : ""}`}
            title="Strikethrough"
            onClick={toggleStrikethrough}
          >
            <Strikethrough size={16} />
          </button>
          <button 
            className={`toolbar-btn ${currentUnderline ? "active" : ""}`}
            title="Underline"
            onClick={toggleUnderline}
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
              value={selectedFontSize}
              onValueChange={(e) => {
                const size = e.value || 16;
                setSelectedFontSize(size);
                applyFontSize(size);
              }}
              min={8}
              max={200}
              suffix="px"
              className="toolbar-input"
              placeholder="16"
              title="Font Size (Ukuran Font) - Pilih teks terlebih dahulu"
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
          {/* Text Background Color Button - Like Image */}
          <div className="toolbar-color-picker-wrapper word-style-color-picker" ref={bgColorPickerRef}>
            <button 
              className={`toolbar-btn-bg-color ${showBgColorPicker ? "active" : ""}`}
              title="Text Highlight Color (Background Warna Font)"
              onClick={() => {
                setShowBgColorPicker(!showBgColorPicker);
                setShowMoreBgColors(false);
              }}
            >
              <div className="bg-color-button-content">
                <span className="bg-color-letter">ab</span>
                <div 
                  className="bg-color-bar" 
                  style={{ 
                    backgroundColor: currentBgColor === "transparent" ? "#FFFF00" : currentBgColor
                  }}
                ></div>
              </div>
              <ChevronDownIcon size={10} style={{ marginLeft: "4px" }} />
            </button>
            {showBgColorPicker && (
              <div className="word-color-picker-popup">
                <div className="word-color-picker-header">Text Highlight Color</div>
                <div className="word-color-preset-grid">
                  <button
                    className={`word-color-preset-item ${currentBgColor === "transparent" ? "selected" : ""}`}
                    style={{ 
                      backgroundColor: "#f0f0f0",
                      border: "1px solid #ccc",
                      position: "relative"
                    }}
                    onClick={() => {
                      applyBgColor("transparent");
                    }}
                    title="No Color"
                  >
                    <span style={{ fontSize: "10px", color: "#999" }}>×</span>
                  </button>
                  {presetColors.map((color, idx) => (
                    <button
                      key={idx}
                      className={`word-color-preset-item ${selectedBgColor === color ? "selected" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => applyBgColor(color)}
                      title={color}
                    />
                  ))}
                </div>
                <div className="word-color-picker-divider"></div>
                <button
                  className="word-color-more-btn"
                  onClick={() => {
                    setShowMoreBgColors(!showMoreBgColors);
                  }}
                >
                  More Colors...
                </button>
                {showMoreBgColors && (
                  <div className="word-color-more-panel">
                    <div className="word-color-more-label">Custom Color</div>
                    <input
                      type="color"
                      value={selectedBgColor === "transparent" ? "#ffffff" : selectedBgColor}
                      onChange={(e) => applyBgColor(e.target.value)}
                      style={{ width: "100%", height: "40px", cursor: "pointer", marginBottom: "8px" }}
                    />
                    <input
                      type="text"
                      value={selectedBgColor === "transparent" ? "" : selectedBgColor}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          applyBgColor("transparent");
                        } else if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                          applyBgColor(value);
                        }
                      }}
                      placeholder="Transparent atau #hex"
                      className="word-color-hex-input"
                      style={{ marginBottom: "8px" }}
                    />
                    <button 
                      className="toolbar-transparent-btn"
                      onClick={() => applyBgColor("transparent")}
                    >
                      No Color
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rich Text Editor Area */}
      <div className={`text-editor-area ${darkEditor ? 'dark' : ''}`}>
        <div
          ref={editorRef}
          contentEditable
          onInput={handleEditorInput}
          onKeyDown={handleEditorKeyDown}
          onMouseUp={detectStyles}
          onKeyUp={detectStyles}
          className="rich-text-editor"
          style={{
            minHeight: "200px",
            padding: "12px 14px",
            lineHeight: lineHeight,
            fontFamily: fontFamily !== "Page Font" ? fontFamily : "inherit",
            color: textColor,
            textAlign: textAlign,
          }}
          data-placeholder="Masukkan teks... (Enter untuk paragraf baru)"
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
                  placeholder="text-area-87nnmcFZXQ"
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

