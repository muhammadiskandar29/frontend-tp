"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Layout from "@/components/Layout";
import dynamic from "next/dynamic";
import { FolderOpen, Search } from "lucide-react";
import useKategori from "@/hooks/sales/useKategori";
import { toastSuccess, toastError } from "@/lib/toast";
import "@/styles/sales/dashboard.css";
import "@/styles/sales/admin.css";

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
      const result = await addKategori(newData.nama);
      setShowAdd(false);
      if (result) {
        toastSuccess("Kategori berhasil ditambahkan!");
      } else {
        toastError("Gagal menambah kategori!");
      }
    } catch (err) {
      toastError("Gagal menambah kategori!");
    }
  };

  const handleEdit = (kat) => {
    setSelectedKategori(kat);
    setShowEdit(true);
  };

  const handleSaveEdit = async (updated) => {
    try {
      const result = await updateKategori(selectedKategori.id, updated.nama);
      setShowEdit(false);
      setSelectedKategori(null);
      if (result) {
        toastSuccess("Kategori berhasil diperbarui!");
      } else {
        toastError("Gagal mengedit kategori!");
      }
    } catch (err) {
      toastError("Gagal mengedit kategori!");
    }
  };

  const handleDelete = (kat) => {
    setSelectedKategori(kat);
    setShowDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const result = await deleteKategori(selectedKategori.id);
      setShowDelete(false);
      setSelectedKategori(null);
      if (result) {
        toastSuccess("Kategori berhasil dihapus!");
      } else {
        toastError("Gagal menghapus kategori!");
      }
    } catch (err) {
      toastError("Gagal menghapus kategori!");
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
    <Layout title="Manage Categories">
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
              icon: <FolderOpen size={22} />,
            },
            {
              label: "Filtered",
              value: filtered.length,
              accent: "accent-amber",
              icon: <Search size={22} />,
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

        <section className="panel users-panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Directory</p>
              <h3 className="panel__title">Category roster</h3>
            </div>
            <span className="panel__meta">{filtered.length} kategori</span>
          </div>

          <div className="users-table__wrapper">
            <div className="users-table">
              <div className="users-table__head">
                <span>#</span>
                <span>Nama Kategori</span>
                <span>Actions</span>
              </div>
              <div className="users-table__body">
                {paginatedData.length > 0 ? (
                  paginatedData.map((kat, i) => (
                    <div className="users-table__row" key={kat.id}>
                      <div className="users-table__cell" data-label="#">
                        {startIndex + i + 1}
                      </div>
                      <div className="users-table__cell" data-label="Nama Kategori">
                        {kat.nama}
                      </div>
                      <div className="users-table__cell users-table__cell--actions" data-label="Actions">
                        <button
                          className="users-action-btn users-action-btn--ghost"
                          title="Edit kategori"
                          aria-label="Edit kategori"
                          onClick={() => handleEdit(kat)}
                        >
                          <i className="pi pi-pencil" />
                        </button>
                        <button
                          className="users-action-btn users-action-btn--danger"
                          title="Hapus kategori"
                          aria-label="Hapus kategori"
                          onClick={() => handleDelete(kat)}
                        >
                          <i className="pi pi-trash" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="users-empty">
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
