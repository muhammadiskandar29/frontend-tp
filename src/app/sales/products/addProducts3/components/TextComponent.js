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
  const savedSelectionRef = useRef(null);

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
      // Clean up zero-width space markers that might be left
      const zeroWidthSpans = editorRef.current.querySelectorAll('span[data-font-size]');
      zeroWidthSpans.forEach(span => {
        if (span.textContent.trim() === '' || span.textContent === '\u200B') {
          // If span is empty or only has zero-width space, remove it but preserve font size
          const fontSize = span.getAttribute('data-font-size');
          if (fontSize && span.parentNode) {
            // Apply font size to parent or create new span for next character
            const parent = span.parentNode;
            if (parent !== editorRef.current) {
              parent.style.fontSize = `${fontSize}px`;
            }
            span.remove();
          }
        }
      });
      
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
      
      if (!editorRef.current) return;
      
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) return;
      
      // Save current cursor position
      const cursorPosition = {
        container: range.startContainer,
        offset: range.startOffset
      };
      
      // Create a new paragraph without any formatting
      const p = document.createElement("p");
      p.innerHTML = "<br>";
      
      try {
        // If there's selected text, delete it first
        if (!range.collapsed) {
          range.deleteContents();
        }
        
        // Insert new paragraph at cursor position
        range.insertNode(p);
        
        // Move cursor to the new paragraph (at the beginning)
        const newRange = document.createRange();
        newRange.setStart(p, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        // Focus editor to maintain cursor
        editorRef.current.focus();
      } catch (err) {
        // Fallback: use default behavior but preserve cursor
        try {
          document.execCommand("insertParagraph", false, null);
          // Try to restore cursor position
          setTimeout(() => {
            const newSelection = window.getSelection();
            if (newSelection.rangeCount > 0) {
              const newRange = newSelection.getRangeAt(0);
              // Cursor should be in the new paragraph
            }
          }, 10);
        } catch (e2) {
          console.error("Error inserting paragraph:", e2);
        }
      }
      
      handleEditorInput();
    }
  };

  // Save and restore selection
  const saveSelection = () => {
    if (!editorRef.current) return null;
    
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return null;
    
    // Save selection details (not just the range, as nodes might change)
    try {
      const clonedRange = range.cloneRange();
      savedSelectionRef.current = {
        range: clonedRange,
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset,
        collapsed: range.collapsed,
        text: range.toString()
      };
      
      return clonedRange;
    } catch (e) {
      console.error("Error saving selection:", e);
      return null;
    }
  };

  const restoreSelection = () => {
    if (!editorRef.current || !savedSelectionRef.current) return false;
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    
    try {
      const saved = savedSelectionRef.current;
      
      // If saved is a Range object (old format), try to use it directly
      if (saved instanceof Range || (saved.range && saved.range instanceof Range)) {
        try {
          const rangeToUse = saved instanceof Range ? saved : saved.range;
          selection.addRange(rangeToUse);
          return true;
        } catch (e) {
          // Range is invalid, continue to try other methods
        }
      }
      
      // Try to recreate from saved container positions
      if (saved.startContainer && saved.endContainer) {
        try {
          const range = document.createRange();
          range.setStart(saved.startContainer, saved.startOffset);
          range.setEnd(saved.endContainer, saved.endOffset);
          selection.addRange(range);
          return true;
        } catch (e) {
          // Nodes are no longer valid, try to find by text content
          if (saved.text && saved.text.trim() !== "") {
            return restoreSelectionByText(saved.text);
          }
        }
      }
    } catch (e) {
      console.error("Error restoring selection:", e);
    }
    
    return false;
  };

  // Helper to restore selection by finding text content
  const restoreSelectionByText = (textToFind) => {
    if (!editorRef.current || !textToFind) return false;
    
    const walker = document.createTreeWalker(
      editorRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node;
    while (node = walker.nextNode()) {
      const nodeText = node.textContent;
      const index = nodeText.indexOf(textToFind);
      if (index !== -1) {
        try {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + textToFind.length);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          return true;
        } catch (e) {
          console.error("Error restoring selection by text:", e);
        }
      }
    }
    
    return false;
  };

  // Format selection handlers with preserved selection
  const formatSelection = (command, value = null) => {
    if (!editorRef.current) return;
    
    // Save selection before formatting
    const savedRange = saveSelection();
    
    // Focus editor first
    editorRef.current.focus();
    
    if (savedRange) {
      // Restore selection
      const selection = window.getSelection();
      selection.removeAllRanges();
      try {
        selection.addRange(savedRange);
      } catch (e) {
        // If range is invalid, try to restore from saved positions
        try {
          const range = document.createRange();
          range.setStart(savedRange.startContainer, savedRange.startOffset);
          range.setEnd(savedRange.endContainer, savedRange.endOffset);
          selection.addRange(range);
        } catch (e2) {
          // If still fails, just continue without selection
        }
      }
    }
    
    // Apply command
    document.execCommand(command, false, value);
    
    // Restore selection after command (if it was saved)
    if (savedRange) {
      setTimeout(() => {
        restoreSelection();
        handleEditorInput();
        setTimeout(detectStyles, 10);
      }, 10);
    } else {
      handleEditorInput();
      setTimeout(detectStyles, 10);
    }
  };

  const applyTextColor = (color) => {
    if (!editorRef.current) return;
    
    const savedRange = saveSelection();
    if (!savedRange) {
      editorRef.current.focus();
      return;
    }
    
    editorRef.current.focus();
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
    
    document.execCommand("foreColor", false, color);
    
    setTimeout(() => {
      restoreSelection();
      setSelectedColor(color);
      setCurrentTextColor(color);
      setShowColorPicker(false);
      handleEditorInput();
      setTimeout(detectStyles, 10);
    }, 10);
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
    if (!editorRef.current || !size) return;
    
    // Focus editor first
    editorRef.current.focus();
    
    const selection = window.getSelection();
    let rangeToUse = null;
    
    // First, try to restore saved selection
    if (savedSelectionRef.current) {
      const restored = restoreSelection();
      if (restored && selection.rangeCount > 0) {
        rangeToUse = selection.getRangeAt(0);
      }
    }
    
    // If restoration failed, try current selection
    if (!rangeToUse && selection.rangeCount > 0) {
      const currentRange = selection.getRangeAt(0);
      if (editorRef.current.contains(currentRange.commonAncestorContainer) && !currentRange.collapsed) {
        rangeToUse = currentRange;
      }
    }
    
    // If still no range, return (user needs to select text first)
    if (!rangeToUse) {
      console.log("No selection available for font size");
      return;
    }
    
    // Get the range to use
    const range = rangeToUse;
    
    // Create span with font size
    const span = document.createElement("span");
    span.style.fontSize = `${size}px`;
    
    if (range.collapsed) {
      // Cursor position - insert marker for next typing
      span.innerHTML = "\u200B";
      try {
        range.insertNode(span);
        const newRange = document.createRange();
        newRange.setStartAfter(span);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (e) {
        console.error("Error inserting font size at cursor:", e);
      }
    } else {
      // Has selection - wrap it
      const selectedText = range.toString();
      if (!selectedText || selectedText.trim() === "") {
        // Empty selection, just return
        return;
      }
      
      try {
        // Try surroundContents first (works for simple selections)
        range.surroundContents(span);
        
        // Restore selection to the wrapped span
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        // Update saved selection to the new wrapped span
        const savedRange = {
          range: newRange.cloneRange(),
          startContainer: newRange.startContainer,
          startOffset: newRange.startOffset,
          endContainer: newRange.endContainer,
          endOffset: newRange.endOffset,
          collapsed: newRange.collapsed,
          text: newRange.toString()
        };
        savedSelectionRef.current = savedRange;
      } catch (e) {
        // surroundContents failed - use extractContents (for complex selections)
        try {
          const contents = range.extractContents();
          
          // Clear any existing font-size spans in contents
          const existingSpans = contents.querySelectorAll('span[style*="font-size"]');
          existingSpans.forEach(existingSpan => {
            const parent = existingSpan.parentNode;
            while (existingSpan.firstChild) {
              parent.insertBefore(existingSpan.firstChild, existingSpan);
            }
            parent.removeChild(existingSpan);
          });
          
          span.appendChild(contents);
          range.insertNode(span);
          
          // Restore selection to the wrapped span
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          // Update saved selection
          const savedRange = {
            range: newRange.cloneRange(),
            startContainer: newRange.startContainer,
            startOffset: newRange.startOffset,
            endContainer: newRange.endContainer,
            endOffset: newRange.endOffset,
            collapsed: newRange.collapsed,
            text: newRange.toString()
          };
          savedSelectionRef.current = savedRange;
        } catch (e2) {
          console.error("Error applying font size to selection:", e2);
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

  // Update styles display when selection changes and save selection automatically
  useEffect(() => {
    const handleSelectionChange = () => {
      // Auto-save selection when user selects text in editor
      if (editorRef.current) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (editorRef.current.contains(range.commonAncestorContainer) && !range.collapsed) {
            // User has selected text - save it automatically
            saveSelection();
          }
        }
      }
      detectStyles();
    };

    const handleMouseUp = (e) => {
      // Also save selection on mouseup in editor
      if (editorRef.current && editorRef.current.contains(e.target)) {
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (!range.collapsed) {
              saveSelection();
            }
          }
        }, 10);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Formatting functions - only apply to selection, don't change global state
  const toggleBold = (e) => {
    if (e) e.preventDefault();
    formatSelection("bold");
  };

  const toggleItalic = (e) => {
    if (e) e.preventDefault();
    formatSelection("italic");
  };

  const toggleUnderline = (e) => {
    if (e) e.preventDefault();
    formatSelection("underline");
  };

  const toggleStrikethrough = (e) => {
    if (e) e.preventDefault();
    formatSelection("strikeThrough");
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
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent losing focus
              saveSelection();
            }}
            onClick={toggleBold}
          >
            <Bold size={16} />
          </button>
          <button 
            className={`toolbar-btn ${currentItalic ? "active" : ""}`}
            title="Italic"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
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
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={toggleStrikethrough}
          >
            <Strikethrough size={16} />
          </button>
          <button 
            className={`toolbar-btn ${currentUnderline ? "active" : ""}`}
            title="Underline"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
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
              onMouseDown={(e) => {
                // Prevent default to keep selection
                e.preventDefault();
                // Save selection before input gets focus
                saveSelection();
                // Then allow input to get focus
                setTimeout(() => {
                  e.target.focus();
                }, 0);
              }}
              onFocus={(e) => {
                // Save selection when input gets focus (e.g., via Tab)
                saveSelection();
              }}
              onBlur={() => {
                // Don't clear selection on blur - keep it for next time
              }}
              onValueChange={(e) => {
                const size = e.value || 16;
                setSelectedFontSize(size);
                // Apply font size immediately - will use saved selection
                setTimeout(() => {
                  applyFontSize(size);
                }, 10);
              }}
              min={8}
              max={200}
              suffix="px"
              className="toolbar-input"
              placeholder="16"
              title="Font Size (Ukuran Font) - Pilih teks terlebih dahulu, lalu ubah ukuran"
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
          onMouseUp={(e) => {
            // Don't clear saved selection immediately - let user finish selecting
            detectStyles();
          }}
          onKeyUp={detectStyles}
          onClick={(e) => {
            // Only clear saved selection if user clicks and there's no current selection
            setTimeout(() => {
              const selection = window.getSelection();
              if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
                // User clicked but didn't select anything - clear saved selection
                savedSelectionRef.current = null;
              }
            }, 100);
          }}
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

