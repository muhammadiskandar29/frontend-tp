"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { getUsers } from "@/lib/users";

const BASE_URL = "/api";

export default function TrainerSection({ productId, product, onProductUpdate }) {
  const params = useParams();
  const id = productId || params?.id;

  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTrainer, setCurrentTrainer] = useState(null);

  // Fetch trainers (users with division 11)
  useEffect(() => {
    async function fetchTrainers() {
      try {
        setLoading(true);
        const users = await getUsers();
        
        // Filter users with division 11 (Trainer)
        const trainerUsers = users.filter(
          (user) => user.divisi === 11 || user.divisi === "11"
        );
        
        setTrainers(trainerUsers);
        console.log("✅ [TRAINER] Trainers loaded:", trainerUsers);
      } catch (err) {
        console.error("❌ [TRAINER] Error fetching trainers:", err);
        toast.error("Gagal memuat daftar trainer");
      } finally {
        setLoading(false);
      }
    }

    fetchTrainers();
  }, []);

  // Set current trainer from product data
  useEffect(() => {
    if (product) {
      // Check if product has trainer field or trainer_rel
      const trainerId = product.trainer || product.trainer_id;
      const trainerRel = product.trainer_rel;
      
      if (trainerId) {
        setSelectedTrainer(String(trainerId));
        setCurrentTrainer(trainerRel || { id: trainerId, nama: "Trainer" });
      } else {
        setSelectedTrainer("");
        setCurrentTrainer(null);
      }
    }
  }, [product]);

  const handleSave = async () => {
    if (!id) {
      toast.error("ID produk tidak ditemukan");
      return;
    }

    if (!selectedTrainer) {
      toast.error("Pilih trainer terlebih dahulu");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${BASE_URL}/admin/produk/${id}/trainer`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          trainer: Number(selectedTrainer),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mengupdate trainer");
      }

      toast.success(data.message || "Trainer berhasil diupdate");

      // Update product data if callback provided
      if (onProductUpdate && data.data) {
        onProductUpdate(data.data);
        
        // Update current trainer from response or trainers list
        const updatedProduct = data.data;
        if (updatedProduct.trainer_rel) {
          setCurrentTrainer(updatedProduct.trainer_rel);
        } else {
          const selectedTrainerData = trainers.find(
            (t) => String(t.id) === String(selectedTrainer)
          );
          if (selectedTrainerData) {
            setCurrentTrainer(selectedTrainerData);
          }
        }
      } else {
        // Fallback: Update current trainer display from trainers list
        const selectedTrainerData = trainers.find(
          (t) => String(t.id) === String(selectedTrainer)
        );
        if (selectedTrainerData) {
          setCurrentTrainer(selectedTrainerData);
        }
      }
    } catch (error) {
      console.error("❌ [TRAINER] Error saving trainer:", error);
      toast.error(error.message || "Gagal mengupdate trainer");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!id) {
      toast.error("ID produk tidak ditemukan");
      return;
    }

    if (!confirm("Yakin ingin menghapus trainer dari produk ini?")) {
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      // Set trainer to null or 0 to remove
      const res = await fetch(`${BASE_URL}/admin/produk/${id}/trainer`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          trainer: null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menghapus trainer");
      }

      toast.success(data.message || "Trainer berhasil dihapus");

      // Update product data if callback provided
      if (onProductUpdate && data.data) {
        onProductUpdate(data.data);
      }

      // Clear selection
      setSelectedTrainer("");
      setCurrentTrainer(null);
    } catch (error) {
      console.error("❌ [TRAINER] Error removing trainer:", error);
      toast.error(error.message || "Gagal menghapus trainer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="trainer-card">
      <div className="trainer-header">
        <h2>Assign Trainer</h2>
        <p className="trainer-subtitle">
          Pilih trainer yang akan mengajar atau mengupload materi untuk peserta produk ini.
        </p>
      </div>

      {loading ? (
        <div className="trainer-loading">
          <p>Memuat daftar trainer...</p>
        </div>
      ) : (
        <>
          {/* Current Trainer Display */}
          {currentTrainer && (
            <div className="current-trainer">
              <div className="current-trainer-label">Trainer Saat Ini:</div>
              <div className="current-trainer-info">
                <span className="trainer-name">{currentTrainer.nama || "Trainer"}</span>
                {currentTrainer.email && (
                  <span className="trainer-email">{currentTrainer.email}</span>
                )}
              </div>
            </div>
          )}

          {/* Trainer Selection */}
          <div className="trainer-form">
            <label>
              Pilih Trainer
              <select
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                className="trainer-select"
              >
                <option value="">-- Pilih Trainer --</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.nama} {trainer.email ? `(${trainer.email})` : ""}
                  </option>
                ))}
              </select>
            </label>

            {trainers.length === 0 && (
              <p className="trainer-empty">
                Tidak ada trainer tersedia. Pastikan ada user dengan divisi Trainer (11).
              </p>
            )}

            <div className="trainer-actions">
              <button
                type="button"
                className="trainer-save-btn"
                onClick={handleSave}
                disabled={saving || !selectedTrainer || loading}
              >
                {saving ? "Menyimpan..." : selectedTrainer === String(product?.trainer || product?.trainer_id) ? "Update Trainer" : "Assign Trainer"}
              </button>

              {currentTrainer && (
                <button
                  type="button"
                  className="trainer-remove-btn"
                  onClick={handleRemove}
                  disabled={saving}
                >
                  Hapus Trainer
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .trainer-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 3px 12px rgba(0,0,0,0.07);
          margin-top: 20px;
        }

        .trainer-header h2 {
          margin: 0;
          font-size: 20px;
          color: #111827;
        }

        .trainer-subtitle {
          color: #6b7280;
          margin-top: 6px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .trainer-loading {
          padding: 20px;
          text-align: center;
          color: #6b7280;
        }

        .current-trainer {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .current-trainer-label {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .current-trainer-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .trainer-name {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .trainer-email {
          font-size: 14px;
          color: #6b7280;
        }

        .trainer-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .trainer-form label {
          display: flex;
          flex-direction: column;
          font-weight: 600;
          color: #111827;
          gap: 8px;
        }

        .trainer-select {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          background: white;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .trainer-select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .trainer-empty {
          padding: 12px;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          color: #92400e;
          font-size: 14px;
          margin: 0;
        }

        .trainer-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .trainer-save-btn,
        .trainer-remove-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .trainer-save-btn {
          background: #2563eb;
          color: white;
        }

        .trainer-save-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .trainer-save-btn:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .trainer-remove-btn {
          background: #ef4444;
          color: white;
        }

        .trainer-remove-btn:hover:not(:disabled) {
          background: #dc2626;
        }

        .trainer-remove-btn:disabled {
          background: #fca5a5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

