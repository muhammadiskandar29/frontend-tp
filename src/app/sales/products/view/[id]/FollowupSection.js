"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";

// Use Next.js proxy to avoid CORS
const BASE_URL = "/api";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
});

const FOLLOWUP_TABS = [
  { type: 1, label: "Follow Up 1" },
  { type: 2, label: "Follow Up 2" },
  { type: 3, label: "Follow Up 3" },
  { type: 4, label: "Follow Up 4" },
  { type: 5, label: "Register" },
  { type: 6, label: "Processing" },
  { type: 7, label: "Selesai" },
  { type: 8, label: "Upselling" },
  { type: 9, label: "Redirect" },
];

const AUTOTEXT_OPTIONS = [
  { label: "Pilih Autotext", value: "" },
  { label: "{{nama_customer}}", value: "{{nama_customer}}" },
  { label: "{{product_name}}", value: "{{product_name}}" },
  { label: "{{price}}", value: "{{price}}" },
  { label: "{{sales_name}}", value: "{{sales_name}}" },
];

// Mapping nama dari response ke type
const NAMA_TO_TYPE = {
  "Follow Up 1": 1,
  "Follow Up 2": 2,
  "Follow Up 3": 3,
  "Follow Up 4": 4,
  "Register": 5,
  "Processing": 6,
  "Selesai": 7,
  "Upselling": 8,
  "Redirect": 9,
};

export default function FollowupSection() {
  const params = useParams();
  const produkId = params.id;

  const [activeType, setActiveType] = useState(1);
  const [templates, setTemplates] = useState([]); // array lokal template
  const [text, setText] = useState("");
  const [eventValue, setEventValue] = useState("1d-09:00");
  const [autoSend, setAutoSend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedAutotext, setSelectedAutotext] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef(null);

  const insertAtCursor = (value) => {
    if (!value) return;
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => (prev || "") + value);
      return;
    }
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const newValue = `${before}${value}${after}`;
    setText(newValue);
    requestAnimationFrame(() => {
      const newPos = start + value.length;
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
    });
  };

  const handleInsertAutotext = () => {
    if (!selectedAutotext) {
      toast.error("Pilih autotext terlebih dahulu");
      return;
    }
    insertAtCursor(selectedAutotext);
  };

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData?.emoji;
    if (emoji) {
      insertAtCursor(emoji);
    }
  };

  // Fetch template follow-up per produk
  useEffect(() => {
    if (!produkId) return;
    
    setLoading(true);
    const token = localStorage.getItem("token");
    
    fetch(`${BASE_URL}/admin/template-follup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ produk_id: produkId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Map response data dengan menambahkan type berdasarkan nama
          const mappedTemplates = (data.data || []).map((tpl) => ({
            ...tpl,
            type: NAMA_TO_TYPE[tpl.nama] || null, // Map nama ke type
          }));
          setTemplates(mappedTemplates);
          console.log("✅ [FOLLOWUP] Templates loaded:", mappedTemplates);
        } else {
          console.error("❌ [FOLLOWUP] Failed to load templates:", data.message);
          toast.error(data.message || "Gagal memuat template");
        }
      })
      .catch((err) => {
        console.error("❌ [FOLLOWUP] Error fetching templates:", err);
        toast.error("Gagal memuat template followup");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [produkId]);

  // Update textarea dan event saat tab/type berubah
  useEffect(() => {
    // Cari template berdasarkan type yang sudah di-map, atau berdasarkan nama
    const tpl = templates.find((t) => {
      // Cek berdasarkan type yang sudah di-map
      if (t.type === activeType) return true;
      // Atau cek berdasarkan nama (fallback)
      const expectedName = FOLLOWUP_TABS.find((tab) => tab.type === activeType)?.label;
      return t.nama === expectedName;
    });
    
    if (tpl) {
      setText(tpl.text || "");
      setEventValue(tpl.event || "1d-09:00");
      setAutoSend(tpl.status === "1");
      console.log("✅ [FOLLOWUP] Template loaded for type", activeType, ":", tpl);
    } else {
      setText("");
      setEventValue("1d-09:00");
      setAutoSend(false);
      console.log("ℹ️ [FOLLOWUP] No template found for type", activeType);
    }
  }, [activeType, templates]);

  // Save template ke backend & update array lokal
  const handleSave = async () => {
    if (!text.trim()) {
      toast.error("Text tidak boleh kosong");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("token");
    
    const payload = {
      nama: FOLLOWUP_TABS.find((t) => t.type === activeType)?.label || "",
      produk: produkId,
      text: text.trim(),
      type: String(activeType),
      event: eventValue,
      status: autoSend ? "1" : "2", // 1 = aktif, 2 = nonaktif
    };

    console.log("🔵 [FOLLOWUP] Saving template:", payload);

    try {
      const res = await fetch(`${BASE_URL}/admin/template-follup/store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      console.log("🟡 [FOLLOWUP] Save response:", data);
      
      if (data.success) {
        // Update lokal array dengan data dari response
        const savedTemplate = {
          ...data.data,
          type: activeType, // Tambahkan type untuk mapping
          text: text.trim(),
          event: eventValue,
          status: autoSend ? "1" : "2",
        };
        
        setTemplates((prev) => {
          // Cari template yang sudah ada berdasarkan type atau nama
          const exists = prev.find((tpl) => {
            return tpl.type === activeType || 
                   tpl.nama === savedTemplate.nama ||
                   tpl.id === savedTemplate.id;
          });
          
          if (exists) {
            return prev.map((tpl) => {
              const isMatch = tpl.type === activeType || 
                            tpl.nama === savedTemplate.nama ||
                            tpl.id === savedTemplate.id;
              return isMatch ? savedTemplate : tpl;
            });
          } else {
            return [...prev, savedTemplate];
          }
        });
        
        console.log("✅ [FOLLOWUP] Template saved and updated locally");
        toast.success(data.message || "Template berhasil disimpan!");
      } else {
        console.error("❌ [FOLLOWUP] Save failed:", data.message);
        toast.error(data.message || "Gagal menyimpan template");
      }
    } catch (err) {
      console.error("❌ [FOLLOWUP] Error saving template:", err);
      toast.error("Gagal menyimpan template");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setText("");
    setEventValue("1d-09:00");
  };

  return (
    <div className="followup-card">
      {/* TOP TABS */}
      <div className="followup-tabs">
        {FOLLOWUP_TABS.map((t) => (
          <button
            key={t.type}
            className={`tab ${activeType === t.type ? "active" : ""}`}
            onClick={() => setActiveType(t.type)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TEXT AREA */}
      <label className="label">Pengaturan Text</label>
      <textarea
        ref={textareaRef}
        className="followup-textarea"
        rows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tulis template followup disini..."
      />

      <div className="control-row">
        {/* AUTOTEXT */}
        <div className="autotext-group">
          <select
            className="select-auto"
            value={selectedAutotext}
            onChange={(e) => setSelectedAutotext(e.target.value)}
          >
            {AUTOTEXT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="insert-btn"
            onClick={handleInsertAutotext}
            disabled={!selectedAutotext}
          >
            Insert
          </button>
        </div>

        <div className="emoji-wrapper">
          <button
            type="button"
            className={`btn-emoji ${showEmojiPicker ? "active" : ""}`}
            onClick={() => setShowEmojiPicker((prev) => !prev)}
          >
            😊
            <span>Emoticon</span>
          </button>
          {showEmojiPicker && (
            <div className="emoji-popover">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                height={320}
                width={280}
                searchDisabled={false}
                previewConfig={{ showPreview: false }}
                skinTonesDisabled
              />
            </div>
          )}
        </div>

        <button className="reset-text" onClick={handleReset}>
          Reset Text
        </button>
      </div>

      {/* SCHEDULE */}
      <div className="schedule-box">
        <label className="schedule-row">
          <input
            type="checkbox"
            checked={autoSend}
            onChange={() => setAutoSend(!autoSend)}
          />
          Enable Auto Send
        </label>

        <input
          type="text"
          className="select-channel"
          value={eventValue}
          onChange={(e) => setEventValue(e.target.value)}
          placeholder="3d-09:00"
        />
      </div>

      <button 
        className="save-btn" 
        onClick={handleSave}
        disabled={saving || loading}
      >
        {saving ? "Menyimpan..." : "Save"}
      </button>
      
      {loading && (
        <p style={{ textAlign: "center", color: "#666", marginTop: "10px" }}>
          Memuat template...
        </p>
      )}

      <style>{`
        .followup-card {
          background: white;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 3px 12px rgba(0,0,0,0.07);
          margin-top: 20px;
        }

        .followup-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .tab {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: #f7f7f7;
          border-radius: 8px;
          cursor: pointer;
        }

        .tab.active {
          background: #2563EB;
          color: white;
          border-color: #2563EB;
        }

        .label {
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
        }

        .followup-textarea {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #ddd;
          padding: 10px;
          font-size: 14px;
        }

        .control-row {
          display: flex;
          gap: 10px;
          margin-top: 10px;
          flex-wrap: wrap;
          align-items: flex-start;
          position: relative;
        }

        .autotext-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .btn-emoji,
        .insert-btn {
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-emoji.active {
          border-color: #2563EB;
          background: #EEF4FF;
          color: #2563EB;
        }

        .emoji-wrapper {
          position: relative;
        }

        .emoji-popover {
          position: absolute;
          top: 50px;
          right: 0;
          z-index: 30;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.15);
          padding: 6px;
        }

        .reset-text {
          margin-left: auto;
          background: none;
          color: #2563EB;
          cursor: pointer;
          border: none;
          font-weight: 600;
        }

        .schedule-box {
          margin-top: 20px;
          border-top: 1px solid #eee;
          padding-top: 15px;
        }

        .select-auto,
        .select-channel {
          border: 1px solid #ddd;
          padding: 6px 10px;
          border-radius: 8px;
        }

        .save-btn {
          margin-top: 20px;
          background: #2563EB;
          color: white;
          padding: 10px 18px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

