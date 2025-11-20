// hooks/useKategori.js
import { useEffect, useState } from "react";
import {
  getKategori,
  addKategori as addKategoriAPI,
  updateKategori as updateKategoriAPI,
  deleteKategori as deleteKategoriAPI,
} from "@/lib/kategori";

export default function useKategori() {
  const [kategori, setKategori] = useState([]);
  const [loading, setLoading] = useState(true);

  // === GET ===
  const loadKategori = async () => {
    try {
      const data = await getKategori(); // <- panggil dari lib
      setKategori(data);
    } catch (err) {
      console.error("❌ Gagal fetch kategori:", err);
    } finally {
      setLoading(false);
    }
  };

  // === ADD ===
  const addKategori = async (nama) => {
    try {
      const newKategori = await addKategoriAPI(nama); // <- dari lib
      if (newKategori) setKategori((prev) => [...prev, newKategori]);
    } catch (err) {
      console.error("❌ Error addKategori:", err);
      throw err;
    }
  };

  // === UPDATE ===
  const updateKategori = async (id, nama) => {
    try {
      const updated = await updateKategoriAPI(id, nama); // <- dari lib
      if (updated) {
        setKategori((prev) =>
          prev.map((k) => (k.id === id ? { ...k, ...updated } : k))
        );
      }
    } catch (err) {
      console.error("❌ Error updateKategori:", err);
      throw err;
    }
  };

  // === DELETE ===
  const deleteKategori = async (id) => {
    try {
      const success = await deleteKategoriAPI(id); // <- dari lib
      if (success) {
        setKategori((prev) => prev.filter((k) => k.id !== id));
      }
    } catch (err) {
      console.error("❌ Error deleteKategori:", err);
      throw err;
    }
  };

  useEffect(() => {
    loadKategori();
  }, []);

  return { kategori, addKategori, updateKategori, deleteKategori, loading };
}
