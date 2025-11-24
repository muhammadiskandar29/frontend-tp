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

  useEffect(() => {
    if (!topicTouched && productName) {
      setTopic((prev) => prev || `Webinar ${productName}`);
    }
  }, [productName, topicTouched]);

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
      const res = await fetch("/api/webinar", {
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
      setWebinarResult(data.data || data);
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

    return (
      <div className="linkzoom-result">
        <div className="result-header">
          <h3>Link Zoom Berhasil Dibuat</h3>
          <p>Bagikan link berikut ke peserta webinar.</p>
        </div>
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

      {renderResultCard()}

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
      `}</style>
    </div>
  );
}


