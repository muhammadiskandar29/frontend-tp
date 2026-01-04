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

export default function TextComponent({ data = {}, onUpdate, onMoveUp, onMoveDown, onDelete, index, isExpanded, onToggleExpand }) {
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
  
  // ===== SINGLE SOURCE OF TRUTH: Active Style State (MS Word Style) =====
  // State ini TIDAK boleh fallback ke default kecuali user memang reset
  // State ini adalah "cursor style" - style yang akan digunakan untuk next typing
  const [activeFontSize, setActiveFontSize] = useState(16);
  const [activeFontFamily, setActiveFontFamily] = useState("Page Font");
  const [activeColor, setActiveColor] = useState("#000000");
  const [activeBgColor, setActiveBgColor] = useState("transparent");
  const [activeBold, setActiveBold] = useState(false);
  const [activeItalic, setActiveItalic] = useState(false);
  const [activeUnderline, setActiveUnderline] = useState(false);
  const [activeStrikethrough, setActiveStrikethrough] = useState(false);
  
  // UI State - untuk menampilkan style dari selection/cursor (read-only untuk UI)
  const [displayedFontSize, setDisplayedFontSize] = useState(16); // Hanya untuk display di input
  const [displayedColor, setDisplayedColor] = useState("#000000"); // Hanya untuk display di color picker
  const [displayedBgColor, setDisplayedBgColor] = useState("transparent");
  const [displayedBold, setDisplayedBold] = useState(false);
  const [displayedItalic, setDisplayedItalic] = useState(false);
  const [displayedUnderline, setDisplayedUnderline] = useState(false);
  const [displayedStrikethrough, setDisplayedStrikethrough] = useState(false);
  
  // Legacy state untuk backward compatibility (akan dihapus bertahap)
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedBgColor, setSelectedBgColor] = useState("#FFFF00");
  const [selectedFontSize, setSelectedFontSize] = useState(16);
  
  // Legacy current state untuk UI buttons (backward compatibility)
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
  
  // Ref untuk tracking apakah state aktif sudah di-initialize dari DOM
  const isActiveStateInitializedRef = useRef(false);

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
      // Don't clean up zero-width space markers - they are style markers for next typing
      // When user types, the zero-width space gets replaced with actual text automatically
      // The style marker will be used when user types next character
      
      const html = editorRef.current.innerHTML;
      handleChange("content", html);
      // Detect styles after input - immediate and force update for sync
      requestAnimationFrame(() => {
        detectStyles();
        // Force another detect to ensure button states are synced
        requestAnimationFrame(() => {
          detectStyles();
        });
      });
    }
  };

  // Apply last used styles to current cursor position if no style exists
  const applyLastUsedStylesToCursor = () => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;
    
    // Check if cursor position has any style
    let node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }
    
    // Check if current position has font size, color, or other styles
    const computedStyle = window.getComputedStyle(node);
    const hasFontSize = node.style && node.style.fontSize;
    const hasColor = node.style && node.style.color;
    const hasFontWeight = node.style && (node.style.fontWeight === "bold" || parseInt(node.style.fontWeight) >= 600);
    
    // If no style exists, apply last used styles
    if (!hasFontSize || !hasColor) {
      const lastStyles = lastUsedStylesRef.current;
      
      // Create span with last used styles
      const span = document.createElement("span");
      span.style.fontSize = `${lastStyles.fontSize}px`;
      span.style.color = lastStyles.color;
      span.style.fontWeight = lastStyles.fontWeight;
      span.style.fontStyle = lastStyles.fontStyle;
      span.style.textDecoration = lastStyles.textDecoration;
      // Set underline color to match text color if underline is active
      if (lastStyles.textDecoration === "underline" || lastStyles.textDecoration.includes("underline")) {
        span.style.setProperty("text-decoration-color", lastStyles.color, "important");
        span.style.setProperty("-webkit-text-decoration-color", lastStyles.color, "important");
      }
      if (lastStyles.backgroundColor !== "transparent") {
        span.style.backgroundColor = lastStyles.backgroundColor;
      }
      
      // If cursor is collapsed, insert span at cursor
      if (range.collapsed) {
        span.innerHTML = "\u200B"; // Zero-width space
        try {
          range.insertNode(span);
          const newRange = document.createRange();
          newRange.setStartAfter(span);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (e) {
          console.error("Error applying last used styles:", e);
        }
      }
    }
  };

  const handleEditorKeyDown = (e) => {
    // MS Word style: Apply last used styles when typing
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Regular character key - ensure cursor has correct style
      if (editorRef.current) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (editorRef.current.contains(range.commonAncestorContainer) && range.collapsed) {
            // Cursor is in editor and collapsed - check if we're inside a styled span
            let node = range.startContainer;
            if (node.nodeType === Node.TEXT_NODE) {
              node = node.parentElement;
            }
            
            // Check if we're inside a span with zero-width space (style marker)
            const isInStyleMarker = node.tagName === "SPAN" && 
              (node.textContent === "\u200B" || node.innerHTML === "\u200B");
            
            // If we're in a style marker, typing will automatically use that style
            // Otherwise, check if we need to create one with ACTIVE STATE
            if (!isInStyleMarker) {
              // Check current styles from DOM
              let currentFontSize = 16;
              if (node.style && node.style.fontSize) {
                const inlineSize = parseInt(node.style.fontSize);
                if (!isNaN(inlineSize) && inlineSize > 0) {
                  currentFontSize = inlineSize;
                }
              } else {
                const computedStyle = window.getComputedStyle(node);
                if (computedStyle.fontSize) {
                  const computedSize = parseInt(computedStyle.fontSize);
                  if (!isNaN(computedSize) && computedSize > 0) {
                    currentFontSize = computedSize;
                  }
                }
              }
              
              const currentColor = node.style && node.style.color 
                ? node.style.color 
                : window.getComputedStyle(node).color;
              const currentFontWeight = node.style && node.style.fontWeight 
                ? node.style.fontWeight 
                : window.getComputedStyle(node).fontWeight;
              const currentFontStyle = node.style && node.style.fontStyle 
                ? node.style.fontStyle 
                : window.getComputedStyle(node).fontStyle;
              const currentTextDecoration = node.style && node.style.textDecoration 
                ? node.style.textDecoration 
                : window.getComputedStyle(node).textDecoration;
              
              // Convert color to hex for comparison
              const colorToHex = (color) => {
                if (color.startsWith('#')) return color;
                const rgb = color.match(/\d+/g);
                if (rgb && rgb.length >= 3) {
                  return "#" + rgb.slice(0, 3).map(x => {
                    const hex = parseInt(x).toString(16);
                    return hex.length === 1 ? "0" + hex : hex;
                  }).join("");
                }
                return color;
              };
              
              const currentColorHex = colorToHex(currentColor);
              const activeColorHex = colorToHex(activeColor);
              
              // Check if DOM styles match ACTIVE STATE (not lastUsedStylesRef)
              const fontSizeDiff = Math.abs(currentFontSize - activeFontSize);
              const fontSizeNeedsUpdate = fontSizeDiff > 1;
              
              const needsUpdate = 
                fontSizeNeedsUpdate ||
                currentColorHex !== activeColorHex ||
                (currentFontWeight !== (activeBold ? "bold" : "normal") && 
                 !(currentFontWeight === "bold" && activeBold) &&
                 !(parseInt(currentFontWeight) >= 600 && activeBold)) ||
                currentFontStyle !== (activeItalic ? "italic" : "normal") ||
                (currentTextDecoration !== (activeUnderline ? "underline" : "none") && 
                 !(currentTextDecoration.includes("underline") && activeUnderline));
              
              // If styles don't match ACTIVE STATE, create style marker with ACTIVE STATE
              if (needsUpdate) {
                const span = document.createElement("span");
                span.style.fontSize = `${activeFontSize}px`;
                span.style.color = activeColor;
                span.style.fontWeight = activeBold ? "bold" : "normal";
                span.style.fontStyle = activeItalic ? "italic" : "normal";
                span.style.textDecoration = activeUnderline ? "underline" : (activeStrikethrough ? "line-through" : "none");
                if (activeUnderline) {
                  span.style.setProperty("text-decoration-color", activeColor, "important");
                  span.style.setProperty("-webkit-text-decoration-color", activeColor, "important");
                }
                if (activeStrikethrough && activeUnderline) {
                  span.style.textDecoration = "underline line-through";
                }
                if (activeBgColor !== "transparent") {
                  span.style.backgroundColor = activeBgColor;
                }
                
                // Insert style marker at cursor
                try {
                  span.innerHTML = "\u200B";
                  range.insertNode(span);
                  const newRange = document.createRange();
                  newRange.setStartAfter(span);
                  newRange.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                  
                  // Update saved selection
                  savedSelectionRef.current = {
                    range: newRange.cloneRange(),
                    startContainer: newRange.startContainer,
                    startOffset: newRange.startOffset,
                    endContainer: newRange.endContainer,
                    endOffset: newRange.endOffset,
                    collapsed: newRange.collapsed,
                    text: newRange.toString()
                  };
                } catch (err) {
                  // Ignore error
                }
              }
            }
          }
        }
      }
    }
    
    // Allow Enter to create new paragraph (MS Word style)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      
      if (!editorRef.current) return;
      
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) return;
      
      try {
        // If there's selected text, delete it first
        if (!range.collapsed) {
          range.deleteContents();
        }
        
        // Find current paragraph to split
        let currentP = range.startContainer;
        if (currentP.nodeType === Node.TEXT_NODE) {
          currentP = currentP.parentElement;
        }
        while (currentP && currentP !== editorRef.current && currentP.tagName !== "P") {
          currentP = currentP.parentElement;
        }
        
        // Create new paragraph with ACTIVE styles immediately
        const newP = document.createElement("p");
        newP.innerHTML = "<br>";
        
        // Apply active styles to new paragraph IMMEDIATELY
        newP.style.fontSize = `${activeFontSize}px`;
        newP.style.color = activeColor;
        newP.style.fontWeight = activeBold ? "bold" : "normal";
        newP.style.fontStyle = activeItalic ? "italic" : "normal";
        newP.style.textDecoration = activeUnderline ? "underline" : (activeStrikethrough ? "line-through" : "none");
        if (activeUnderline) {
          newP.style.setProperty("text-decoration-color", activeColor, "important");
          newP.style.setProperty("-webkit-text-decoration-color", activeColor, "important");
        }
        if (activeStrikethrough && activeUnderline) {
          newP.style.textDecoration = "underline line-through";
        }
        // Background is always transparent for new paragraph (MS Word behavior)
        newP.style.backgroundColor = "transparent";
        
        // Insert style marker at cursor for next typing
        const span = document.createElement("span");
        span.style.fontSize = `${activeFontSize}px`;
        span.style.color = activeColor;
        span.style.fontWeight = activeBold ? "bold" : "normal";
        span.style.fontStyle = activeItalic ? "italic" : "normal";
        span.style.textDecoration = activeUnderline ? "underline" : (activeStrikethrough ? "line-through" : "none");
        if (activeUnderline) {
          span.style.setProperty("text-decoration-color", activeColor, "important");
          span.style.setProperty("-webkit-text-decoration-color", activeColor, "important");
        }
        if (activeStrikethrough && activeUnderline) {
          span.style.textDecoration = "underline line-through";
        }
        if (activeBgColor !== "transparent") {
          span.style.backgroundColor = activeBgColor;
        }
        span.innerHTML = "\u200B";
        newP.insertBefore(span, newP.firstChild);
        
        // Insert new paragraph
        if (currentP && currentP.tagName === "P") {
          // Split paragraph: move content after cursor to new paragraph
          const afterRange = range.cloneRange();
          afterRange.setStart(range.startContainer, range.startOffset);
          afterRange.setEndAfter(currentP);
          
          if (!afterRange.collapsed) {
            const fragment = afterRange.extractContents();
            // Remove the <br> from newP and add fragment
            newP.innerHTML = "";
            newP.appendChild(span);
            while (fragment.firstChild) {
              newP.appendChild(fragment.firstChild);
            }
          }
          
          // Insert new paragraph after current
          if (currentP.nextSibling) {
            currentP.parentNode.insertBefore(newP, currentP.nextSibling);
          } else {
            currentP.parentNode.appendChild(newP);
          }
        } else {
          // Not in paragraph, just insert
          range.insertNode(newP);
        }
        
        // Move cursor to style marker in new paragraph
        const newRange = document.createRange();
        newRange.setStartAfter(span);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        // Update saved selection
        savedSelectionRef.current = {
          range: newRange.cloneRange(),
          startContainer: newRange.startContainer,
          startOffset: newRange.startOffset,
          endContainer: newRange.endContainer,
          endOffset: newRange.endOffset,
          collapsed: newRange.collapsed,
          text: newRange.toString()
        };
        
        handleEditorInput();
      } catch (err) {
        console.error("Error inserting paragraph:", err);
        // Last resort: just insert line break
        try {
          document.execCommand("insertLineBreak", false, null);
          handleEditorInput();
        } catch (e2) {
          console.error("Error inserting line break:", e2);
        }
      }
      
      return; // Prevent default behavior
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

  // Format selection handlers with preserved selection - MS Word style
  const formatSelection = (command, value = null) => {
    if (!editorRef.current) return;
    
    // Focus editor first
    editorRef.current.focus();
    
    // Get current selection
      const selection = window.getSelection();
    let range = null;
    
    // Try to get current selection
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) {
        range = null;
      }
    }
    
    // If no current selection, try saved selection
    if (!range) {
      const savedRange = savedSelectionRef.current;
      if (savedRange) {
        try {
          range = document.createRange();
          range.setStart(savedRange.startContainer, savedRange.startOffset);
          range.setEnd(savedRange.endContainer, savedRange.endOffset);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          // Saved selection invalid, create new range at cursor
          range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false); // Move to end
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        // No saved selection, create range at end of editor
        range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false); // Move to end
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    // Check if selection is within editor
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      return;
    }
    
    // Save selection before formatting
    const savedRange = saveSelection();
    
    // MS Word behavior:
    // 1. If has selection -> apply to selection
    // 2. If collapsed cursor -> apply for next typing (set format state)
    if (!range.collapsed) {
      // Has selection - apply to selection
    document.execCommand(command, false, value);
    
      // Update last used styles based on command
      if (command === "bold") {
        lastUsedStylesRef.current.fontWeight = "bold";
      } else if (command === "italic") {
        lastUsedStylesRef.current.fontStyle = "italic";
      } else if (command === "underline") {
        lastUsedStylesRef.current.textDecoration = "underline";
      }
      
      // Restore selection after command
      requestAnimationFrame(() => {
        restoreSelection();
        handleEditorInput();
        requestAnimationFrame(() => detectStyles());
      });
    } else {
      // Collapsed cursor - set format for next typing (MS Word style)
      // Use execCommand which sets the format state for next typing
      document.execCommand(command, false, value);
      
      // Update last used styles
      if (command === "bold") {
        lastUsedStylesRef.current.fontWeight = "bold";
      } else if (command === "italic") {
        lastUsedStylesRef.current.fontStyle = "italic";
      } else if (command === "underline") {
        lastUsedStylesRef.current.textDecoration = "underline";
      }
      
      // Detect styles to update button states
      requestAnimationFrame(() => {
        detectStyles();
      handleEditorInput();
      });
    }
  };

  // Helper function to get all current styles from selection
  const getAllCurrentStyles = (range) => {
    const styles = {
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      fontSize: null,
      textColor: null,
      bgColor: null,
    };
    
    try {
      styles.bold = document.queryCommandState("bold");
      styles.italic = document.queryCommandState("italic");
      styles.underline = document.queryCommandState("underline");
      styles.strikethrough = document.queryCommandState("strikeThrough");
      
      // Get styles from node
      let node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }
      
      // Walk up the tree to find styles
      let currentNode = node;
      while (currentNode && currentNode !== editorRef.current) {
        const computedStyle = window.getComputedStyle(currentNode);
        
        // Get font size
        if (!styles.fontSize) {
          if (currentNode.style && currentNode.style.fontSize) {
            const fontSize = parseInt(currentNode.style.fontSize);
            if (!isNaN(fontSize) && fontSize > 0) {
              styles.fontSize = fontSize;
            }
          } else if (computedStyle.fontSize) {
            const fontSize = parseInt(computedStyle.fontSize);
            if (!isNaN(fontSize) && fontSize > 0 && fontSize !== 16) {
              styles.fontSize = fontSize;
            }
          }
        }
        
        // Get text color
        if (!styles.textColor) {
          if (currentNode.style && currentNode.style.color) {
            styles.textColor = currentNode.style.color;
          } else if (computedStyle.color && computedStyle.color !== "rgb(0, 0, 0)" && computedStyle.color !== "rgb(33, 37, 41)") {
            styles.textColor = computedStyle.color;
          }
        }
        
        // Get background color
        if (!styles.bgColor) {
          if (currentNode.style && currentNode.style.backgroundColor && currentNode.style.backgroundColor !== "transparent") {
            styles.bgColor = currentNode.style.backgroundColor;
          } else if (computedStyle.backgroundColor && computedStyle.backgroundColor !== "transparent" && computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)") {
            styles.bgColor = computedStyle.backgroundColor;
          }
        }
        
        currentNode = currentNode.parentElement;
      }
    } catch (e) {
      // Ignore errors
    }
    
    return styles;
  };

  // Helper function to apply styles to selection while preserving existing styles
  const applyStyleWithPreservation = (range, newStyles) => {
    if (range.collapsed) {
      // Cursor position - create span with all styles
      const span = document.createElement("span");
      
      // Apply all styles to span
      if (newStyles.textColor) span.style.color = newStyles.textColor;
      if (newStyles.bgColor) span.style.backgroundColor = newStyles.bgColor;
      if (newStyles.fontSize) span.style.fontSize = `${newStyles.fontSize}px`;
      if (newStyles.bold) span.style.fontWeight = "bold";
      if (newStyles.italic) span.style.fontStyle = "italic";
      if (newStyles.underline) span.style.textDecoration = "underline";
      if (newStyles.strikethrough) {
        if (span.style.textDecoration) {
          span.style.textDecoration += " line-through";
        } else {
          span.style.textDecoration = "line-through";
        }
      }
      
      span.innerHTML = "\u200B";
      try {
        range.insertNode(span);
        const newRange = document.createRange();
        newRange.setStartAfter(span);
        newRange.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        // Update saved selection to the new position (MS Word style - cursor shows style)
        savedSelectionRef.current = {
          range: newRange.cloneRange(),
          startContainer: newRange.startContainer,
          startOffset: newRange.startOffset,
          endContainer: newRange.endContainer,
          endOffset: newRange.endOffset,
          collapsed: newRange.collapsed,
          text: newRange.toString()
        };
      } catch (e) {
        console.error("Error inserting styled span:", e);
      }
    } else {
      // Has selection - wrap with span that has all styles
      try {
        // Try surroundContents first (works for simple selections)
        const span = document.createElement("span");
        
        // Apply all styles to span
        if (newStyles.textColor) span.style.color = newStyles.textColor;
        if (newStyles.bgColor) span.style.backgroundColor = newStyles.bgColor;
        if (newStyles.fontSize) span.style.fontSize = `${newStyles.fontSize}px`;
        if (newStyles.bold) span.style.fontWeight = "bold";
        if (newStyles.italic) span.style.fontStyle = "italic";
        if (newStyles.underline) span.style.textDecoration = "underline";
        if (newStyles.strikethrough) {
          if (span.style.textDecoration) {
            span.style.textDecoration += " line-through";
          } else {
            span.style.textDecoration = "line-through";
          }
        }
        
        // Try surroundContents first
        try {
          range.surroundContents(span);
        } catch (e) {
          // surroundContents failed - use extractContents
          const selectedContent = range.extractContents();
          span.appendChild(selectedContent);
          range.insertNode(span);
        }
        
        // Select the new span
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (e) {
        console.error("Error applying styles to selection:", e);
      }
    }
  };

  const applyTextColor = (color) => {
    if (!editorRef.current) return;
    
    // ===== STEP 1: Update Active State (Single Source of Truth) =====
    setActiveColor(color);
    setDisplayedColor(color); // Update UI display
    
    editorRef.current.focus();
    
    // Get current selection
    const selection = window.getSelection();
    let range = null;
    
    // Try to restore saved selection first
    if (savedSelectionRef.current) {
      try {
        const saved = savedSelectionRef.current;
        range = document.createRange();
        range.setStart(saved.startContainer, saved.startOffset);
        range.setEnd(saved.endContainer, saved.endOffset);
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          range = null;
        }
      } catch (e) {
        range = null;
      }
    }
    
    // If no saved selection, try current selection
    if (!range && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) {
        range = null;
      }
    }
    
    // If still no range, save and create one
    if (!range) {
      const savedRange = saveSelection();
      if (savedRange) {
        try {
          range = document.createRange();
          range.setStart(savedRange.startContainer, savedRange.startOffset);
          range.setEnd(savedRange.endContainer, savedRange.endOffset);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          // Create range at cursor
          range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        // Create range at end
        range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    // ===== STEP 2: Apply to Selection or Cursor =====
    // MS Word behavior:
    // - If has selection: apply to selection
    // - If collapsed cursor: insert style marker for next typing
    
    if (range.collapsed) {
      // Collapsed cursor - insert style marker with active styles
      const currentStyles = getAllCurrentStyles(range);
      currentStyles.textColor = color;
      currentStyles.fontSize = activeFontSize;
      currentStyles.bgColor = activeBgColor;
      currentStyles.bold = activeBold;
      currentStyles.italic = activeItalic;
      currentStyles.underline = activeUnderline;
      currentStyles.strikethrough = activeStrikethrough;
      
      applyStyleWithPreservation(range, currentStyles);
    } else {
      // Has selection - apply to selection
      const currentStyles = getAllCurrentStyles(range);
      currentStyles.textColor = color;
      // Preserve other styles from selection
      applyStyleWithPreservation(range, currentStyles);
    }
    
    // Legacy state updates (untuk backward compatibility)
    setSelectedColor(color);
    setCurrentTextColor(color);
    
    // Trigger input to save
    handleEditorInput();
    
    // Also update underline color to match text color - VERY aggressive approach
    requestAnimationFrame(() => {
      try {
        // Get the range after foreColor is applied
        const range = selection.getRangeAt(0);
        
        // Helper function to update underline color on an element
        const updateUnderlineColor = (element) => {
          if (!element || !element.style) return;
          try {
                const computedStyle = window.getComputedStyle(element);
                const hasUnderline = computedStyle.textDecoration.includes("underline") || 
                                     element.tagName === "U" ||
                                 (element.style.textDecoration && 
                                      element.style.textDecoration.includes("underline"));
                
            if (hasUnderline) {
                  element.style.setProperty("text-decoration-color", color, "important");
                  element.style.setProperty("-webkit-text-decoration-color", color, "important");
              }
            } catch (e) {
              // Skip if error
            }
        };
        
        // Method 1: Update all U tags in the entire editor that have the same color
        const allUTags = editorRef.current.querySelectorAll("u");
        allUTags.forEach(uTag => {
          try {
            // Check if this U tag has the same text color as the applied color
            const computedStyle = window.getComputedStyle(uTag);
            const textColor = computedStyle.color;
            const colorMatches = textColor === color || 
                               (textColor.includes("rgb") && color.includes("rgb") && 
                                textColor.replace(/\s/g, "") === color.replace(/\s/g, ""));
            
            // Also check if it's in the selection
            const inSelection = range.intersectsNode(uTag);
            
            if (inSelection || colorMatches) {
              updateUnderlineColor(uTag);
            }
          } catch (e) {
            // Skip if error
          }
        });
        
        // Method 2: Find all elements with underline in selection and update them
        const container = range.commonAncestorContainer;
        const parent = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;
        
        if (parent && editorRef.current.contains(parent)) {
          // Get all elements that intersect with selection
          const allElements = parent.querySelectorAll("*");
          
          allElements.forEach(element => {
            try {
              if (range.intersectsNode(element)) {
                updateUnderlineColor(element);
              }
            } catch (e) {
              // Skip if error
            }
          });
        }
        
        // Method 3: Walk up the DOM tree from selection start and update all parents
        let checkNode = range.startContainer;
        if (checkNode.nodeType === Node.TEXT_NODE) {
          checkNode = checkNode.parentElement;
        }
        
        while (checkNode && checkNode !== editorRef.current) {
          updateUnderlineColor(checkNode);
          checkNode = checkNode.parentElement;
        }
        
        // Method 4: Find ALL elements with underline in the entire editor and update if they have matching color
        const allElementsWithUnderline = editorRef.current.querySelectorAll("*");
        allElementsWithUnderline.forEach(element => {
          try {
            if (!element.style) return;
            const computedStyle = window.getComputedStyle(element);
              const hasUnderline = computedStyle.textDecoration.includes("underline") || 
                               element.tagName === "U";
              
              if (hasUnderline) {
              // Check if text color matches the applied color
              const textColor = computedStyle.color;
              const colorMatches = textColor === color || 
                                 (textColor.includes("rgb") && color.includes("rgb") && 
                                  textColor.replace(/\s/g, "") === color.replace(/\s/g, ""));
              
              // Also check if it's in the selection
              const inSelection = range.intersectsNode(element);
              
              if (inSelection || colorMatches) {
                updateUnderlineColor(element);
              }
            }
          } catch (e) {
            // Skip if error
          }
        });
        
        // Method 5: Update all elements with inline style that have underline
        const allStyledElements = editorRef.current.querySelectorAll("[style*='text-decoration']");
        allStyledElements.forEach(element => {
          try {
            if (range.intersectsNode(element)) {
              updateUnderlineColor(element);
            }
          } catch (e) {
            // Skip if error
          }
        });
      } catch (e) {
        console.error("Error updating underline color:", e);
      }
      
      restoreSelection();
      // State already updated above for immediate responsiveness
      setShowColorPicker(false);
      handleEditorInput();
      // Force immediate style detection for button states
      requestAnimationFrame(() => {
        detectStyles();
        // Double check to ensure button states are synced
        requestAnimationFrame(() => detectStyles());
      });
    });
  };

  const applyBgColor = (color) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    const savedRange = saveSelection();
    if (!savedRange) {
      editorRef.current.focus();
      return;
    }
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
    
    // Get all current styles
    const currentStyles = getAllCurrentStyles(savedRange);
    
    // Update background color in styles
    currentStyles.bgColor = color === "transparent" ? null : color;
    
    // Apply all styles (including new bg color) while preserving others
    applyStyleWithPreservation(savedRange, currentStyles);
    
    // Update last used bg color
    lastUsedStylesRef.current.backgroundColor = color === "transparent" ? "transparent" : color;
    
    // IMMEDIATELY update state
    setSelectedBgColor(color);
    setCurrentBgColor(color === "transparent" ? "transparent" : color);
    
    // Trigger input to save
    handleEditorInput();
    
    // Detect styles after applying
    requestAnimationFrame(() => {
      detectStyles();
    });
    
    if (color === "transparent") {
      // Remove background color - aggressive approach
      if (!range.collapsed) {
        // Has selection - remove background from selection
        // Find all elements with background in selection and remove it
        const walker = document.createTreeWalker(
          editorRef.current,
          NodeFilter.SHOW_ELEMENT,
          null
        );
        
        const elementsToFix = [];
        let node;
        while (node = walker.nextNode()) {
          if (range.intersectsNode(node)) {
            const computedStyle = window.getComputedStyle(node);
            if (computedStyle.backgroundColor !== "transparent" && 
                computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)") {
              elementsToFix.push(node);
            }
          }
        }
        
        // Remove background from all found elements
        elementsToFix.forEach(element => {
          element.style.backgroundColor = "transparent";
          element.style.background = "transparent";
        });
        
        // Also use removeFormat to remove any mark tags with background
        document.execCommand("removeFormat", false, null);
        
        // Then wrap selection in span with transparent to ensure it's removed
        try {
        const span = document.createElement("span");
        span.style.backgroundColor = "transparent";
        span.style.background = "transparent";
        
          if (range.collapsed) {
            span.innerHTML = "\u200B";
            range.insertNode(span);
          } else {
        try {
          range.surroundContents(span);
        } catch (e) {
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
            }
          }
        } catch (e) {
          // Ignore error
        }
      } else {
        // Collapsed cursor - set transparent for next typing
        // Create span with transparent background
        const span = document.createElement("span");
        span.style.backgroundColor = "transparent";
        span.style.background = "transparent";
        span.innerHTML = "\u200B";
        
        try {
          range.insertNode(span);
          const newRange = document.createRange();
          newRange.setStartAfter(span);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (e) {
          // Ignore error
        }
      }
    } else {
      // Apply background color
      if (!range.collapsed) {
        // Has selection - apply to selection
        document.execCommand("backColor", false, color);
      } else {
        // Collapsed cursor - apply for next typing
      document.execCommand("backColor", false, color);
      }
    }
    
    // RESTORE preserved styles after applying background color
    requestAnimationFrame(() => {
      try {
        // Restore bold
        if (preserveBold && !document.queryCommandState("bold")) {
          document.execCommand("bold", false, null);
        }
        // Restore italic
        if (preserveItalic && !document.queryCommandState("italic")) {
          document.execCommand("italic", false, null);
        }
        // Restore underline - AGGRESSIVE restoration to prevent loss
        if (preserveUnderline) {
          const currentRange = selection.getRangeAt(0);
          let underlineNode = currentRange.startContainer;
          if (underlineNode.nodeType === Node.TEXT_NODE) {
            underlineNode = underlineNode.parentElement;
          }
          const computedStyle = window.getComputedStyle(underlineNode);
          const stillHasUnderline = computedStyle.textDecoration.includes("underline") || 
                                   underlineNode.tagName === "U" ||
                                   document.queryCommandState("underline");
          
          if (!stillHasUnderline) {
            // Underline was lost - restore it IMMEDIATELY
            document.execCommand("underline", false, null);
            // Also ensure underline color matches text color
            if (preserveTextColor) {
              requestAnimationFrame(() => {
                const allUTags = editorRef.current.querySelectorAll("u");
                allUTags.forEach(uTag => {
                  try {
                    if (currentRange.intersectsNode(uTag) && uTag.style) {
                      uTag.style.setProperty("text-decoration-color", preserveTextColor, "important");
                      uTag.style.setProperty("-webkit-text-decoration-color", preserveTextColor, "important");
                    }
                  } catch (e) {
                    // Skip if error
                  }
                });
                
                // Also check elements with underline style
                const allElements = editorRef.current.querySelectorAll("*");
                allElements.forEach(element => {
                  try {
                    if (currentRange.intersectsNode(element) && element.style) {
                      const elemStyle = window.getComputedStyle(element);
                      if (elemStyle.textDecoration.includes("underline")) {
                        element.style.setProperty("text-decoration-color", preserveTextColor, "important");
                        element.style.setProperty("-webkit-text-decoration-color", preserveTextColor, "important");
                      }
                    }
                  } catch (e) {
                    // Skip if error
                  }
                });
              });
            }
          }
        }
        // Restore strikethrough
        if (preserveStrikethrough && !document.queryCommandState("strikeThrough")) {
          document.execCommand("strikeThrough", false, null);
        }
        // Restore font size
        if (preserveFontSize) {
          const currentRange = selection.getRangeAt(0);
          let sizeNode = currentRange.startContainer;
          if (sizeNode.nodeType === Node.TEXT_NODE) {
            sizeNode = sizeNode.parentElement;
          }
          if (sizeNode.style) {
            sizeNode.style.fontSize = `${preserveFontSize}px`;
          }
        }
        // Restore text color
        if (preserveTextColor) {
          const currentRange = selection.getRangeAt(0);
          let colorNode = currentRange.startContainer;
          if (colorNode.nodeType === Node.TEXT_NODE) {
            colorNode = colorNode.parentElement;
          }
          if (colorNode.style) {
            colorNode.style.color = preserveTextColor;
          }
        }
      } catch (e) {
        // Ignore errors
      }
    });
    
    // IMMEDIATELY update state for button responsiveness
    setSelectedBgColor(color === "transparent" ? "#FFFF00" : color);
    setCurrentBgColor(color);
    setShowBgColorPicker(false);
    // Update last used background color
    lastUsedStylesRef.current.backgroundColor = color;
    handleEditorInput();
    // Force immediate style detection for button states
    requestAnimationFrame(() => {
      detectStyles();
      // Double check to ensure button states are synced
      requestAnimationFrame(() => {
        detectStyles();
        if (savedRange) {
          restoreSelection();
        }
      });
    });
  };

  // Apply font size - MS Word style: update active state + apply to selection or prepare for next typing
  const applyFontSize = (size) => {
    if (!editorRef.current || !size) return;
    
    // ===== STEP 1: Update Active State (Single Source of Truth) =====
    setActiveFontSize(size);
    setDisplayedFontSize(size); // Update UI display
    
    editorRef.current.focus();
    
    // Get current selection
    const selection = window.getSelection();
    let range = null;
    
    // Try to restore saved selection first
    if (savedSelectionRef.current) {
      try {
        const saved = savedSelectionRef.current;
        range = document.createRange();
        range.setStart(saved.startContainer, saved.startOffset);
        range.setEnd(saved.endContainer, saved.endOffset);
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          range = null;
        }
      } catch (e) {
        range = null;
      }
    }
    
    // If no saved selection, try current selection
    if (!range && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) {
        range = null;
      }
    }
    
    // If still no range, save and create one
    if (!range) {
      const savedRange = saveSelection();
      if (savedRange) {
        try {
          range = document.createRange();
          range.setStart(savedRange.startContainer, savedRange.startOffset);
          range.setEnd(savedRange.endContainer, savedRange.endOffset);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          // Create range at cursor
          range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        // Create range at end
        range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    // ===== STEP 2: Apply to Selection or Cursor =====
    // MS Word behavior:
    // - If has selection: apply to selection
    // - If collapsed cursor: insert style marker for next typing
    
    if (range.collapsed) {
      // Collapsed cursor - insert style marker with active styles
      const currentStyles = getAllCurrentStyles(range);
      currentStyles.fontSize = size;
      currentStyles.textColor = activeColor;
      currentStyles.bgColor = activeBgColor;
      currentStyles.bold = activeBold;
      currentStyles.italic = activeItalic;
      currentStyles.underline = activeUnderline;
      currentStyles.strikethrough = activeStrikethrough;
      
      applyStyleWithPreservation(range, currentStyles);
    } else {
      // Has selection - apply to selection
      const currentStyles = getAllCurrentStyles(range);
      currentStyles.fontSize = size;
      // Preserve other styles from selection
      applyStyleWithPreservation(range, currentStyles);
    }
    
    // Trigger input to save
    handleEditorInput();
    
    // Update UI display (detectStyles hanya untuk update button states)
    requestAnimationFrame(() => {
      detectStyles();
    });
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
      requestAnimationFrame(() => detectStyles());
    }
  }, []);

  // Detect all styles from current selection/cursor
  const detectStyles = () => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    
    // If no selection, try to get cursor position
    let range = null;
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
        range = null;
      }
    }
    
    // If no valid range, create one at the end of editor
    if (!range) {
      range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false); // Move to end
    }
    
    let node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }
    
    // Detect styles by walking up the DOM tree
    // Start from the closest node to get most specific styles first
    let detectedBold = false;
    let detectedItalic = false;
    let detectedUnderline = false;
    let detectedStrikethrough = false;
    let detectedFontSize = null;
    let detectedTextColor = null;
    let detectedBgColor = "transparent";
    
    // Use queryCommandState for more accurate detection (if available)
    try {
      detectedBold = document.queryCommandState("bold");
      detectedItalic = document.queryCommandState("italic");
      detectedUnderline = document.queryCommandState("underline");
      detectedStrikethrough = document.queryCommandState("strikeThrough");
    } catch (e) {
      // queryCommandState not available, use manual detection
    }
    
    // First, check the closest node (most specific)
    const closestNode = node;
    const closestComputedStyle = window.getComputedStyle(closestNode);
    
    // Detect font size from closest node first (most accurate)
    if (closestNode.style && closestNode.style.fontSize) {
      const fontSize = parseInt(closestNode.style.fontSize);
      if (!isNaN(fontSize) && fontSize > 0) {
        detectedFontSize = fontSize;
      }
    }
    
    // If no inline font size, check computed style
    if (detectedFontSize === null) {
      const computedFontSize = closestComputedStyle.fontSize;
      if (computedFontSize) {
        const fontSize = parseFloat(computedFontSize);
        if (!isNaN(fontSize) && fontSize > 0) {
          detectedFontSize = Math.round(fontSize);
        }
      }
    }
    
    // Walk up the DOM tree to detect other styles (only if queryCommandState didn't work)
    if (!detectedBold || !detectedItalic || !detectedUnderline) {
      let checkNode = node;
      while (checkNode && checkNode !== editorRef.current) {
        const computedStyle = window.getComputedStyle(checkNode);
      
      // Detect bold - check both computed style and tag
        if (!detectedBold) {
      const fontWeight = computedStyle.fontWeight;
      if (fontWeight === "bold" || 
          fontWeight === "700" || 
          fontWeight === "600" ||
          (parseInt(fontWeight) >= 600 && parseInt(fontWeight) <= 900) ||
              checkNode.tagName === "B" || 
              checkNode.tagName === "STRONG" ||
              (checkNode.style && checkNode.style.fontWeight && 
               (checkNode.style.fontWeight === "bold" || parseInt(checkNode.style.fontWeight) >= 600))) {
        detectedBold = true;
          }
      }
      
      // Detect italic
        if (!detectedItalic) {
          if (computedStyle.fontStyle === "italic" || checkNode.tagName === "I" || checkNode.tagName === "EM") {
        detectedItalic = true;
          }
      }
      
      // Detect underline - check both computed style and tag
        if (!detectedUnderline) {
      if (computedStyle.textDecoration.includes("underline") || 
          (computedStyle.textDecorationLine && computedStyle.textDecorationLine.includes("underline")) ||
              checkNode.tagName === "U" || 
              (checkNode.style && checkNode.style.textDecoration && checkNode.style.textDecoration.includes("underline"))) {
        detectedUnderline = true;
          }
      }
      
      // Detect strikethrough
        if (!detectedStrikethrough) {
          if (computedStyle.textDecoration.includes("line-through") || checkNode.tagName === "S" || checkNode.tagName === "STRIKE") {
        detectedStrikethrough = true;
          }
      }
      
      // Detect font size - prioritize inline style over computed
        if (detectedFontSize === null && checkNode.style && checkNode.style.fontSize) {
          const fontSize = parseInt(checkNode.style.fontSize);
        if (!isNaN(fontSize) && fontSize > 0) {
          detectedFontSize = fontSize;
        }
      }
      
      // Detect text color
        if (!detectedTextColor) {
          if (checkNode.style && checkNode.style.color && 
              checkNode.style.color !== "rgb(0, 0, 0)" && 
              checkNode.style.color !== "#000000") {
            detectedTextColor = checkNode.style.color;
          } else if (computedStyle.color && 
                     computedStyle.color !== "rgb(0, 0, 0)" && 
                     computedStyle.color !== "rgb(29, 41, 57)" &&
                     computedStyle.color !== "rgba(0, 0, 0, 0)") {
        // Convert rgb to hex if needed
        const rgb = computedStyle.color.match(/\d+/g);
        if (rgb && rgb.length === 3) {
              const r = parseInt(rgb[0]);
              const g = parseInt(rgb[1]);
              const b = parseInt(rgb[2]);
              // Only set if it's not black
              if (r !== 0 || g !== 0 || b !== 0) {
          detectedTextColor = "#" + rgb.map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          }).join("");
              }
            }
        }
      }
      
      // Detect background color
        if (detectedBgColor === "transparent") {
          // Check inline style first
          if (checkNode.style && checkNode.style.backgroundColor) {
            const bgColor = checkNode.style.backgroundColor;
            if (bgColor !== "transparent" && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "") {
              detectedBgColor = bgColor;
            }
          } 
          // Then check computed style
          else if (computedStyle.backgroundColor) {
            const bgColor = computedStyle.backgroundColor;
            // Check if it's actually a color (not transparent)
            if (bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent" && bgColor !== "rgb(0, 0, 0)") {
              // Convert rgb/rgba to hex if needed
              const rgb = bgColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
                const r = parseInt(rgb[0]);
                const g = parseInt(rgb[1]);
                const b = parseInt(rgb[2]);
                // Only set if it's not black/transparent
                if (r !== 0 || g !== 0 || b !== 0) {
                  detectedBgColor = "#" + [r, g, b].map(x => {
                    const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          }).join("");
                }
              }
            }
          }
        }
        
        checkNode = checkNode.parentElement;
      }
    }
    
    // Convert detected colors to hex format for consistency
    const colorToHex = (color) => {
      if (!color) return "#000000";
      if (color.startsWith('#')) return color;
      if (color === "transparent" || color === "rgba(0, 0, 0, 0)") return "transparent";
      const rgb = color.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        return "#" + rgb.slice(0, 3).map(x => {
          const hex = parseInt(x).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        }).join("");
      }
      return color;
    };
    
    const hexTextColor = detectedTextColor ? colorToHex(detectedTextColor) : null;
    const hexBgColor = detectedBgColor ? colorToHex(detectedBgColor) : null;
    
    // ===== CRITICAL: detectStyles() HANYA untuk update UI, TIDAK mengubah active state =====
    // Update displayed states (untuk UI button/input display)
    setDisplayedBold(detectedBold);
    setDisplayedItalic(detectedItalic);
    setDisplayedUnderline(detectedUnderline);
    setDisplayedStrikethrough(detectedStrikethrough);
    
    // Update displayed font size - gunakan detected jika ada, jika tidak gunakan active state
    if (detectedFontSize !== null) {
      setDisplayedFontSize(detectedFontSize);
    }
    
    // Update displayed colors - gunakan detected jika ada, jika tidak gunakan active state
    if (hexTextColor) {
      setDisplayedColor(hexTextColor);
    }
    if (hexBgColor) {
      setDisplayedBgColor(hexBgColor);
    }
    
    // Legacy state updates (untuk backward compatibility)
    setCurrentBold(detectedBold);
    setCurrentItalic(detectedItalic);
    setCurrentUnderline(detectedUnderline);
    setCurrentStrikethrough(detectedStrikethrough);
    if (detectedFontSize !== null) {
      setSelectedFontSize(detectedFontSize);
    }
    if (hexTextColor) {
      setCurrentTextColor(hexTextColor);
      setSelectedColor(hexTextColor);
    }
    if (hexBgColor) {
      setCurrentBgColor(hexBgColor);
      setSelectedBgColor(hexBgColor === "transparent" ? "#FFFF00" : hexBgColor);
    }
    
    // Initialize active state from DOM on first detection (hanya sekali)
    if (!isActiveStateInitializedRef.current) {
      if (detectedFontSize !== null) {
        setActiveFontSize(detectedFontSize);
      }
      if (hexTextColor) {
        setActiveColor(hexTextColor);
      }
      if (hexBgColor) {
        setActiveBgColor(hexBgColor);
      }
      setActiveBold(detectedBold);
      setActiveItalic(detectedItalic);
      setActiveUnderline(detectedUnderline);
      setActiveStrikethrough(detectedStrikethrough);
      isActiveStateInitializedRef.current = true;
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
        requestAnimationFrame(() => {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (!range.collapsed) {
              saveSelection();
            }
          }
        });
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
    
    if (!editorRef.current) return;
    
    // Focus editor
    editorRef.current.focus();
    
    // Save selection before toggling
    saveSelection();
    
    // Get current selection
    const selection = window.getSelection();
    let range = null;
    
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) {
        range = null;
      }
    }
    
    // If no selection, try saved selection or create at end
    if (!range) {
      const savedRange = savedSelectionRef.current;
      if (savedRange) {
        try {
          range = document.createRange();
          range.setStart(savedRange.startContainer, savedRange.startOffset);
          range.setEnd(savedRange.endContainer, savedRange.endOffset);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    // Check if already bold
    let isBold = false;
    try {
      isBold = document.queryCommandState("bold");
    } catch (e) {
      // Check manually
      let node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }
      const computedStyle = window.getComputedStyle(node);
      const fontWeight = computedStyle.fontWeight;
      isBold = fontWeight === "bold" || fontWeight === "700" || (parseInt(fontWeight) >= 600);
    }
    
    // Toggle bold - MS Word style: works for selection or sets format for next typing
    const newBoldState = !isBold;
    
    // ===== CRITICAL: Update Active State =====
    setActiveBold(newBoldState);
    
    // Apply to selection or cursor
    if (range.collapsed) {
      // Collapsed cursor - insert style marker with active styles
      const currentStyles = getAllCurrentStyles(range);
      currentStyles.bold = newBoldState;
      currentStyles.fontSize = activeFontSize;
      currentStyles.textColor = activeColor;
      currentStyles.bgColor = activeBgColor;
      currentStyles.italic = activeItalic;
      currentStyles.underline = activeUnderline;
      currentStyles.strikethrough = activeStrikethrough;
      
      applyStyleWithPreservation(range, currentStyles);
    } else {
      // Has selection - apply to selection
      document.execCommand("bold", false, null);
    }
    
    // Update last used style (legacy)
    lastUsedStylesRef.current.fontWeight = newBoldState ? "bold" : "normal";
    
    // Update styles
    requestAnimationFrame(() => {
      detectStyles();
      handleEditorInput();
    });
  };

  const toggleItalic = (e) => {
    if (e) e.preventDefault();
    
    if (!editorRef.current) return;
    
    // Focus editor
    editorRef.current.focus();
    
    // Save selection before toggling
    saveSelection();
    
    // Get current selection
    const selection = window.getSelection();
    let range = null;
    
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) {
        range = null;
      }
    }
    
    // If no selection, try saved selection or create at end
    if (!range) {
      const savedRange = savedSelectionRef.current;
      if (savedRange) {
        try {
          range = document.createRange();
          range.setStart(savedRange.startContainer, savedRange.startOffset);
          range.setEnd(savedRange.endContainer, savedRange.endOffset);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    // Check if already italic
    let isItalic = false;
    try {
      isItalic = document.queryCommandState("italic");
    } catch (e) {
      // Check manually
      let node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }
      const computedStyle = window.getComputedStyle(node);
      isItalic = computedStyle.fontStyle === "italic";
    }
    
    // Toggle italic - MS Word style: works for selection or sets format for next typing
    const newItalicState = !isItalic;
    
    // ===== CRITICAL: Update Active State =====
    setActiveItalic(newItalicState);
    
    // Apply to selection or cursor
    if (range.collapsed) {
      // Collapsed cursor - insert style marker with active styles
      const currentStyles = getAllCurrentStyles(range);
      currentStyles.italic = newItalicState;
      currentStyles.fontSize = activeFontSize;
      currentStyles.textColor = activeColor;
      currentStyles.bgColor = activeBgColor;
      currentStyles.bold = activeBold;
      currentStyles.underline = activeUnderline;
      currentStyles.strikethrough = activeStrikethrough;
      
      applyStyleWithPreservation(range, currentStyles);
    } else {
      // Has selection - apply to selection
      document.execCommand("italic", false, null);
    }
    
    // Update last used style (legacy)
    lastUsedStylesRef.current.fontStyle = newItalicState ? "italic" : "normal";
    
    // Update styles
    requestAnimationFrame(() => {
      detectStyles();
      handleEditorInput();
    });
  };

  const toggleUnderline = (e) => {
    if (e) e.preventDefault();
    
    if (!editorRef.current) return;
    
    // Focus editor first
    editorRef.current.focus();
    
    // Save selection before formatting
    saveSelection();
    
    // Get current selection
    const selection = window.getSelection();
    let range = null;
    
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) {
        range = null;
      }
    }
    
    // If no selection, try saved selection or create at end
    if (!range) {
      const savedRange = savedSelectionRef.current;
      if (savedRange) {
        try {
          range = document.createRange();
          range.setStart(savedRange.startContainer, savedRange.startOffset);
          range.setEnd(savedRange.endContainer, savedRange.endOffset);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    // Check if already underlined - check ONLY in selection, not parent
    let hasUnderline = false;
    try {
      hasUnderline = document.queryCommandState("underline");
    } catch (e) {
      // Check manually - ONLY check nodes in selection
      if (!range.collapsed) {
        // Has selection - check only selected nodes
        const walker = document.createTreeWalker(
          range.commonAncestorContainer,
          NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              if (node.nodeType === Node.TEXT_NODE) {
                return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
              }
              return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
          }
        );
        
        let node;
        while (node = walker.nextNode()) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const computedStyle = window.getComputedStyle(node);
            if (computedStyle.textDecoration.includes("underline") || 
                node.tagName === "U" ||
                (node.style && node.style.textDecoration && node.style.textDecoration.includes("underline"))) {
              hasUnderline = true;
              break;
            }
          }
        }
      } else {
        // Collapsed cursor - check current node
        let node = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentElement;
        }
        const computedStyle = window.getComputedStyle(node);
        if (computedStyle.textDecoration.includes("underline") || 
            node.tagName === "U" ||
            (node.style && node.style.textDecoration && node.style.textDecoration.includes("underline"))) {
          hasUnderline = true;
        }
      }
    }
    
    // Toggle underline - SIMPLE and EFFECTIVE toggle
    if (hasUnderline) {
      // Remove underline - AGGRESSIVE removal to ensure it's completely removed
      // First, manually remove all U tags and underline styles in selection
      if (!range.collapsed) {
        // Has selection - remove underline from all elements in selection
        const allUTags = editorRef.current.querySelectorAll("u");
        const uTagsToRemove = [];
        allUTags.forEach(uTag => {
          try {
            if (range.intersectsNode(uTag)) {
              uTagsToRemove.push(uTag);
            }
          } catch (e) {
            // Skip if error
          }
        });
        
        // Unwrap all U tags
        uTagsToRemove.forEach(uTag => {
          try {
            const parent = uTag.parentNode;
            while (uTag.firstChild) {
              parent.insertBefore(uTag.firstChild, uTag);
            }
            parent.removeChild(uTag);
          } catch (e) {
            // Skip if error
          }
        });
        
        // Remove underline from style
        const allElements = editorRef.current.querySelectorAll("*");
        allElements.forEach(element => {
          try {
            if (range.intersectsNode(element) && element.style) {
              const textDecoration = element.style.textDecoration || "";
              if (textDecoration.includes("underline")) {
                const newDecoration = textDecoration
                  .split(" ")
                  .filter(d => d !== "underline")
                  .join(" ");
                if (newDecoration.trim()) {
                  element.style.textDecoration = newDecoration;
                } else {
                  element.style.textDecoration = "none";
                }
              }
            }
          } catch (e) {
            // Skip if error
          }
        });
      } else {
        // Collapsed cursor - remove underline from current node
        let checkNode = range.startContainer;
        if (checkNode.nodeType === Node.TEXT_NODE) {
          checkNode = checkNode.parentElement;
        }
        if (checkNode.tagName === "U") {
          // Unwrap U tag
          const parent = checkNode.parentNode;
          while (checkNode.firstChild) {
            parent.insertBefore(checkNode.firstChild, checkNode);
          }
          parent.removeChild(checkNode);
        } else if (checkNode.style) {
          const textDecoration = checkNode.style.textDecoration || "";
          if (textDecoration.includes("underline")) {
            const newDecoration = textDecoration
              .split(" ")
              .filter(d => d !== "underline")
              .join(" ");
            if (newDecoration.trim()) {
              checkNode.style.textDecoration = newDecoration;
            } else {
              checkNode.style.textDecoration = "none";
            }
          }
        }
      }
      
      // ===== CRITICAL: Update Active State =====
      setActiveUnderline(false);
      
      // Then use execCommand to ensure underline is removed
      if (!range.collapsed) {
        document.execCommand("underline", false, null);
      } else {
        // Collapsed cursor - insert style marker without underline
        const currentStyles = getAllCurrentStyles(range);
        currentStyles.underline = false;
        currentStyles.fontSize = activeFontSize;
        currentStyles.textColor = activeColor;
        currentStyles.bgColor = activeBgColor;
        currentStyles.bold = activeBold;
        currentStyles.italic = activeItalic;
        currentStyles.strikethrough = activeStrikethrough;
        
        applyStyleWithPreservation(range, currentStyles);
      }
      
      // CRITICAL: Update lastUsedStylesRef IMMEDIATELY so next typing won't have underline
      lastUsedStylesRef.current.textDecoration = "none";
    } else {
      // ===== CRITICAL: Update Active State =====
      setActiveUnderline(true);
      
      // Add underline
      if (!range.collapsed) {
        document.execCommand("underline", false, null);
      } else {
        // Collapsed cursor - insert style marker with underline
        const currentStyles = getAllCurrentStyles(range);
        currentStyles.underline = true;
        currentStyles.fontSize = activeFontSize;
        currentStyles.textColor = activeColor;
        currentStyles.bgColor = activeBgColor;
        currentStyles.bold = activeBold;
        currentStyles.italic = activeItalic;
        currentStyles.strikethrough = activeStrikethrough;
        
        applyStyleWithPreservation(range, currentStyles);
      }
      
      lastUsedStylesRef.current.textDecoration = "underline";
    }
    
    // Update underline color to match current text color (only if adding underline)
    if (!hasUnderline) {
      requestAnimationFrame(() => {
        try {
          // Get current text color
          let currentColor = lastUsedStylesRef.current.color;
          if (!currentColor || currentColor === "rgb(0, 0, 0)") {
            // Try to get color from current selection
            const currentRange = selection.getRangeAt(0);
            let colorNode = currentRange.startContainer;
            if (colorNode.nodeType === Node.TEXT_NODE) {
              colorNode = colorNode.parentElement;
            }
            const computedColor = window.getComputedStyle(colorNode).color;
            if (computedColor && computedColor !== "rgb(0, 0, 0)") {
              currentColor = computedColor;
            }
          }
          
          // Convert RGB to hex if needed
          const colorToHex = (color) => {
            if (color.startsWith('#')) return color;
            const rgb = color.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              return "#" + rgb.slice(0, 3).map(x => {
                const hex = parseInt(x).toString(16);
                return hex.length === 1 ? "0" + hex : hex;
              }).join("");
            }
            return color;
          };
          
          const hexColor = colorToHex(currentColor);
          
          // Update underline color for all underlined elements in selection
          const allUTags = editorRef.current.querySelectorAll("u");
          allUTags.forEach(uTag => {
            try {
              if (range.intersectsNode(uTag) && uTag.style) {
                uTag.style.setProperty("text-decoration-color", hexColor, "important");
                uTag.style.setProperty("-webkit-text-decoration-color", hexColor, "important");
              }
            } catch (e) {
              // Skip if error
            }
          });
          
          // Also update any elements with underline style
          const allElements = editorRef.current.querySelectorAll("*");
          allElements.forEach(element => {
            try {
              if (range.intersectsNode(element) && element.style) {
                const computedStyle = window.getComputedStyle(element);
                if (computedStyle.textDecoration.includes("underline")) {
                  element.style.setProperty("text-decoration-color", hexColor, "important");
                  element.style.setProperty("-webkit-text-decoration-color", hexColor, "important");
                }
              }
            } catch (e) {
              // Skip if error
            }
          });
        } catch (e) {
          console.error("Error updating underline color in toggleUnderline:", e);
        }
      });
    }
    
    // Update styles immediately
    requestAnimationFrame(() => {
      detectStyles();
      handleEditorInput();
      // Double check to ensure underline is properly removed/added
      requestAnimationFrame(() => {
        detectStyles();
      });
    });
  };

  const toggleStrikethrough = (e) => {
    if (e) e.preventDefault();
    // Save selection before toggling
    saveSelection();
    formatSelection("strikeThrough");
    // Update last used style and detect styles after applying
    requestAnimationFrame(() => {
      detectStyles();
    });
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
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
    >
      {/* Toggle Dark Editor */}
      <div className="text-editor-toggle">
        <span>Background Editor Gelap</span>
        <InputSwitch
          checked={darkEditor}
          onChange={(e) => handleChange("darkEditor", e.value)}
        />
      </div>

      {/* Formatting Toolbar - Simple Layout */}
      <div className="text-editor-toolbar">
        {/* Row 1: Bold, Italic, Text Color, Background Color, Underline, Strikethrough, Link, Lists, Align */}
        <div className="toolbar-row">
          <button 
            className={`toolbar-btn ${currentBold ? "active" : ""}`}
            title="Bold"
            onMouseDown={(e) => {
              e.preventDefault();
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
          {/* Text Color Button */}
          <div className="toolbar-color-picker-wrapper word-style-color-picker" ref={colorPickerRef}>
            <button 
              className={`toolbar-btn-text-color ${showColorPicker ? "active" : ""}`}
              title="Font Color"
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
          {/* Background Color Button */}
          <div className="toolbar-color-picker-wrapper word-style-color-picker" ref={bgColorPickerRef}>
            <button 
              className={`toolbar-btn-bg-color ${showBgColorPicker ? "active" : ""}`}
              title="Text Highlight Color"
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
            className="toolbar-btn"
            title="Link"
            onClick={() => formatSelection("createLink", prompt("Enter URL:"))}
          >
            <Link size={16} />
          </button>
          <button 
            className="toolbar-btn"
            title="Numbered List"
            onClick={() => formatSelection("insertOrderedList")}
          >
            <ListOrdered size={16} />
          </button>
          <button 
            className="toolbar-btn"
            title="Bullet List"
            onClick={() => formatSelection("insertUnorderedList")}
          >
            <List size={16} />
          </button>
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

        {/* Row 2: Paragraph Style, Font Size */}
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
              value={displayedFontSize}
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                requestAnimationFrame(() => {
                  e.target.focus();
                });
              }}
              onFocus={(e) => {
                saveSelection();
              }}
              onInput={(e) => {
                // Allow typing directly - get value from input element
                const inputValue = e.target.value;
                const value = parseFloat(inputValue);
                if (!isNaN(value) && value >= 8 && value <= 200) {
                  const size = Math.round(value);
                  // Apply immediately when typing - this updates activeFontSize
                  applyFontSize(size);
                }
              }}
              onValueChange={(e) => {
                const size = e.value || displayedFontSize;
                if (size >= 8 && size <= 200) {
                  // Apply font size - this updates activeFontSize
                  applyFontSize(size);
                }
              }}
              onBlur={(e) => {
                // Ensure font size is applied when leaving input
                const size = displayedFontSize;
                if (size >= 8 && size <= 200) {
                  applyFontSize(size);
                }
              }}
              min={8}
              max={200}
              showButtons={true}
              suffix=" px"
              className="toolbar-input"
              placeholder="16"
              title="Font Size"
            />
          </div>
        </div>

        {/* Row 3: Font Family, Line Height, Image, Emoji */}
        <div className="toolbar-row">
          <Dropdown
            value={fontFamily}
            options={fontFamilyOptions}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => handleChange("fontFamily", e.value)}
            className="toolbar-dropdown"
            placeholder="Page Font"
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
          <button 
            className="toolbar-btn"
            title="Insert Image"
            onClick={() => {
              const url = prompt("Enter image URL:");
              if (url) {
                formatSelection("insertImage", url);
              }
            }}
          >
            <ImageIcon size={16} />
          </button>
          <button 
            className="toolbar-btn"
            title="Insert Emoji"
            onClick={() => {
              const emoji = prompt("Enter emoji:");
              if (emoji) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  range.deleteContents();
                  range.insertNode(document.createTextNode(emoji));
                  handleEditorInput();
                }
              }
            }}
          >
            <Smile size={16} />
          </button>
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
            requestAnimationFrame(() => {
            detectStyles();
              // Force another detect to ensure sync
              requestAnimationFrame(() => detectStyles());
            });
          }}
          onKeyUp={() => {
            requestAnimationFrame(() => {
              detectStyles();
              // Force another detect to ensure sync
              requestAnimationFrame(() => detectStyles());
            });
          }}
          onClick={(e) => {
            // Auto-detect styles when clicking
            requestAnimationFrame(() => {
              detectStyles();
              // Force another detect to ensure sync
              requestAnimationFrame(() => {
                detectStyles();
              const selection = window.getSelection();
              if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
                // User clicked but didn't select anything - clear saved selection
                savedSelectionRef.current = null;
                } else {
                  // User has selection - save it
                  saveSelection();
              }
              });
            });
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


