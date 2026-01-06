"use client";

import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
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

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { FontSize } from './extensions/FontSize';

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
  const textColorButtonRef = useRef(null);
  const bgColorButtonRef = useRef(null);
  const boldButtonRef = useRef(null);
  const italicButtonRef = useRef(null);
  const underlineButtonRef = useRef(null);
  const strikethroughButtonRef = useRef(null);
  
  // Legacy refs untuk backward compatibility (masih digunakan di beberapa fungsi)
  const editorRef = useRef(null);
  const editorViewRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const lastUsedStylesRef = useRef({
    fontSize: 16,
    color: "#000000",
    backgroundColor: "transparent",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none"
  });
  
  // ===== TIPTAP EDITOR SETUP =====
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      TextStyle, // WAJIB untuk Color extension
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize,
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true, // Enable multiple colors untuk highlight/background color
      }),
    ],
    content: content || '<p></p>',
    onUpdate: ({ editor }) => {
      // Export HTML on every change
      const html = editor.getHTML();
      flushSync(() => {
        handleChange("content", html);
      });
    },
    editorProps: {
      attributes: {
        class: 'rich-text-editor',
        style: `
          min-height: 200px;
          padding: 12px 14px;
          line-height: ${lineHeight};
          font-family: ${fontFamily !== "Page Font" ? fontFamily : "inherit"};
          color: ${textColor};
          text-align: ${textAlign};
          font-size: 16px;
        `,
      },
    },
  });

  // Update editor content when content prop changes externally
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHTML = editor.getHTML();
      // Only update if content changed externally (not from our own updates)
      if (currentHTML !== content) {
        editor.commands.setContent(content || '<p></p>');
      }
    }
  }, [content, editor]);

  // Sync button state dengan editor selection (untuk color buttons)
  useEffect(() => {
    if (!editor) return;

    const updateColorFromSelection = () => {
      try {
        // Get current text color dari editor selection
        const textStyleAttrs = editor.getAttributes('textStyle');
        
        // Update text color jika ada
        if (textStyleAttrs.color) {
          const color = textStyleAttrs.color;
          // Hanya update jika berbeda untuk avoid infinite loop
          if (currentTextColor !== color) {
            setCurrentTextColor(color);
            setSelectedColor(color);
            setDisplayedColor(color);
            
            // Update button visual
            requestAnimationFrame(() => {
              if (textColorButtonRef.current) {
                const btn = textColorButtonRef.current;
                const colorBar = btn.querySelector('.text-color-bar');
                if (colorBar) {
                  colorBar.style.backgroundColor = color;
                }
              }
            });
          }
        } else {
          // Jika tidak ada color attribute, gunakan default
          const defaultColor = "#000000";
          if (currentTextColor !== defaultColor) {
            setCurrentTextColor(defaultColor);
            setSelectedColor(defaultColor);
            setDisplayedColor(defaultColor);
            
            requestAnimationFrame(() => {
              if (textColorButtonRef.current) {
                const btn = textColorButtonRef.current;
                const colorBar = btn.querySelector('.text-color-bar');
                if (colorBar) {
                  colorBar.style.backgroundColor = defaultColor;
                }
              }
            });
          }
        }
        
        // Get current background color dari highlight extension
        const highlightAttrs = editor.getAttributes('highlight');
        if (highlightAttrs && highlightAttrs.color) {
          const bgColor = highlightAttrs.color;
          // Hanya update jika berbeda
          if (currentBgColor !== bgColor) {
            setCurrentBgColor(bgColor);
            setSelectedBgColor(bgColor);
            setDisplayedBgColor(bgColor);
            setActiveBgColor(bgColor);
            
            // Update button visual
            requestAnimationFrame(() => {
              if (bgColorButtonRef.current) {
                const btn = bgColorButtonRef.current;
                const bgColorBar = btn.querySelector('.bg-color-bar');
                if (bgColorBar) {
                  bgColorBar.style.backgroundColor = bgColor;
                }
              }
            });
          }
        } else {
          // Tidak ada highlight - set ke transparent
          const defaultBgColor = "transparent";
          if (currentBgColor !== defaultBgColor) {
            setCurrentBgColor(defaultBgColor);
            setSelectedBgColor("#FFFF00");
            setDisplayedBgColor(defaultBgColor);
            setActiveBgColor(defaultBgColor);
            
            requestAnimationFrame(() => {
              if (bgColorButtonRef.current) {
                const btn = bgColorButtonRef.current;
                const bgColorBar = btn.querySelector('.bg-color-bar');
                if (bgColorBar) {
                  bgColorBar.style.backgroundColor = "#FFFF00";
                }
              }
            });
          }
        }
      } catch (e) {
        // Ignore errors
      }
    };

    // Update saat selection berubah
    const handleUpdate = () => {
      updateColorFromSelection();
    };

    // Subscribe ke editor update events
    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);

    // Initial update
    updateColorFromSelection();

    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
    };
  }, [editor, currentTextColor, currentBgColor]);

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
    // CRITICAL: Use flushSync untuk immediate update ke canvas
    // Ini memastikan semua perubahan (content, lineHeight, fontFamily, textAlign, dll)
    // langsung terlihat di preview/canvas
    flushSync(() => {
      onUpdate?.({ ...data, [field]: value });
    });
  };

  // ===== TYPOGRAPHY STANDARD =====
  const TYPOGRAPHY_STANDARD = {
    defaultFontSize: 16,
    defaultLineHeight: 1.5,
    defaultFontFamily: "Page Font",
    defaultColor: "#000000",
    paragraphMargin: "0 0 0 0", // No margin between paragraphs (MS Word style)
  };

  // ===== PROSEMIRROR HELPER FUNCTIONS =====
  // Convert HTML string to ProseMirror document
  const htmlToProseMirror = (html) => {
    if (!html || html === "Text Baru") {
      html = "<p></p>";
    }
    
    // Create temporary container
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    // Parse HTML to ProseMirror document
    return DOMParser.fromSchema(prosemirrorSchema).parse(tempDiv);
  };

  // Convert ProseMirror document to HTML string
  const proseMirrorToHTML = (state) => {
    const fragment = DOMSerializer.fromSchema(prosemirrorSchema).serializeFragment(state.doc.content);
    const tempDiv = document.createElement("div");
    tempDiv.appendChild(fragment);
    return tempDiv.innerHTML || "<p></p>";
  };

  // Initialize ProseMirror editor
  const initializeProseMirror = () => {
    if (!editorRef.current) return;

    // Destroy existing editor if any
    if (editorViewRef.current) {
      editorViewRef.current.destroy();
      editorViewRef.current = null;
    }

    // Create initial state from HTML content
    const doc = htmlToProseMirror(content);
    
    // Plugin to track selection changes and update toolbar
    const selectionTrackerPlugin = new Plugin({
      view(editorView) {
        return {
          update(view, prevState) {
            // Update toolbar when selection changes
            if (prevState.selection !== view.state.selection) {
              updateToolbarState(view.state);
            }
          }
        };
      }
    });
    
    const state = EditorState.create({
      doc,
      schema: prosemirrorSchema,
      plugins: [
        history(),
        selectionTrackerPlugin,
        keymap({
          "Mod-z": undo,
          "Mod-y": redo,
          "Mod-Shift-z": redo
        }),
        keymap(baseKeymap)
      ]
    });

    // Create editor view
    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction: (transaction) => {
        const newState = view.state.apply(transaction);
        view.updateState(newState);
        
        // Update content on every change
        const html = proseMirrorToHTML(newState);
        flushSync(() => {
          handleChange("content", html);
        });
        
        // Update UI state (bold/underline buttons)
        updateToolbarState(newState);
      }
    });

    editorViewRef.current = view;
  };

  // Update toolbar button states based on current selection
  const updateToolbarState = (state) => {
    if (!state) return;
    
    const { from, to, empty } = state.selection;
    
    // Check if bold is active
    // For collapsed selection, check storedMarks. For range, check if mark exists in range
    let boldActive = false;
    if (empty && state.storedMarks) {
      boldActive = state.storedMarks.some(m => m.type === prosemirrorSchema.marks.bold);
    } else if (!empty) {
      boldActive = state.doc.rangeHasMark(from, to, prosemirrorSchema.marks.bold);
    }
    
    setCurrentBold(boldActive);
    setDisplayedBold(boldActive);
    setActiveBold(boldActive);
    
    // Check if underline is active
    let underlineActive = false;
    if (empty && state.storedMarks) {
      underlineActive = state.storedMarks.some(m => m.type === prosemirrorSchema.marks.underline);
    } else if (!empty) {
      underlineActive = state.doc.rangeHasMark(from, to, prosemirrorSchema.marks.underline);
    }
    
    setCurrentUnderline(underlineActive);
    setDisplayedUnderline(underlineActive);
    setActiveUnderline(underlineActive);
  };
  
  // ===== SANITIZE HTML: Clean paste and normalize structure =====
  const sanitizeHTML = (html) => {
    if (!html) return "<p></p>";
    
    // Create temporary container
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    // Remove unwanted tags and attributes
    const unwantedTags = ["script", "style", "meta", "link", "iframe", "object", "embed"];
    unwantedTags.forEach(tag => {
      const elements = tempDiv.querySelectorAll(tag);
      elements.forEach(el => el.remove());
    });
    
    // Normalize structure: ensure all content is in <p> tags
    const normalizeStructure = (container) => {
      const children = Array.from(container.childNodes);
      let currentP = null;
      
      children.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim();
          if (text) {
            if (!currentP) {
              currentP = document.createElement("p");
              container.appendChild(currentP);
            }
            currentP.appendChild(document.createTextNode(text));
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === "P") {
            // Already a paragraph, keep it
            currentP = null; // Reset for next content
            container.appendChild(node);
          } else if (node.tagName === "BR") {
            // Line break - create new paragraph
            if (currentP) {
              currentP.appendChild(node);
            }
            currentP = null; // Next content goes to new paragraph
          } else if (node.tagName === "DIV") {
            // Convert div to paragraph
            const newP = document.createElement("p");
            while (node.firstChild) {
              newP.appendChild(node.firstChild);
            }
            container.appendChild(newP);
            currentP = null;
          } else if (["SPAN", "STRONG", "B", "EM", "I", "U", "S"].includes(node.tagName)) {
            // Inline elements - add to current paragraph or create one
            if (!currentP) {
              currentP = document.createElement("p");
              container.appendChild(currentP);
            }
            currentP.appendChild(node);
          } else {
            // Other block elements - create paragraph for them
            const newP = document.createElement("p");
            newP.appendChild(node);
            container.appendChild(newP);
            currentP = null;
          }
        }
      });
      
      // If no paragraphs created, create empty one
      if (container.children.length === 0) {
        container.appendChild(document.createElement("p"));
      }
    };
    
    normalizeStructure(tempDiv);
    
    // Clean up inline styles from paragraphs (keep only in spans)
    const paragraphs = tempDiv.querySelectorAll("p");
    paragraphs.forEach(p => {
      // Remove inline styles from paragraph itself
      p.removeAttribute("style");
      // Ensure paragraph has no margin/padding
      p.style.margin = TYPOGRAPHY_STANDARD.paragraphMargin;
      p.style.padding = "0";
    });
    
    // Clean up empty paragraphs (except last one)
    const allParagraphs = tempDiv.querySelectorAll("p");
    for (let i = 0; i < allParagraphs.length - 1; i++) {
      const p = allParagraphs[i];
      if (!p.textContent.trim() && p.children.length === 0) {
        p.remove();
      }
    }
    
    return tempDiv.innerHTML || "<p></p>";
  };
  
  // Rich text editor handlers
  const handleEditorInput = () => {
    if (editorRef.current) {
      // DON'T sanitize on every input - only on paste/load
      // Let browser handle normal typing naturally
      const html = editorRef.current.innerHTML;
      
      // CRITICAL: Update content FIRST - INSTANT, no delay
      // Ini memastikan perubahan langsung terlihat di preview/canvas
      flushSync(() => {
        handleChange("content", html);
      });
      
      // Detect styles AFTER content update - run in background, don't block canvas update
      // Use setTimeout with 0 delay to run after current execution, but don't delay content update
      setTimeout(() => {
        detectStyles();
      }, 0);
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
              
              // Check if DOM styles match ACTIVE STATE
              // Jika style sudah sesuai, tidak perlu create marker - biarkan browser handle naturally
              const fontSizeDiff = Math.abs(currentFontSize - activeFontSize);
              const fontSizeNeedsUpdate = fontSizeDiff > 1;
              
              // Convert fontWeight to boolean for comparison
              const isCurrentBold = currentFontWeight === "bold" || 
                                   currentFontWeight === "700" || 
                                   currentFontWeight === "600" ||
                                   (parseInt(currentFontWeight) >= 600 && parseInt(currentFontWeight) <= 900);
              
              const needsUpdate = 
                fontSizeNeedsUpdate ||
                (currentColorHex && currentColorHex !== activeColorHex) ||
                (isCurrentBold !== activeBold) ||
                (currentFontStyle === "italic") !== activeItalic ||
                (currentTextDecoration.includes("underline")) !== activeUnderline ||
                (currentTextDecoration.includes("line-through")) !== activeStrikethrough;
              
              // If styles don't match ACTIVE STATE, create style marker with ACTIVE STATE
              // Tapi hanya jika benar-benar berbeda - jangan force jika sudah sesuai
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
    
    // Allow Enter to create new paragraph (MS Word style - CONSISTENT)
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
        
        // Create new paragraph - NO inline styles on paragraph (MS Word style)
        // Styles only in spans inside paragraph
        const newP = document.createElement("p");
        newP.style.margin = TYPOGRAPHY_STANDARD.paragraphMargin;
        newP.style.padding = "0";
        
        // Create style marker with ACTIVE styles for next typing
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
        newP.appendChild(span);
        
        // Insert new paragraph
        if (currentP && currentP.tagName === "P") {
          // Split paragraph: move content after cursor to new paragraph
          const afterRange = range.cloneRange();
          afterRange.setStart(range.startContainer, range.startOffset);
          afterRange.setEndAfter(currentP);
          
          if (!afterRange.collapsed) {
            const fragment = afterRange.extractContents();
            // Move fragment content to new paragraph (after style marker)
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
        newRange.setStart(span, 0);
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
        setTimeout(() => detectStyles(), 0);
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

  // applyTextColor lama dihapus - menggunakan versi Tiptap di bawah

  // applyBgColor lama dihapus - menggunakan versi Tiptap di bawah

  // applyFontSize lama dihapus - menggunakan versi Tiptap di bawah

  // Initialize ProseMirror editor
  useEffect(() => {
    if (editorRef.current) {
      initializeProseMirror();
      
      // Cleanup on unmount
      return () => {
        if (editorViewRef.current) {
          editorViewRef.current.destroy();
          editorViewRef.current = null;
        }
      };
    }
  }, []);

  // Re-initialize editor when content changes externally (but avoid infinite loop)
  useEffect(() => {
    if (editorViewRef.current && editorRef.current && content !== undefined) {
      const currentHTML = proseMirrorToHTML(editorViewRef.current.state);
      // Only re-initialize if content changed externally (not from our own updates)
      // Use a small delay to avoid race conditions
      const timeoutId = setTimeout(() => {
        if (editorViewRef.current) {
          const newHTML = proseMirrorToHTML(editorViewRef.current.state);
          if (newHTML !== content && content !== undefined) {
            initializeProseMirror();
          }
          }
        }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [content]);
  
  // REMOVED: useEffect that normalizes paragraphs on every content change
  // This was too aggressive and caused typing issues
  // Only normalize on initial load and paste

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
    
    // For selection, check all nodes in selection for more accurate detection
    if (!range.collapsed) {
      // Check multiple nodes in selection for mixed styles
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
      
      let hasBold = false;
      let hasItalic = false;
      let hasUnderline = false;
      let hasStrikethrough = false;
      let allBold = true;
      let allItalic = true;
      let allUnderline = true;
      let allStrikethrough = true;
      let foundAnyNode = false;
      
      let checkNode;
      while (checkNode = walker.nextNode()) {
        if (checkNode.nodeType === Node.ELEMENT_NODE) {
          foundAnyNode = true;
          const computedStyle = window.getComputedStyle(checkNode);
          const fontWeight = computedStyle.fontWeight;
          const isBold = fontWeight === "bold" || fontWeight === "700" || fontWeight === "600" ||
                        (parseInt(fontWeight) >= 600 && parseInt(fontWeight) <= 900) ||
                        checkNode.tagName === "B" || checkNode.tagName === "STRONG" ||
                        (checkNode.style && checkNode.style.fontWeight && 
                         (checkNode.style.fontWeight === "bold" || parseInt(checkNode.style.fontWeight) >= 600));
          
          const isItalic = computedStyle.fontStyle === "italic" || checkNode.tagName === "I" || checkNode.tagName === "EM";
          const textDecoration = computedStyle.textDecoration || checkNode.style.textDecoration || "";
          const isUnderline = textDecoration.includes("underline") || checkNode.tagName === "U";
          const isStrikethrough = textDecoration.includes("line-through") || checkNode.tagName === "S" || checkNode.tagName === "STRIKE";
          
          if (isBold) hasBold = true; else allBold = false;
          if (isItalic) hasItalic = true; else allItalic = false;
          if (isUnderline) hasUnderline = true; else allUnderline = false;
          if (isStrikethrough) hasStrikethrough = true; else allStrikethrough = false;
          
          // Check font size from first element with fontSize
          if (detectedFontSize === null && checkNode.style && checkNode.style.fontSize) {
            const fontSize = parseInt(checkNode.style.fontSize);
            if (!isNaN(fontSize) && fontSize > 0) {
              detectedFontSize = fontSize;
            }
          }
        }
      }
      
      // For selection, use "all" logic: if all nodes have the style, consider it active
      // This matches MS Word behavior
      if (foundAnyNode) {
        detectedBold = allBold && hasBold;
        detectedItalic = allItalic && hasItalic;
        detectedUnderline = allUnderline && hasUnderline;
        detectedStrikethrough = allStrikethrough && hasStrikethrough;
      }
    }
    
    // Use queryCommandState for collapsed cursor or as fallback
    if (range.collapsed || (!detectedBold && !detectedItalic && !detectedUnderline && !detectedStrikethrough)) {
      try {
        if (!detectedBold) detectedBold = document.queryCommandState("bold");
        if (!detectedItalic) detectedItalic = document.queryCommandState("italic");
        if (!detectedUnderline) detectedUnderline = document.queryCommandState("underline");
        if (!detectedStrikethrough) detectedStrikethrough = document.queryCommandState("strikeThrough");
      } catch (e) {
        // queryCommandState not available, use manual detection
      }
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
    
    // ===== CRITICAL: detectStyles() SELALU update active state berdasarkan style di posisi cursor =====
    // Ini memastikan ketika user pindah cursor, active state mengikuti style yang ada
    // Sehingga ketika typing, akan menggunakan style yang sesuai dengan posisi cursor
    
    // Update displayed states (untuk UI button/input display)
    setDisplayedBold(detectedBold);
    setDisplayedItalic(detectedItalic);
    setDisplayedUnderline(detectedUnderline);
    setDisplayedStrikethrough(detectedStrikethrough);
    
    // Update displayed font size - gunakan detected jika ada
    if (detectedFontSize !== null) {
      setDisplayedFontSize(detectedFontSize);
    } else {
      // Jika tidak ada detected, tetap gunakan active state (jangan reset ke default)
      setDisplayedFontSize(activeFontSize);
    }
    
    // Update displayed colors - gunakan detected jika ada, jika tidak gunakan active state
    if (hexTextColor) {
      setDisplayedColor(hexTextColor);
    } else {
      setDisplayedColor(activeColor);
    }
    if (hexBgColor) {
      setDisplayedBgColor(hexBgColor);
    } else {
      setDisplayedBgColor(activeBgColor);
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
    
    // ===== SELALU UPDATE ACTIVE STATE berdasarkan style yang terdeteksi =====
    // Ini memastikan active state selalu mengikuti style di posisi cursor
    // Ketika user pindah cursor, active state akan update otomatis
    // Ketika user typing, akan menggunakan style yang sesuai dengan posisi cursor
    
    // Update active font size - gunakan detected jika ada, jika tidak tetap active state
    if (detectedFontSize !== null) {
      setActiveFontSize(detectedFontSize);
    }
    // Jika tidak ada detected, tetap gunakan active state (jangan reset ke default)
    
    // Update active text color - gunakan detected jika ada, jika tidak tetap active state
    if (hexTextColor) {
      setActiveColor(hexTextColor);
    }
    // Jika tidak ada detected, tetap gunakan active state (jangan reset ke default)
    
    // Update active background color - gunakan detected jika ada, jika tidak tetap active state
    if (hexBgColor) {
      setActiveBgColor(hexBgColor);
    }
    // Jika tidak ada detected, tetap gunakan active state (jangan reset ke default)
    
    // Update active text styles
    setActiveBold(detectedBold);
    setActiveItalic(detectedItalic);
    setActiveUnderline(detectedUnderline);
    setActiveStrikethrough(detectedStrikethrough);
    
    // Update lastUsedStylesRef untuk konsistensi
    if (detectedFontSize !== null) {
      lastUsedStylesRef.current.fontSize = detectedFontSize;
    }
    if (hexTextColor) {
      lastUsedStylesRef.current.color = hexTextColor;
    }
    if (hexBgColor) {
      lastUsedStylesRef.current.backgroundColor = hexBgColor;
    }
    lastUsedStylesRef.current.fontWeight = detectedBold ? "bold" : "normal";
    lastUsedStylesRef.current.fontStyle = detectedItalic ? "italic" : "normal";
    lastUsedStylesRef.current.textDecoration = detectedUnderline ? "underline" : (detectedStrikethrough ? "line-through" : "none");
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

  // Sync underline button visual with currentUnderline state
  useEffect(() => {
    if (underlineButtonRef.current) {
      const btn = underlineButtonRef.current;
      
      if (currentUnderline) {
        // Activate button
        btn.classList.add('active');
        btn.style.setProperty('background-color', '#F1A124', 'important');
        btn.style.setProperty('border-color', '#F1A124', 'important');
        btn.style.setProperty('color', '#ffffff', 'important');
      } else {
        // Deactivate button - FORCE REMOVE all active styles
        btn.classList.remove('active');
        const baseClass = 'toolbar-btn';
        btn.className = baseClass;
        btn.style.removeProperty('background-color');
        btn.style.removeProperty('border-color');
        btn.style.removeProperty('color');
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
        btn.style.color = '';
        btn.style.setProperty('background-color', '', 'important');
        btn.style.setProperty('border-color', '', 'important');
        btn.style.setProperty('color', '', 'important');
      }
      
      // Force immediate visual update
      void btn.offsetHeight;
    }
  }, [currentUnderline]);

  // Sync strikethrough button visual with currentStrikethrough state
  useEffect(() => {
    if (strikethroughButtonRef.current) {
      const btn = strikethroughButtonRef.current;
      
      if (currentStrikethrough) {
        // Activate button
        btn.classList.add('active');
        btn.style.setProperty('background-color', '#F1A124', 'important');
        btn.style.setProperty('border-color', '#F1A124', 'important');
        btn.style.setProperty('color', '#ffffff', 'important');
      } else {
        // Deactivate button - FORCE REMOVE all active styles
        btn.classList.remove('active');
        const baseClass = 'toolbar-btn';
        btn.className = baseClass;
        btn.style.removeProperty('background-color');
        btn.style.removeProperty('border-color');
        btn.style.removeProperty('color');
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
        btn.style.color = '';
        btn.style.setProperty('background-color', '', 'important');
        btn.style.setProperty('border-color', '', 'important');
        btn.style.setProperty('color', '', 'important');
      }
      
      // Force immediate visual update
      void btn.offsetHeight;
    }
  }, [currentStrikethrough]);

  // ===== TIPTAP FORMATTING FUNCTIONS =====
  // Toggle Bold - menggunakan editor.chain() untuk stabilitas
  const toggleBold = (e) => {
    if (e) e.preventDefault();
    if (!editor) return;
    
    editor.chain().focus().toggleBold().run();
  };

  // Toggle Italic
  const toggleItalic = (e) => {
    if (e) e.preventDefault();
    if (!editor) return;
    
    editor.chain().focus().toggleItalic().run();
  };

  // Toggle Underline
  const toggleUnderline = (e) => {
    if (e) e.preventDefault();
    if (!editor) return;
    
    editor.chain().focus().toggleUnderline().run();
  };

  // Toggle Strikethrough
  const toggleStrikethrough = (e) => {
    if (e) e.preventDefault();
    if (!editor) return;
    
    editor.chain().focus().toggleStrike().run();
  };

  // Apply Font Size
  const applyFontSize = (size) => {
    if (!editor) return;
    
    editor.chain().focus().setFontSize(`${size}px`).run();
  };

  // Apply Text Color - dengan update state yang stabil
  const applyTextColor = (color) => {
    if (!editor) return;
    
    // Apply color ke editor
    editor.chain().focus().setColor(color).run();
    
    // Update React state untuk button visual
    flushSync(() => {
      setCurrentTextColor(color);
      setSelectedColor(color);
      setActiveColor(color);
      setDisplayedColor(color);
    });
    
    // Update button visual langsung
    if (textColorButtonRef.current) {
      const btn = textColorButtonRef.current;
      const colorBar = btn.querySelector('.text-color-bar');
      if (colorBar) {
        colorBar.style.backgroundColor = color;
      }
    }
    
    setShowColorPicker(false);
    setShowMoreColors(false);
  };

  // Apply Background Color - menggunakan Highlight extension (CARA BENAR)
  const applyBgColor = (color) => {
    if (!editor) return;
    
    const bgColorValue = color === "transparent" ? "transparent" : color;
    
    // Focus editor dulu
    editor.chain().focus();
    
    const { from, to } = editor.state.selection;
    const isEmpty = from === to;
    
    if (isEmpty) {
      // No selection - set highlight untuk next typing
      // Jika sudah ada highlight dengan color yang sama, remove
      // Jika belum atau color berbeda, set untuk next typing
      const currentHighlight = editor.getAttributes('highlight');
      if (currentHighlight && currentHighlight.color === color) {
        // Remove highlight jika color sama
        editor.chain().toggleHighlight().run();
      }
      // Untuk next typing, highlight akan diterapkan dengan color yang dipilih
    } else {
      // Ada selection - apply atau remove highlight
      if (color === "transparent") {
        // Remove highlight
        editor.chain().focus().unsetHighlight().run();
          } else {
        // Apply highlight dengan color menggunakan toggleHighlight
        // toggleHighlight({ color }) akan apply color jika belum ada, atau remove jika sudah ada dengan color yang sama
        const currentHighlight = editor.getAttributes('highlight');
        if (currentHighlight && currentHighlight.color === color) {
          // Jika sudah ada highlight dengan color yang sama, remove
          editor.chain().focus().unsetHighlight().run();
        } else {
          // Apply highlight dengan color baru
          editor.chain().focus().toggleHighlight({ color: color }).run();
        }
      }
    }
    
    // Update React state untuk button visual - PENTING untuk stabilitas
    flushSync(() => {
      setCurrentBgColor(bgColorValue);
      setSelectedBgColor(color === "transparent" ? "#FFFF00" : color);
      setActiveBgColor(bgColorValue);
      setDisplayedBgColor(bgColorValue);
    });
    
    // Update button visual langsung - PENTING untuk immediate feedback
    requestAnimationFrame(() => {
      if (bgColorButtonRef.current) {
        const btn = bgColorButtonRef.current;
        const bgColorBar = btn.querySelector('.bg-color-bar');
        if (bgColorBar) {
          bgColorBar.style.backgroundColor = color === "transparent" ? "#FFFF00" : color;
        }
        // Force reflow untuk immediate visual update
        void btn.offsetHeight;
      }
    });
    
    setShowBgColorPicker(false);
    setShowMoreBgColors(false);
  };

  // Legacy toggleBold code removed - replaced with ProseMirror version above
  const toggleBold_OLD = (e) => {
    if (e) e.preventDefault();
    if (!editorRef.current) return;
    
    // ===== STEP 1: Get current state FIRST =====
    const selection = window.getSelection();
    let range = null;
    
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) {
        range = null;
      }
    }
    
    if (!range && savedSelectionRef.current) {
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
    
    if (!range) {
      range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // Check current bold state
    let isCurrentlyBold = activeBold;
    
    if (range.collapsed) {
      let node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }
      if (node.tagName === "SPAN" && (node.textContent === "\u200B" || node.innerHTML === "\u200B")) {
        const fontWeight = node.style.fontWeight || window.getComputedStyle(node).fontWeight;
        isCurrentlyBold = fontWeight === "bold" || fontWeight === "700" || (parseInt(fontWeight) >= 600);
      }
    } else {
      try {
        isCurrentlyBold = document.queryCommandState("bold");
      } catch (e) {
        let node = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentElement;
        }
        const fontWeight = window.getComputedStyle(node).fontWeight;
        isCurrentlyBold = fontWeight === "bold" || fontWeight === "700" || (parseInt(fontWeight) >= 600);
      }
    }
    
    const newBoldState = !isCurrentlyBold;
    
    // ===== STEP 2: Update React State FIRST with flushSync =====
    // Update React state FIRST to sync className, then update DOM
    flushSync(() => {
      setActiveBold(newBoldState);
      setDisplayedBold(newBoldState);
      setCurrentBold(newBoldState);
    });
    
    // ===== STEP 3: Update Button Visual DIRECTLY (INSTANT - no delay) =====
    // Update button DIRECTLY via DOM - after React state update
    if (boldButtonRef.current) {
      const btn = boldButtonRef.current;
      
      if (newBoldState) {
        // Activate button
        btn.classList.add('active');
        btn.style.setProperty('background-color', '#F1A124', 'important');
        btn.style.setProperty('border-color', '#F1A124', 'important');
        btn.style.setProperty('color', '#ffffff', 'important');
      } else {
        // Deactivate button - FORCE REMOVE all active styles
        // Remove class first
        btn.classList.remove('active');
        // Also update className directly - remove 'active' completely and keep only base class
        const baseClass = 'toolbar-btn';
        btn.className = baseClass;
        // Remove all inline styles - multiple methods to ensure it works
        btn.style.removeProperty('background-color');
        btn.style.removeProperty('border-color');
        btn.style.removeProperty('color');
        // Clear style properties
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
        btn.style.color = '';
        // Force override with empty using important to override any CSS
        btn.style.setProperty('background-color', '', 'important');
        btn.style.setProperty('border-color', '', 'important');
        btn.style.setProperty('color', '', 'important');
      }
      
      // Force immediate visual update
      void btn.offsetHeight;
    }
    
    // Focus editor
    editorRef.current.focus();
    
    // ===== STEP 3: Apply to Editor =====
    if (range.collapsed) {
      // Collapsed cursor
      let node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }
      
      const isInStyleMarker = node.tagName === "SPAN" && 
        (node.textContent === "\u200B" || node.innerHTML === "\u200B");
      
      if (isInStyleMarker) {
        // Update existing marker
        node.style.fontWeight = newBoldState ? "bold" : "normal";
        node.style.fontSize = `${activeFontSize}px`;
        node.style.color = activeColor;
        node.style.fontStyle = activeItalic ? "italic" : "normal";
        node.style.textDecoration = activeUnderline ? "underline" : (activeStrikethrough ? "line-through" : "none");
        if (activeUnderline) {
          node.style.setProperty("text-decoration-color", activeColor, "important");
          node.style.setProperty("-webkit-text-decoration-color", activeColor, "important");
        }
        if (activeBgColor !== "transparent") {
          node.style.backgroundColor = activeBgColor;
        } else {
          node.style.backgroundColor = "";
        }
        
        const newRange = document.createRange();
        newRange.setStartAfter(node);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        savedSelectionRef.current = {
          range: newRange.cloneRange(),
          startContainer: newRange.startContainer,
          startOffset: newRange.startOffset,
          endContainer: newRange.endContainer,
          endOffset: newRange.endOffset,
          collapsed: true,
          text: ""
        };
      } else {
        // Create new style marker with VISIBLE placeholder for visual feedback
        const span = document.createElement("span");
        span.style.fontSize = `${activeFontSize}px`;
        span.style.color = newBoldState ? activeColor : activeColor; // Keep color
        span.style.fontWeight = newBoldState ? "bold" : "normal";
        span.style.fontStyle = activeItalic ? "italic" : "normal";
        span.style.textDecoration = activeUnderline ? "underline" : (activeStrikethrough ? "line-through" : "none");
        if (activeUnderline) {
          span.style.setProperty("text-decoration-color", activeColor, "important");
          span.style.setProperty("-webkit-text-decoration-color", activeColor, "important");
        }
        if (activeBgColor !== "transparent") {
          span.style.backgroundColor = activeBgColor;
        }
        
        // Insert visible placeholder character that will be replaced when typing
        // Use a very thin space that's barely visible but shows the style
        span.innerHTML = "\u2009"; // Thin space (more visible than zero-width)
        
        range.insertNode(span);
        
        // Force immediate visual update
        void span.offsetHeight;
        
        const newRange = document.createRange();
        newRange.setStart(span, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        savedSelectionRef.current = {
          range: newRange.cloneRange(),
          startContainer: newRange.startContainer,
          startOffset: newRange.startOffset,
          endContainer: newRange.endContainer,
          endOffset: newRange.endOffset,
          collapsed: true,
          text: ""
        };
        
        // Replace thin space with zero-width space after a brief moment (for next typing)
        setTimeout(() => {
          if (span && span.textContent === "\u2009") {
            span.innerHTML = "\u200B";
          }
        }, 100);
      }
    } else {
      // Has selection
      document.execCommand("bold", false, null);
      
      try {
        const isNowBold = document.queryCommandState("bold");
        setActiveBold(isNowBold);
        setDisplayedBold(isNowBold);
        setCurrentBold(isNowBold);
        if (boldButtonRef.current) {
          if (isNowBold) {
            boldButtonRef.current.classList.add('active');
          } else {
            boldButtonRef.current.classList.remove('active');
          }
        }
      } catch (e) {
        // Keep state
      }
    }
    
    lastUsedStylesRef.current.fontWeight = newBoldState ? "bold" : "normal";
    handleEditorInput();
  };

  // toggleItalic lama dihapus - menggunakan versi Tiptap di bawah

  // ===== OPTIMIZED: Toggle Underline Function =====
  // ARCHITECTURE: Underline as context state, not DOM scan result
  // CURSOR: O(1) - state-based, no DOM scan
  // SELECTION: O(1) - only operate on extracted range contents
  
  // Helper: Get underline state at cursor (O(1) - no scan, single source of truth: data-u)
  const getUnderlineStateAtCursor = (range) => {
    if (range.collapsed) {
      const node = range.startContainer;
      const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
      // SINGLE SOURCE OF TRUTH: only check data-u attribute
      if (parent && parent.tagName === "SPAN") {
        return parent.hasAttribute("data-u");
      }
      // Fallback: check lastUsedStylesRef for context
      return lastUsedStylesRef.current.textDecoration === "underline";
    }
    return false;
  };
  
  // Helper: Apply underline to extracted contents (O(1) - wrap fragment)
  const applyUnderlineToContents = (fragment) => {
    const span = document.createElement("span");
    span.setAttribute("data-u", "1");
    span.style.textDecoration = "underline";
    
    // Move all nodes from fragment to span
    while (fragment.firstChild) {
      span.appendChild(fragment.firstChild);
    }
    
    fragment.appendChild(span);
    return fragment;
  };
  
  // Helper: Remove underline from extracted contents (O(n) - iterative, no recursion, single source: data-u)
  const removeUnderlineFromContents = (fragment) => {
    // Collect all underline spans first (iterative, not recursive)
    // SINGLE SOURCE OF TRUTH: only check data-u attribute
    const underlineSpans = [];
    const stack = Array.from(fragment.childNodes);
    
    while (stack.length > 0) {
      const node = stack.pop();
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SPAN") {
        if (node.hasAttribute("data-u")) {
          underlineSpans.push(node);
        }
        // Add children to stack (iterative, not recursive)
        stack.push(...Array.from(node.childNodes));
      }
    }
    
    // Process all underline spans (unwrap directly)
    underlineSpans.forEach(spanNode => {
      // Remove underline (single source: data-u)
      spanNode.removeAttribute("data-u");
      const textDecoration = spanNode.style.textDecoration || "";
      const newDecoration = textDecoration
        .split(" ")
        .filter(d => d !== "underline")
        .join(" ");
      
      if (newDecoration.trim()) {
        spanNode.style.textDecoration = newDecoration;
      } else {
        spanNode.style.textDecoration = "";
      }
      
      // Unwrap if span has no other styles
      if (!spanNode.style.fontSize && !spanNode.style.color && 
          !spanNode.style.fontWeight && !spanNode.style.fontStyle &&
          !spanNode.style.backgroundColor && !spanNode.style.textDecoration) {
        const parent = spanNode.parentNode;
        if (parent) {
          while (spanNode.firstChild) {
            parent.insertBefore(spanNode.firstChild, spanNode);
          }
          parent.removeChild(spanNode);
        }
      }
    });
    
    return fragment;
  };
  
  // Helper: Break underline context at cursor (O(1), single source: data-u)
  const breakUnderlineContext = (range, selection) => {
    const node = range.startContainer;
    const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    
    // SINGLE SOURCE OF TRUTH: only check data-u attribute
    if (parent && parent.tagName === "SPAN" && parent.hasAttribute("data-u")) {
      
      // Check if cursor is at end of underline span
      let isAtEnd = false;
      if (node.nodeType === Node.TEXT_NODE) {
        if (parent.lastChild === node && range.startOffset === node.textContent.length) {
          isAtEnd = true;
        }
      } else if (parent.childNodes.length === 0) {
        isAtEnd = true;
      }
      
      if (isAtEnd) {
        // Create boundary node AFTER underline span
        const boundary = document.createElement("span");
        boundary.innerHTML = "\u200B";
        
        if (parent.parentNode) {
          if (parent.nextSibling) {
            parent.parentNode.insertBefore(boundary, parent.nextSibling);
          } else {
            parent.parentNode.appendChild(boundary);
          }
          
          const newRange = document.createRange();
          newRange.setStart(boundary, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          savedSelectionRef.current = {
            range: newRange.cloneRange(),
            startContainer: newRange.startContainer,
            startOffset: newRange.startOffset,
            endContainer: newRange.endContainer,
            endOffset: newRange.endOffset,
            collapsed: true,
            text: ""
          };
        }
      } else {
        // Create style marker at cursor
        const marker = document.createElement("span");
        marker.innerHTML = "\u200B";
        range.insertNode(marker);
        
        const newRange = document.createRange();
        newRange.setStart(marker, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        savedSelectionRef.current = {
          range: newRange.cloneRange(),
          startContainer: newRange.startContainer,
          startOffset: newRange.startOffset,
          endContainer: newRange.endContainer,
          endOffset: newRange.endOffset,
          collapsed: true,
          text: ""
        };
      }
    }
  };
  
  // toggleUnderline lama dihapus - menggunakan versi Tiptap di bawah

  // ===== OPTIMIZED: Toggle Strikethrough Function =====
  // ARCHITECTURE: Strikethrough as context state, not DOM scan result
  // CURSOR: O(1) - state-based, no DOM scan
  // SELECTION: O(1) - only operate on extracted range contents
  
  // Helper: Get strikethrough state at cursor (O(1) - no scan, single source of truth: data-s)
  const getStrikethroughStateAtCursor = (range) => {
    if (range.collapsed) {
      const node = range.startContainer;
      const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
      // SINGLE SOURCE OF TRUTH: only check data-s attribute
      if (parent && parent.tagName === "SPAN") {
        return parent.hasAttribute("data-s");
      }
      // Fallback: check lastUsedStylesRef for context
      return lastUsedStylesRef.current.textDecoration && 
             lastUsedStylesRef.current.textDecoration.includes("line-through");
    }
    return false;
  };
  
  // Helper: Apply strikethrough to extracted contents (O(1) - wrap fragment)
  const applyStrikethroughToContents = (fragment) => {
    const span = document.createElement("span");
    span.setAttribute("data-s", "1");
    
    // Preserve underline if active
    const hasUnderline = activeUnderline || 
      (lastUsedStylesRef.current.textDecoration && 
       lastUsedStylesRef.current.textDecoration.includes("underline"));
    const textDecoration = hasUnderline ? "underline line-through" : "line-through";
    span.style.textDecoration = textDecoration;
    
    // Move all nodes from fragment to span
    while (fragment.firstChild) {
      span.appendChild(fragment.firstChild);
    }
    
    fragment.appendChild(span);
    return fragment;
  };
  
  // Helper: Remove strikethrough from extracted contents (O(n) - iterative, no recursion, single source: data-s)
  const removeStrikethroughFromContents = (fragment) => {
    // Collect all strikethrough spans first (iterative, not recursive)
    // SINGLE SOURCE OF TRUTH: only check data-s attribute
    const strikethroughSpans = [];
    const stack = Array.from(fragment.childNodes);
    
    while (stack.length > 0) {
      const node = stack.pop();
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SPAN") {
        if (node.hasAttribute("data-s")) {
          strikethroughSpans.push(node);
        }
        // Add children to stack (iterative, not recursive)
        stack.push(...Array.from(node.childNodes));
      }
    }
    
    // Process all strikethrough spans (unwrap directly)
    strikethroughSpans.forEach(spanNode => {
      // Remove strikethrough (single source: data-s)
      spanNode.removeAttribute("data-s");
      const textDecoration = spanNode.style.textDecoration || "";
      const newDecoration = textDecoration
        .split(" ")
        .filter(d => d !== "line-through")
        .join(" ");
      
      if (newDecoration.trim()) {
        spanNode.style.textDecoration = newDecoration;
      } else {
        spanNode.style.textDecoration = "";
      }
      
      // Unwrap if span has no other styles
      if (!spanNode.style.fontSize && !spanNode.style.color && 
          !spanNode.style.fontWeight && !spanNode.style.fontStyle &&
          !spanNode.style.backgroundColor && !spanNode.style.textDecoration) {
        const parent = spanNode.parentNode;
        if (parent) {
          while (spanNode.firstChild) {
            parent.insertBefore(spanNode.firstChild, spanNode);
          }
          parent.removeChild(spanNode);
        }
      }
    });
    
    return fragment;
  };
  
  // Helper: Break strikethrough context at cursor (O(1), single source: data-s)
  const breakStrikethroughContext = (range, selection) => {
    const node = range.startContainer;
    const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    
    // SINGLE SOURCE OF TRUTH: only check data-s attribute
    if (parent && parent.tagName === "SPAN" && parent.hasAttribute("data-s")) {
      
      // Check if cursor is at end of strikethrough span
      let isAtEnd = false;
      if (node.nodeType === Node.TEXT_NODE) {
        if (parent.lastChild === node && range.startOffset === node.textContent.length) {
          isAtEnd = true;
        }
      } else if (parent.childNodes.length === 0) {
        isAtEnd = true;
      }
      
      if (isAtEnd) {
        // Create boundary node AFTER strikethrough span
        const boundary = document.createElement("span");
        // Preserve underline if active
        const hasUnderline = activeUnderline || 
          (lastUsedStylesRef.current.textDecoration && 
           lastUsedStylesRef.current.textDecoration.includes("underline"));
        boundary.style.textDecoration = hasUnderline ? "underline" : "none";
        boundary.innerHTML = "\u200B";
        
        if (parent.parentNode) {
          if (parent.nextSibling) {
            parent.parentNode.insertBefore(boundary, parent.nextSibling);
          } else {
            parent.parentNode.appendChild(boundary);
          }
          
          const newRange = document.createRange();
          newRange.setStart(boundary, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          savedSelectionRef.current = {
            range: newRange.cloneRange(),
            startContainer: newRange.startContainer,
            startOffset: newRange.startOffset,
            endContainer: newRange.endContainer,
            endOffset: newRange.endOffset,
            collapsed: true,
            text: ""
          };
        }
      } else {
        // Create style marker at cursor
        const marker = document.createElement("span");
        // Preserve underline if active
        const hasUnderline = activeUnderline || 
          (lastUsedStylesRef.current.textDecoration && 
           lastUsedStylesRef.current.textDecoration.includes("underline"));
        marker.style.textDecoration = hasUnderline ? "underline" : "none";
        marker.innerHTML = "\u200B";
        range.insertNode(marker);
        
        const newRange = document.createRange();
        newRange.setStart(marker, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        savedSelectionRef.current = {
          range: newRange.cloneRange(),
          startContainer: newRange.startContainer,
          startOffset: newRange.startOffset,
          endContainer: newRange.endContainer,
          endOffset: newRange.endOffset,
          collapsed: true,
          text: ""
        };
      }
    }
  };
  
  // toggleStrikethrough lama dihapus - menggunakan versi Tiptap di bawah

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
            className={`toolbar-btn ${editor?.isActive('bold') ? "active" : ""}`}
            title="Bold"
            onClick={toggleBold}
            disabled={!editor}
          >
            <Bold size={16} />
          </button>
          <button 
            className={`toolbar-btn ${editor?.isActive('italic') ? "active" : ""}`}
            title="Italic"
            onClick={toggleItalic}
            disabled={!editor}
          >
            <Italic size={16} />
          </button>
          {/* Text Color Button */}
          <div className="toolbar-color-picker-wrapper word-style-color-picker" ref={colorPickerRef}>
            <button 
              ref={textColorButtonRef}
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
              ref={bgColorButtonRef}
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
            className={`toolbar-btn ${editor?.isActive('underline') ? "active" : ""}`}
            title="Underline"
            onClick={toggleUnderline}
            disabled={!editor}
          >
            <Underline size={16} />
          </button>
          <button 
            className={`toolbar-btn ${editor?.isActive('strike') ? "active" : ""}`}
            title="Strikethrough"
            onClick={toggleStrikethrough}
            disabled={!editor}
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
                // DON'T apply immediately on every keystroke - wait for enter or blur
                // Just update displayedFontSize for UI feedback
                const inputValue = e.target.value;
                const value = parseFloat(inputValue);
                if (!isNaN(value) && value >= 8 && value <= 200) {
                  const size = Math.round(value);
                  // Only update displayed value, don't apply yet
                  setDisplayedFontSize(size);
                }
              }}
              onValueChange={(e) => {
                const size = e.value || displayedFontSize;
                if (size >= 8 && size <= 200) {
                  // Apply font size when value changes (button click or enter)
                  applyFontSize(size);
                }
              }}
              onKeyDown={(e) => {
                // When user presses Enter, apply font size
                if (e.key === "Enter") {
                  e.preventDefault();
                  const inputValue = e.target.value;
                  const value = parseFloat(inputValue);
                  if (!isNaN(value) && value >= 8 && value <= 200) {
                    const size = Math.round(value);
                    applyFontSize(size);
                    // Keep focus on input after apply
                    e.target.focus();
                  }
                }
              }}
              onBlur={(e) => {
                // Ensure font size is applied when leaving input
                const inputValue = e.target.value;
                const value = parseFloat(inputValue);
                if (!isNaN(value) && value >= 8 && value <= 200) {
                  const size = Math.round(value);
                  applyFontSize(size);
                } else {
                  // If invalid, restore to last valid size
                  setDisplayedFontSize(activeFontSize);
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

      {/* Rich Text Editor Area - Tiptap */}
      <div className={`text-editor-area ${darkEditor ? 'dark' : ''}`}>
        <EditorContent editor={editor} />
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


