"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Layout from "@/components/Layout";
import dynamic from "next/dynamic";
import useKategori from "@/hooks/useKategori";
import { toast } from "react-hot-toast";
import "@/styles/dashboard.css";
import "@/styles/admin.css";

// Lazy load modals
const AddKategoriModal = dynamic(() => import("./addKategori"), { ssr: false });
const EditKategoriModal = dynamic(() => import("./editKategori"), { ssr: false });
const DeleteKategoriModal = dynamic(() => import("./deleteKategori"), { ssr: false });

function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function AdminKategoriPage() {
  const { kategori, addKategori, updateKategori, deleteKategori, loading } = useKategori();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [selectedKategori, setSelectedKategori] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Filter kategori berdasarkan search
  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return kategori.filter((kat) => {
      if (!term) return true;
      return kat.nama?.toLowerCase().includes(term);
    });
  }, [kategori, debouncedSearch]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // === HANDLERS ===
  const handleAdd = () => setShowAdd(true);

  const handleSaveAdd = async (newData) => {
    try {
      await addKategori(newData.nama);
      setShowAdd(false);
      toast.success("Kategori berhasil ditambahkan!");
    } catch (err) {
      toast.error("Gagal menambah kategori!");
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
      toast.success("Kategori berhasil diperbarui!");
    } catch (err) {
      toast.error("Gagal mengedit kategori!");
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
      toast.success("Kategori berhasil dihapus!");
    } catch (err) {
      toast.error("Gagal menghapus kategori!");
    }
  };

  // === RENDER ===
  if (loading)
    return (
      <Layout title="Loading...">
        <div className="dashboard-shell">
          <p className="products-empty">Memuat data kategori...</p>
        </div>
      </Layout>
    );

  return (
    <Layout title="Kategori | One Dashboard">
      <div className="dashboard-shell customers-shell">
        <section className="dashboard-hero customers-hero">
          <div className="dashboard-hero__copy">
            <p className="dashboard-hero__eyebrow">Categories</p>
            <h2 className="dashboard-hero__title">Category Management</h2>
            <span className="dashboard-hero__meta">
              Manage product categories and organize your catalog.
            </span>
          </div>

          <div className="customers-toolbar">
            <div className="customers-search">
              <input
                type="search"
                placeholder="Cari kategori..."
                className="customers-search__input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <span className="customers-search__icon pi pi-search" />
            </div>
            <button
              className="customers-button customers-button--primary"
              onClick={handleAdd}
            >
              + Tambah Kategori
            </button>
          </div>
        </section>

        <section className="dashboard-summary customers-summary">
          {[
            {
              label: "Total categories",
              value: kategori.length,
              accent: "accent-blue",
              icon: "📁",
            },
            {
              label: "Filtered",
              value: filtered.length,
              accent: "accent-amber",
              icon: "🔍",
            },
          ].map((card) => (
            <article className="summary-card" key={card.label}>
              <div className={`summary-card__icon ${card.accent}`}>{card.icon}</div>
              <div>
                <p className="summary-card__label">{card.label}</p>
                <p className="summary-card__value">{card.value}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="panel products-panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Directory</p>
              <h3 className="panel__title">Category roster</h3>
            </div>
            <span className="panel__meta">{filtered.length} kategori</span>
          </div>

          <div className="products-table__wrapper" style={{ overflowX: "auto", maxWidth: "100%" }}>
            <div className="products-table" style={{ minWidth: "100%", width: "100%" }}>
              <div 
                className="products-table__head" 
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "60px 1fr 120px",
                  gap: "1rem",
                  padding: "0.75rem 1rem"
                }}
              >
                <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>#</span>
                <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>Nama Kategori</span>
                <span style={{ fontSize: "0.875rem", fontWeight: "600", textAlign: "center" }}>Actions</span>
              </div>
              <div className="products-table__body">
                {paginatedData.length > 0 ? (
                  paginatedData.map((kat, i) => (
                    <div 
                      className="products-table__row" 
                      key={kat.id}
                      style={{ 
                        display: "grid", 
                        gridTemplateColumns: "60px 1fr 120px",
                        gap: "1rem",
                        padding: "0.75rem 1rem",
                        borderTop: "1px solid #e5e7eb"
                      }}
                    >
                      <div className="products-table__cell" data-label="#" style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                        {startIndex + i + 1}
                      </div>
                      <div 
                        className="products-table__cell products-table__cell--strong" 
                        data-label="Nama Kategori"
                        style={{ 
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {kat.nama}
                      </div>
                      <div className="products-table__cell" data-label="Actions" style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                        <button
                          onClick={() => handleEdit(kat)}
                          style={{
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "none",
                            borderRadius: "6px",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = "#2563eb"}
                          onMouseLeave={(e) => e.target.style.backgroundColor = "#3b82f6"}
                          title="Edit"
                        >
                          <i className="pi pi-pencil" style={{ fontSize: "0.875rem" }}></i>
                        </button>
                        <button
                          onClick={() => handleDelete(kat)}
                          style={{
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "none",
                            borderRadius: "6px",
                            backgroundColor: "#ef4444",
                            color: "white",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = "#dc2626"}
                          onMouseLeave={(e) => e.target.style.backgroundColor = "#ef4444"}
                          title="Delete"
                        >
                          <i className="pi pi-trash" style={{ fontSize: "0.875rem" }}></i>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="products-empty">
                    {kategori.length ? "Tidak ada hasil pencarian." : "Belum ada kategori."}
                  </p>
                )}
              </div>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="customers-pagination">
              <button
                className="customers-pagination__btn"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <i className="pi pi-chevron-left" />
              </button>
              <span className="customers-pagination__info">
                Page {currentPage} of {totalPages} ({filtered.length} total)
              </span>
              <button
                className="customers-pagination__btn"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <i className="pi pi-chevron-right" />
              </button>
            </div>
          )}
        </section>

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
