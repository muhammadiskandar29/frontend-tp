"use client";

import { useState, useCallback, memo } from "react";
import Layout from "@/components/Layout";
import dynamic from "next/dynamic";
import useKategori from "@/hooks/useKategori";
import "@/styles/admin-base.css";

// Lazy load modals
const AddKategoriModal = dynamic(() => import("./addKategori"), { ssr: false });
const EditKategoriModal = dynamic(() => import("./editKategori"), { ssr: false });
const DeleteKategoriModal = dynamic(() => import("./deleteKategori"), { ssr: false });

export default function AdminKategoriPage() {
  const { kategori, addKategori, updateKategori, deleteKategori, loading } = useKategori();

  const [selectedKategori, setSelectedKategori] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // === TOAST HANDLER ===
  const showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "toast-error" : type === "warning" ? "toast-warning" : ""}`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  // === HANDLERS ===
  const handleAdd = () => setShowAdd(true);

  const handleSaveAdd = async (newData) => {
    try {
      await addKategori(newData.nama);
      setShowAdd(false);
      showToast("Kategori berhasil ditambahkan!");
    } catch (err) {
      showToast("Gagal menambah kategori!", "error");
    }
  };

  const handleEdit = (kat) => {
    setSelectedKategori(kat);
    setShowEdit(true);
  };

  const handleSaveEdit = async (updated) => {
    try {
      await updateKategori(selectedKategori.id, updated.nama);
      setShowEdit(false);
      setSelectedKategori(null);
      showToast("Kategori berhasil diperbarui!");
    } catch (err) {
      showToast("Gagal mengedit kategori!", "error");
    }
  };

  const handleDelete = (kat) => {
    setSelectedKategori(kat);
    setShowDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteKategori(selectedKategori.id);
      setShowDelete(false);
      setSelectedKategori(null);
      showToast("Kategori berhasil dihapus!", "success");
    } catch (err) {
      showToast("Gagal menghapus kategori!", "error");
    }
  };

  // === RENDER ===
  if (loading)
    return (
      <Layout title="Loading...">
        <div className="loading">Memuat data kategori...</div>
      </Layout>
    );

  return (
    <Layout title="Kategori | One Dashboard">
      <div className="admin-followup-page">
        {/* HEADER */}
        <div className="admin-header">
          <h1 className="admin-title">Manage Categories</h1>
          <div className="admin-header-actions">
            <div className="left-action">
              <button className="admin-button" onClick={handleAdd}>
                + Add Category
              </button>
            </div>
            <div className="right-action">
              <div className="search-bar">
                <input type="text" placeholder="Search..." className="search-input" />
                <i className="pi pi-search search-icon"></i>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE HEADER */}
        <div className="field-header">
          <span>#</span>
          <span>Nama Kategori</span>
          <span className="text-center">Actions</span>
        </div>

        {/* LIST DATA */}
        <div className="data-list">
          {kategori.length === 0 && <p className="no-data">Belum ada kategori</p>}
          {kategori.map((kat, i) => (
            <div className="data-card" key={kat.id}>
              <span data-label="#"> {i + 1}</span>
              <span data-label="Nama">{kat.nama}</span>
              <div className="action-buttons">
                <button className="btn-icon btn-edit" onClick={() => handleEdit(kat)}>
                  <i className="pi pi-pencil"></i>
                </button>
                <button className="btn-icon btn-delete" onClick={() => handleDelete(kat)}>
                  <i className="pi pi-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* MODALS */}
        {showAdd && <AddKategoriModal onClose={() => setShowAdd(false)} onSave={handleSaveAdd} />}
        {showEdit && (
          <EditKategoriModal
            kategori={selectedKategori}
            onClose={() => setShowEdit(false)}
            onSave={handleSaveEdit}
          />
        )}
        {showDelete && (
          <DeleteKategoriModal
            kategori={selectedKategori}
            onClose={() => setShowDelete(false)}
            onConfirm={handleConfirmDelete}
          />
        )}
      </div>

    </Layout>
  );
}
