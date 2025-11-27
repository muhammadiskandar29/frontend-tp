"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

const defaultDuration = 60;

export default function LinkZoomSection({ productId, productName }) {
  const [topic, setTopic] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(defaultDuration);
  const [creating, setCreating] = useState(false);
  const [webinarResult, setWebinarResult] = useState(null);
  const [topicTouched, setTopicTouched] = useState(false);
  const [loading, setLoading] = useState(true);

  // Convert backend datetime to datetime-local format
  const convertToDatetimeLocal = (backendTime) => {
    if (!backendTime) return "";
    // Format: "2024-12-25 14:00:00" -> "2024-12-25T14:00"
    const dateTimeStr = backendTime.replace(" ", "T");
    // Remove seconds if present
    return dateTimeStr.substring(0, 16);
  };

  // Fetch existing webinar data
  useEffect(() => {
    async function fetchExistingWebinar() {
      if (!productId) {
        setLoading(false);
        return;
      }

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        console.log("🔍 [LINK ZOOM] Fetching webinar for product:", productId);
        
        const res = await fetch(`/api/admin/webinar/${productId}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        console.log("🔍 [LINK ZOOM] Response status:", res.status);
        
        const data = await res.json().catch((err) => {
          console.error("❌ [LINK ZOOM] JSON parse error:", err);
          return {};
        });

        console.log("🔍 [LINK ZOOM] Response data:", data);

        if (res.ok && data?.success && data?.data && Array.isArray(data.data) && data.data.length > 0) {
          // Ambil webinar pertama dari array
          const webinarData = data.data[0];
          console.log("✅ [LINK ZOOM] Webinar data found:", webinarData);
          setWebinarResult(webinarData);
          
          // Fill form with existing data
          // Note: response tidak ada field 'topic', mungkin perlu dari produk atau default
          if (webinarData.topic) {
            setTopic(webinarData.topic);
            setTopicTouched(true);
          } else if (productName) {
            // Fallback ke nama produk jika tidak ada topic
            setTopic(`Webinar ${productName}`);
            setTopicTouched(true);
          }
          
          if (webinarData.start_time) {
            setStartTime(convertToDatetimeLocal(webinarData.start_time));
          }
          
          if (webinarData.duration) {
            setDuration(webinarData.duration || defaultDuration);
          }
        } else {
          console.log("ℹ️ [LINK ZOOM] No webinar data found or error:", data);
        }
      } catch (error) {
        console.error("❌ [LINK ZOOM] fetch existing error:", error);
        // Silent fail - tidak ada webinar yang sudah dibuat
      } finally {
        setLoading(false);
      }
    }

    fetchExistingWebinar();
  }, [productId]);

  useEffect(() => {
    // Only set default topic if not touched and no existing webinar data
    if (!topicTouched && productName && !webinarResult && !loading) {
      setTopic((prev) => prev || `Webinar ${productName}`);
    }
  }, [productName, topicTouched, webinarResult, loading]);

  const formatStartTime = (value) => {
    if (!value) return "";
    const [datePart, timePartRaw] = value.split("T");
    if (!datePart || !timePartRaw) return "";
    const timePart =
      timePartRaw.length === 5
        ? `${timePartRaw}:00`
        : timePartRaw.includes(":")
        ? timePartRaw
        : `${timePartRaw}:00`;
    return `${datePart} ${timePart}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId) {
      toast.error("ID produk tidak ditemukan");
      return;
    }
    if (!topic.trim()) {
      toast.error("Topic wajib diisi");
      return;
    }
    if (!startTime) {
      toast.error("Jadwal mulai wajib diisi");
      return;
    }

    const formattedStart = formatStartTime(startTime);
    if (!formattedStart) {
      toast.error("Format jadwal tidak valid");
      return;
    }

    const payload = {
      produk: Number(productId),
      topic: topic.trim(),
      start_time: formattedStart,
      duration: Number(duration) || defaultDuration,
    };

    setCreating(true);
    setWebinarResult(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("/api/admin/webinar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        const message = data?.message || "Gagal membuat link Zoom";
        throw new Error(message);
      }

      toast.success(data.message || "Link Zoom berhasil dibuat");
      
      // Response POST mungkin mengembalikan data langsung atau perlu fetch ulang
      // Jika ada data langsung, gunakan itu, jika tidak fetch ulang
      if (data.data) {
        // Handle jika data adalah array (format baru)
        const resultData = Array.isArray(data.data) ? data.data[0] : data.data;
        setWebinarResult(resultData);
        
        // Update form dengan data yang baru dibuat
        if (resultData.start_time) {
          setStartTime(convertToDatetimeLocal(resultData.start_time));
        }
        if (resultData.duration) {
          setDuration(resultData.duration || duration);
        }
      } else {
        // Jika tidak ada data langsung, fetch ulang dari GET endpoint
        try {
          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
          const fetchRes = await fetch(`/api/admin/webinar/${productId}`, {
            method: "GET",
            headers: {
              Accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          
          const fetchData = await fetchRes.json().catch(() => ({}));
          if (fetchRes.ok && fetchData?.success && fetchData?.data && Array.isArray(fetchData.data) && fetchData.data.length > 0) {
            const webinarData = fetchData.data[0];
            setWebinarResult(webinarData);
            if (webinarData.start_time) {
              setStartTime(convertToDatetimeLocal(webinarData.start_time));
            }
            if (webinarData.duration) {
              setDuration(webinarData.duration || duration);
            }
          }
        } catch (fetchError) {
          console.error("❌ [LINK ZOOM] Error fetching after create:", fetchError);
        }
      }
    } catch (error) {
      console.error("❌ [LINK ZOOM] create error:", error);
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setCreating(false);
    }
  };

  const renderResultCard = () => {
    if (!webinarResult) return null;

    const joinUrl =
      webinarResult.join_url ||
      webinarResult.joinUrl ||
      webinarResult.webinar?.join_url ||
      webinarResult.data?.join_url;

    const startUrl =
      webinarResult.start_url ||
      webinarResult.startUrl ||
      webinarResult.webinar?.start_url;

    const meetingId =
      webinarResult.meeting_id ||
      webinarResult.meetingId ||
      webinarResult.webinar?.meeting_id;

    const password =
      webinarResult.password ||
      webinarResult.passcode ||
      webinarResult.webinar?.password;

    const topic = webinarResult.topic || webinarResult.webinar?.topic || "";
    const startTime = webinarResult.start_time || webinarResult.webinar?.start_time || "";

    return (
      <div className="linkzoom-result">
        <div className="result-header">
          <h3>Link Zoom Telah Dibuat</h3>
          <p>Data webinar untuk produk ini sudah tersedia. Bagikan link berikut ke peserta webinar.</p>
        </div>
        {(topic || startTime) && (
          <div className="result-info">
            {topic && (
              <div className="info-item">
                <span>Topic:</span>
                <strong>{topic}</strong>
              </div>
            )}
            {startTime && (
              <div className="info-item">
                <span>Jadwal:</span>
                <strong>{new Date(startTime).toLocaleString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}</strong>
              </div>
            )}
          </div>
        )}
        <div className="result-grid">
          {meetingId && (
            <div className="result-item">
              <span>Meeting ID</span>
              <p>{meetingId}</p>
            </div>
          )}
          {password && (
            <div className="result-item">
              <span>Password</span>
              <p>{password}</p>
            </div>
          )}
          {joinUrl && (
            <div className="result-item span-col">
              <span>Join URL</span>
              <div className="url-row">
                <p>{joinUrl}</p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(joinUrl)}
                >
                  Copy
                </button>
              </div>
            </div>
          )}
          {startUrl && (
            <div className="result-item span-col">
              <span>Start URL</span>
              <div className="url-row">
                <p>{startUrl}</p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(startUrl)}
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="linkzoom-card">
      <h2>Buat Link Zoom</h2>
      <p className="subtitle">
        Buat jadwal webinar baru untuk produk ini dan dapatkan link Zoom secara otomatis.
      </p>

      <form className="linkzoom-form" onSubmit={handleSubmit}>
        <label>
          Topic Webinar
          <input
            type="text"
            value={topic}
            onChange={(e) => {
              setTopicTouched(true);
              setTopic(e.target.value);
            }}
            placeholder="Masukkan judul sesi webinar"
          />
        </label>

        <label>
          Jadwal Mulai
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>

        <label>
          Durasi (menit)
          <input
            type="number"
            min="15"
            step="15"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </label>

        <button type="submit" disabled={creating}>
          {creating ? "Membuat Link..." : "Buat Link Zoom"}
        </button>
      </form>

      {loading ? (
        <div className="linkzoom-loading">
          <p>Memuat data webinar...</p>
        </div>
      ) : (
        renderResultCard()
      )}

      <style>{`
        .linkzoom-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 3px 12px rgba(0,0,0,0.07);
          margin-top: 20px;
        }
        .linkzoom-card h2 {
          margin: 0;
          font-size: 20px;
        }
        .linkzoom-card .subtitle {
          color: #6b7280;
          margin-top: 6px;
          margin-bottom: 20px;
        }
        .linkzoom-form {
          display: grid;
          gap: 16px;
        }
        .linkzoom-form label {
          display: flex;
          flex-direction: column;
          font-weight: 600;
          color: #111827;
          gap: 6px;
        }
        .linkzoom-form input {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
        }
        .linkzoom-form button {
          margin-top: 10px;
          padding: 12px 18px;
          border: none;
          border-radius: 10px;
          background: #2563eb;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .linkzoom-form button:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }
        .linkzoom-form {
          margin-bottom: 24px;
        }
        .linkzoom-result {
          margin-top: 24px;
          border: 1px solid #dbeafe;
          border-radius: 14px;
          background: #f8fbff;
          padding: 20px;
        }
        .result-header h3 {
          margin: 0;
          color: #1d4ed8;
        }
        .result-header p {
          margin: 4px 0 16px;
          color: #4b5563;
        }
        .result-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }
        .result-item {
          background: white;
          border-radius: 12px;
          padding: 14px;
          border: 1px solid #e5e7eb;
        }
        .result-item span {
          font-size: 13px;
          color: #6b7280;
        }
        .result-item p {
          margin: 6px 0 0;
          font-weight: 600;
          word-break: break-all;
        }
        .span-col {
          grid-column: span 2;
        }
        @media (max-width: 768px) {
          .span-col {
            grid-column: span 1;
          }
        }
        .url-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .url-row button {
          padding: 6px 12px;
          border: none;
          border-radius: 8px;
          background: #2563eb;
          color: white;
          cursor: pointer;
          font-size: 13px;
        }
        .result-info {
          margin-bottom: 20px;
          padding: 16px;
          background: white;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
        }
        .info-item {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        .info-item:last-child {
          margin-bottom: 0;
        }
        .info-item span {
          font-size: 14px;
          color: #6b7280;
          min-width: 80px;
        }
        .info-item strong {
          font-size: 14px;
          color: #111827;
          font-weight: 600;
        }
        .linkzoom-loading {
          margin-top: 24px;
          padding: 20px;
          text-align: center;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}


