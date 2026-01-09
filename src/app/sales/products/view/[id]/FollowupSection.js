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

// Type yang perlu settingan jam/hari manual
const SCHEDULED_TYPES = [1, 2, 3, 4]; // Follow Up 1-4

// Type yang langsung kirim tanpa delay (instant send - trigger dari backend)
const INSTANT_SEND_TYPES = [5, 6, 7]; // Register, Processing, Selesai

// Type upselling: H+1 dari tanggal event produk (default, tidak bisa edit)
const UPSELLING_TYPE = 8;

// Type redirect (instant seperti lainnya)
const REDIRECT_TYPE = 9;

const AUTOTEXT_OPTIONS = [
  { label: "Pilih Autotext", value: "" },
  { label: "{{customer_name}}", value: "{{customer_name}}" },
  { label: "{{product_name}}", value: "{{product_name}}" },
  { label: "{{order_date}}", value: "{{order_date}}" },
  { label: "{{order_total}}", value: "{{order_total}}" },
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
  const [scheduleDay, setScheduleDay] = useState(1);
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [autoSend, setAutoSend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedAutotext, setSelectedAutotext] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef(null);

  const parseEventValue = (value = "1d-09:00") => {
    const [dayPart = "1d", timePart = "09:00"] = value.split("-");
    const dayNumber = Number(dayPart.replace(/[^0-9]/g, "")) || 0;
    const time = timePart?.trim() ? timePart : "09:00";
    return { days: dayNumber, time };
  };

  const formatEventValue = (days, time) => {
    const safeDay = Math.max(0, Number.isNaN(days) ? 0 : days);
    const safeTime = time || "09:00";
    return `${safeDay}d-${safeTime}`;
  };

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
    
    fetch(`${BASE_URL}/sales/template-follup`, {
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
      const eventVal = tpl.event || "1d-09:00";
      setEventValue(eventVal);
      // Parse eventValue ke scheduleDay dan scheduleTime
      const parsed = parseEventValue(eventVal);
      setScheduleDay(parsed.days);
      setScheduleTime(parsed.time);
      setAutoSend(tpl.status === "1");
      console.log("✅ [FOLLOWUP] Template loaded for type", activeType, ":", tpl, "| parsed event:", parsed);
    } else {
      setText("");
      // Set default value berdasarkan type
      if (SCHEDULED_TYPES.includes(activeType)) {
        // Type 1-4: Follow Up dengan jadwal manual
        setEventValue("1d-09:00");
        setScheduleDay(1);
        setScheduleTime("09:00");
      } else if (INSTANT_SEND_TYPES.includes(activeType)) {
        // Type 5, 6, 7: Instant send (trigger dari backend)
        setEventValue("0d-00:00");
        setScheduleDay(0);
        setScheduleTime("00:00");
      } else if (activeType === UPSELLING_TYPE) {
        // Type 8: Upselling - H+1 dari tanggal event
        setEventValue("1d-09:00"); // Default H+1 jam 09:00
        setScheduleDay(1);
        setScheduleTime("09:00");
      } else if (activeType === REDIRECT_TYPE) {
        // Type 9: Redirect - instant
        setEventValue("0d-00:00");
        setScheduleDay(0);
        setScheduleTime("00:00");
      } else {
        // Fallback default
        setEventValue("1d-09:00");
        setScheduleDay(1);
        setScheduleTime("09:00");
      }
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
      const res = await fetch(`${BASE_URL}/sales/template-follup/store`, {
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
        
        {/* Type 1-4: Follow Up dengan settingan jam/hari */}
        {SCHEDULED_TYPES.includes(activeType) && (
          <>
            <div className="schedule-grid">
              <div className="schedule-card">
                <label>Delay (Hari)</label>
                <div className="schedule-input">
                  <input
                    type="number"
                    min="0"
                    value={scheduleDay}
                    onChange={(e) => {
                      const newDay = Math.max(0, Number(e.target.value) || 0);
                      setScheduleDay(newDay);
                      setEventValue(formatEventValue(newDay, scheduleTime));
                    }}
                  />
                  <span>hari</span>
                </div>
              </div>
              <div className="schedule-card">
                <label>Jam Kirim</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => {
                    const newTime = e.target.value || "09:00";
                    setScheduleTime(newTime);
                    setEventValue(formatEventValue(scheduleDay, newTime));
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* Type 5, 6, 7: Instant Send (trigger dari backend) */}
        {INSTANT_SEND_TYPES.includes(activeType) && (
          <div className="instant-send-info">
            <div className="instant-badge">
              <i className="pi pi-bolt" />
              Instant Send
            </div>
            <p className="instant-desc">
              {activeType === 5 && "Pesan akan langsung dikirim saat customer berhasil melakukan pemesanan."}
              {activeType === 6 && "Pesan akan langsung dikirim setelah customer melakukan pembayaran."}
              {activeType === 7 && "Pesan akan langsung dikirim saat event/pesanan selesai (terimakasih sudah mengikuti webinar/seminar/workshop)."}
            </p>
          </div>
        )}

        {/* Type 8: Upselling - H+1 dari tanggal event */}
        {activeType === UPSELLING_TYPE && (
          <div className="instant-send-info upselling-info">
            <div className="instant-badge upselling-badge">
              <i className="pi pi-calendar-plus" />
              H+1 Tanggal Event
            </div>
            <p className="instant-desc">
              Pesan upselling akan otomatis dikirim <strong>1 hari setelah tanggal event produk</strong> sebagai penawaran produk lanjutan.
            </p>
            <p className="schedule-hint" style={{ marginTop: "8px" }}>
              Jadwal dikirim otomatis berdasarkan: <strong>tanggal_event + 1 hari</strong>
            </p>
          </div>
        )}

        {/* Type 9: Redirect - Instant */}
        {activeType === REDIRECT_TYPE && (
          <div className="instant-send-info redirect-info">
            <div className="instant-badge redirect-badge">
              <i className="pi pi-directions" />
              Redirect Message
            </div>
            <p className="instant-desc">
              Pesan redirect akan dikirim sesuai kondisi tertentu yang di-trigger dari sistem.
            </p>
          </div>
        )}
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
          gap: 0.75rem;
          margin-bottom: 2rem;
          background: #f9fafb;
          padding: 0.5rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          flex-wrap: wrap;
        }

        .tab {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          font-size: 0.9rem;
          color: #6b7280;
          position: relative;
        }

        .tab:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .tab.active {
          background: #ffffff;
          color: #F1A124;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .tab.active::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: #F1A124;
          border-radius: 2px 2px 0 0;
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

        .select-auto {
          border: 1px solid #ddd;
          padding: 6px 10px;
          border-radius: 8px;
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
          margin-top: 24px;
          border-top: 1px solid #eef2ff;
          padding-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .schedule-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .schedule-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
        }

        .schedule-card label {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }

        .schedule-card input {
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 14px;
          width: 100%;
        }

        .schedule-input {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .schedule-input span {
          font-size: 13px;
          color: #6b7280;
        }

        .schedule-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
        }

        .schedule-hint {
          font-size: 13px;
          color: #6b7280;
        }

        .schedule-hint strong {
          color: #111827;
        }

        .instant-send-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          border-radius: 14px;
          padding: 16px;
        }

        .instant-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #f59e0b;
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          width: fit-content;
        }

        .instant-badge i {
          font-size: 14px;
        }

        .instant-desc {
          font-size: 14px;
          color: #92400e;
          margin: 0;
        }

        /* Upselling style */
        .upselling-info {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-color: #3b82f6;
        }

        .upselling-badge {
          background: #3b82f6;
        }

        .upselling-info .instant-desc {
          color: #1e40af;
        }

        /* Redirect style */
        .redirect-info {
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
          border-color: #a855f7;
        }

        .redirect-badge {
          background: #a855f7;
        }

        .redirect-info .instant-desc {
          color: #6b21a8;
          line-height: 1.5;
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
