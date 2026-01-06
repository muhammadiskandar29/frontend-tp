"use client";

import { useState, useEffect, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { 
  Bold, Italic, Underline, Strikethrough, 
  Link, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Image as ImageIcon, Smile,
  Pencil, Trash2, Eye, Star
} from "lucide-react";
import ComponentWrapper from "./ComponentWrapper";

// ProseMirror imports
import { Schema, DOMParser, DOMSerializer } from "prosemirror-model";
import { EditorState, Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { toggleMark } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { history, redo, undo } from "prosemirror-history";
import { baseKeymap } from "prosemirror-commands";

export default function TestimoniComponent({ data = {}, onUpdate, onMoveUp, onMoveDown, onDelete, index, isExpanded, onToggleExpand }) {
  const componentTitle = data.componentTitle || "";
  const items = data.items || [];
  const [showImageActions, setShowImageActions] = useState({});
  const editorViewRefs = useRef({}); // ProseMirror EditorView instances
  
  // ===== PROSEMIRROR SCHEMA =====
  // Schema dasar: paragraph, text, marks (bold, underline)
  const prosemirrorSchema = new Schema({
    nodes: {
      doc: {
        content: "paragraph+"
      },
      paragraph: {
        content: "inline*",
        group: "block",
        parseDOM: [{ tag: "p" }],
        toDOM: () => ["p", 0]
      },
      text: {
        group: "inline"
      }
    },
    marks: {
      bold: {
        parseDOM: [
          { tag: "strong" },
          { tag: "b", getAttrs: () => ({}) },
          { style: "font-weight", getAttrs: (value) => /^(bold|bolder|[5-9]\d{2,})$/.test(value) && null }
        ],
        toDOM: () => ["strong", 0]
      },
      underline: {
        parseDOM: [
          { tag: "u" },
          { style: "text-decoration", getAttrs: (value) => value === "underline" && null }
        ],
        toDOM: () => ["u", 0]
      }
    }
  });

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

  // Initialize ProseMirror editor for a specific item
  const initializeProseMirror = (itemIndex, content) => {
    const editorElement = document.getElementById(`testimoni-editor-${itemIndex}`);
    if (!editorElement) return;

    // Destroy existing editor if any
    if (editorViewRefs.current[itemIndex]) {
      editorViewRefs.current[itemIndex].destroy();
      editorViewRefs.current[itemIndex] = null;
    }

    // Create initial state from HTML content
    const doc = htmlToProseMirror(content || "<p></p>");
    
    // Plugin to track selection changes and update toolbar
    const selectionTrackerPlugin = new Plugin({
      view(editorView) {
        return {
          update(view, prevState) {
            // Update toolbar when selection changes
            if (prevState.selection !== view.state.selection) {
              updateToolbarState(itemIndex, view.state);
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
    const view = new EditorView(editorElement, {
      state,
      dispatchTransaction: (transaction) => {
        const newState = view.state.apply(transaction);
        view.updateState(newState);
        
        // Update content on every change
        const html = proseMirrorToHTML(newState);
        updateTestimoni(itemIndex, "isiTestimony", html);
        
        // Update UI state (bold/underline buttons)
        updateToolbarState(itemIndex, newState);
      }
    });

    editorViewRefs.current[itemIndex] = view;
  };

  // Update toolbar button states based on current selection
  const updateToolbarState = (itemIndex, state) => {
    if (!state) return;
    
    const { from, to, empty } = state.selection;
    
    // Check if bold is active
    let boldActive = false;
    if (empty && state.storedMarks) {
      boldActive = state.storedMarks.some(m => m.type === prosemirrorSchema.marks.bold);
    } else if (!empty) {
      boldActive = state.doc.rangeHasMark(from, to, prosemirrorSchema.marks.bold);
    }
    
    // Check if underline is active
    let underlineActive = false;
    if (empty && state.storedMarks) {
      underlineActive = state.storedMarks.some(m => m.type === prosemirrorSchema.marks.underline);
    } else if (!empty) {
      underlineActive = state.doc.rangeHasMark(from, to, prosemirrorSchema.marks.underline);
    }
    
    // Update button visuals
    const editor = document.getElementById(`testimoni-editor-${itemIndex}`);
    if (editor) {
      // Find toolbar - it's in the same testimoni-item-content section
      const testimoniItem = editor.closest('.testimoni-item-content');
      if (testimoniItem) {
        const boldBtn = testimoniItem.querySelector('.toolbar-btn[title="Bold"]');
        if (boldBtn) {
          if (boldActive) {
            boldBtn.classList.add('active');
            boldBtn.style.setProperty('background-color', '#F1A124', 'important');
            boldBtn.style.setProperty('border-color', '#F1A124', 'important');
            boldBtn.style.setProperty('color', '#ffffff', 'important');
          } else {
            boldBtn.classList.remove('active');
            boldBtn.className = 'toolbar-btn';
            boldBtn.style.removeProperty('background-color');
            boldBtn.style.removeProperty('border-color');
            boldBtn.style.removeProperty('color');
          }
        }
        
        const underlineBtn = testimoniItem.querySelector('.toolbar-btn[title="Underline"]');
        if (underlineBtn) {
          if (underlineActive) {
            underlineBtn.classList.add('active');
            underlineBtn.style.setProperty('background-color', '#F1A124', 'important');
            underlineBtn.style.setProperty('border-color', '#F1A124', 'important');
            underlineBtn.style.setProperty('color', '#ffffff', 'important');
          } else {
            underlineBtn.classList.remove('active');
            underlineBtn.className = 'toolbar-btn';
            underlineBtn.style.removeProperty('background-color');
            underlineBtn.style.removeProperty('border-color');
            underlineBtn.style.removeProperty('color');
          }
        }
      }
    }
  };
  
  // Auto-expand all items by default
  const [expandedItems, setExpandedItems] = useState(() => {
    const expanded = new Set();
    items.forEach((_, i) => expanded.add(i));
    return expanded;
  });
  
  // Auto-expand new items when added
  useEffect(() => {
    const newExpanded = new Set(expandedItems);
    items.forEach((_, i) => {
      if (!newExpanded.has(i)) {
        newExpanded.add(i);
      }
    });
    if (newExpanded.size !== expandedItems.size) {
      setExpandedItems(newExpanded);
    }
  }, [items.length]);

  const handleChange = (field, value) => {
    onUpdate?.({ ...data, [field]: value });
  };

  const addTestimoni = () => {
    const newItems = [...items, { 
      gambar: "", 
      nama: "", 
      jabatan: "",
      isiTestimony: "<p></p>",
      showRating: true,
      rating: 5
    }];
    onUpdate?.({ ...data, items: newItems });
  };

  const removeTestimoni = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdate?.({ ...data, items: newItems });
  };

  const updateTestimoni = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate?.({ ...data, items: newItems });
  };


  const handleFileChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateTestimoni(index, "gambar", event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ProseMirror handles input automatically via dispatchTransaction
  // This function is kept for backward compatibility but no longer needed
  const handleEditorInput = (index) => {
    // ProseMirror handles content updates automatically in dispatchTransaction
    // No manual handling needed
  };

  // ProseMirror handles keydown automatically via keymap plugins
  // This function is kept for backward compatibility but no longer needed
  const handleEditorKeyDown = (index, e) => {
    // ProseMirror handles keyboard events via keymap plugins
    // No manual handling needed
  };

  // Format selection - use ProseMirror for Bold/Underline, execCommand for others
  const formatSelection = (index, command, value = null) => {
    // Use ProseMirror for Bold and Underline
    if (command === "bold") {
      if (!editorViewRefs.current[index]) return;
      const { state, dispatch } = editorViewRefs.current[index];
      const markType = prosemirrorSchema.marks.bold;
      toggleMark(markType)(state, dispatch);
      const newState = editorViewRefs.current[index].state;
      updateToolbarState(index, newState);
      return;
    }
    
    if (command === "underline") {
      if (!editorViewRefs.current[index]) return;
      const { state, dispatch } = editorViewRefs.current[index];
      const markType = prosemirrorSchema.marks.underline;
      toggleMark(markType)(state, dispatch);
      const newState = editorViewRefs.current[index].state;
      updateToolbarState(index, newState);
      return;
    }
    
    // For other commands, still use execCommand (not part of requirement)
    const editor = document.getElementById(`testimoni-editor-${index}`);
    if (!editor) return;
    
    editor.focus();
    document.execCommand(command, false, value);
    handleEditorInput(index);
  };

  // Initialize ProseMirror editors for all items
  useEffect(() => {
    const timeouts = [];
    
    items.forEach((item, i) => {
      // Initialize ProseMirror editor for this item
      const timeoutId = setTimeout(() => {
        initializeProseMirror(i, item.isiTestimony || item.deskripsi || "<p></p>");
      }, 50); // Small delay to ensure DOM is ready
      timeouts.push(timeoutId);
    });
    
    // Cleanup: destroy editors for items that no longer exist
    return () => {
      // Clear all timeouts
      timeouts.forEach(id => clearTimeout(id));
      
      // Destroy editors for items that no longer exist
      Object.keys(editorViewRefs.current).forEach(itemIndex => {
        const index = parseInt(itemIndex);
        if (index >= items.length) {
          // Item was removed, destroy its editor
          if (editorViewRefs.current[itemIndex]) {
            editorViewRefs.current[itemIndex].destroy();
            delete editorViewRefs.current[itemIndex];
          }
        }
      });
    };
  }, [items.length]); // Re-initialize when number of items changes

  // Update editors when item content changes externally (but avoid infinite loop)
  useEffect(() => {
    items.forEach((item, i) => {
      if (editorViewRefs.current[i]) {
        const content = item.isiTestimony || item.deskripsi || "<p></p>";
        if (content !== undefined) {
          const currentHTML = proseMirrorToHTML(editorViewRefs.current[i].state);
          // Only re-initialize if content changed externally (not from our own updates)
          if (currentHTML !== content) {
            const timeoutId = setTimeout(() => {
              initializeProseMirror(i, content);
            }, 100);
            return () => clearTimeout(timeoutId);
          }
        }
      }
    });
  }, [items.map((item, i) => `${i}:${item.isiTestimony || item.deskripsi || ''}`).join('|')]); // Re-initialize when content changes

  return (
    <ComponentWrapper
      title="Testimoni"
      index={index}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onDelete={onDelete}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
    >
      <div className="testimoni-component-content">
        {/* Judul Komponen */}
        <div className="form-field-group">
          <label className="form-label-small">Judul Komponen</label>
          <InputText
            value={componentTitle}
            onChange={(e) => handleChange("componentTitle", e.target.value)}
            placeholder="Cth: Yang akan Kamu Dapatkan"
            className="w-full form-input"
          />
        </div>

        {items.map((item, i) => {
          const isExpanded = expandedItems.has(i);
          const showActions = showImageActions[i] || false;

          return (
            <div key={i} className="testimoni-item-card">
              <div className="testimoni-item-header">
                <span className="testimoni-item-number">Testimoni {i + 1}</span>
                <div className="testimoni-item-header-actions">
                  <button
                    className="testimoni-move-btn"
                    onClick={() => {
                      if (i > 0) {
                        const newItems = [...items];
                        [newItems[i - 1], newItems[i]] = [newItems[i], newItems[i - 1]];
                        onUpdate?.({ ...data, items: newItems });
                      }
                    }}
                    disabled={i === 0}
                    title="Pindah ke atas"
                  >
                    ↑
                  </button>
                  <button
                    className="testimoni-move-btn"
                    onClick={() => {
                      if (i < items.length - 1) {
                        const newItems = [...items];
                        [newItems[i], newItems[i + 1]] = [newItems[i + 1], newItems[i]];
                        onUpdate?.({ ...data, items: newItems });
                      }
                    }}
                    disabled={i === items.length - 1}
                    title="Pindah ke bawah"
                  >
                    ↓
                  </button>
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    className="p-button-danger p-button-sm"
                    onClick={() => removeTestimoni(i)}
                    tooltip="Hapus testimoni"
                  />
                </div>
              </div>

              <div className="testimoni-item-content">
                  {/* Upload Foto */}
                  <div className="form-field-group">
                    <label className="form-label-small">Upload Foto</label>
                    {(item.gambar && (typeof item.gambar === 'string' || item.gambar.value)) ? (
                      <div className="uploaded-image-container">
                        <div 
                          className="uploaded-image-preview-box"
                          onMouseEnter={() => setShowImageActions({ ...showImageActions, [i]: true })}
                          onMouseLeave={() => setShowImageActions({ ...showImageActions, [i]: false })}
                        >
                          <img 
                            src={typeof item.gambar === 'string' ? item.gambar : URL.createObjectURL(item.gambar.value)} 
                            alt="Preview" 
                            className="uploaded-image-preview-img" 
                          />
                          {showActions && (
                            <div className="image-action-overlay">
                              <button className="image-action-btn" title="Edit">
                                <Pencil size={16} />
                              </button>
                              <button 
                                className="image-action-btn" 
                                title="Hapus" 
                                onClick={() => updateTestimoni(i, "gambar", "")}
                              >
                                <Trash2 size={16} />
                              </button>
                              <button className="image-action-btn" title="Lihat">
                                <Eye size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.gif,.heic"
                          onChange={(e) => handleFileChange(i, e)}
                          className="component-file-input"
                          id={`testimoni-image-replace-${i}`}
                        />
                        <label htmlFor={`testimoni-image-replace-${i}`} className="replace-image-label">
                          Ganti Gambar
                        </label>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.gif,.heic"
                          onChange={(e) => handleFileChange(i, e)}
                          className="component-file-input"
                          id={`testimoni-image-upload-${i}`}
                        />
                        <label htmlFor={`testimoni-image-upload-${i}`} className="component-upload-label">
                          <div className="upload-icon-wrapper">
                            <ImageIcon size={32} />
                          </div>
                          <span className="upload-text">Upload Foto</span>
                        </label>
                      </>
                    )}
                  </div>

                  {/* Nama */}
                  <div className="form-field-group">
                    <label className="form-label-small">
                      Nama <span className="required-asterisk">*</span>
                    </label>
                    <InputText
                      className="w-full form-input"
                      placeholder="Masukkan nama testimoni"
                      value={item.nama || ""}
                      onChange={(e) => updateTestimoni(i, "nama", e.target.value)}
                    />
                  </div>

                  {/* Jabatan / Pekerjaan */}
                  <div className="form-field-group">
                    <label className="form-label-small">Jabatan / Pekerjaan</label>
                    <InputText
                      className="w-full form-input"
                      placeholder="Masukkan jabatan atau pekerjaan"
                      value={item.jabatan || ""}
                      onChange={(e) => updateTestimoni(i, "jabatan", e.target.value)}
                    />
                  </div>

                  {/* Isi Testimony */}
                  <div className="form-field-group">
                    <label className="form-label-small">
                      Isi Testimony <span className="required-asterisk">*</span>
                    </label>
                    
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
                        <button 
                          className="toolbar-btn"
                          title="Link"
                          onClick={() => {
                            const url = prompt("Masukkan URL:");
                            if (url) formatSelection(i, "createLink", url);
                          }}
                        >
                          <Link size={16} />
                        </button>
                        <button 
                          className="toolbar-btn"
                          title="Bulleted List"
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
                    </div>

                    {/* Rich Text Editor Area - ProseMirror */}
                    <div className="text-editor-area">
                      <div
                        id={`testimoni-editor-${i}`}
                        className="rich-text-editor list-item-editor"
                        dir="ltr"
                        spellCheck={false}
                        style={{
                          minHeight: "100px",
                          padding: "12px 14px",
                          direction: "ltr",
                          textAlign: "left",
                          unicodeBidi: "embed",
                        }}
                      />
                    </div>
                  </div>

                  {/* Tampilkan Rating */}
                  <div className="form-field-group">
                    <div className="testimoni-rating-control">
                      <div className="testimoni-rating-toggle">
                        <InputSwitch
                          checked={item.showRating !== false}
                          onChange={(e) => updateTestimoni(i, "showRating", e.value)}
                        />
                        <label className="testimoni-rating-label">Tampilkan Rating</label>
                      </div>
                      {item.showRating !== false && (
                        <div className="testimoni-star-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className={`star-btn ${star <= (item.rating || 5) ? "filled" : ""}`}
                              onClick={() => updateTestimoni(i, "rating", star)}
                              title={`Rating ${star}`}
                            >
                              <Star 
                                size={20} 
                                fill={star <= (item.rating || 5) ? "#fbbf24" : "none"}
                                color="#fbbf24"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
              </div>
            </div>
          );
        })}

        <Button
          icon="pi pi-plus"
          label="Tambah Testimoni"
          className="add-item-btn"
          onClick={addTestimoni}
        />
      </div>
    </ComponentWrapper>
  );
}
