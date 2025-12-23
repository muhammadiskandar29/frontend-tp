"use client";

import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { getCustomers, deleteCustomer } from "@/lib/sales/customer";
import { Users, CheckCircle, Filter } from "lucide-react";
import dynamic from "next/dynamic";
import "@/styles/sales/dashboard-premium.css";
import "@/styles/sales/admin.css";
import "@/styles/sales/customers-premium.css";

// Lazy load modals
const EditCustomerModal = dynamic(() => import("./editCustomer"), { ssr: false });
const ViewCustomerModal = dynamic(() => import("./viewCustomer"), { ssr: false });
const DeleteCustomerModal = dynamic(() => import("./deleteCustomer"), { ssr: false });
const AddCustomerModal = dynamic(() => import("./addCustomer"), { ssr: false });
const HistoryCustomerModal = dynamic(() => import("./historyCustomer"), { ssr: false });
const FollowupLogModal = dynamic(() => import("./followupLog"), { ssr: false });

/**
 * Simple debounce hook to avoid rerunning expensive computations
 */
function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

import { toastSuccess, toastError, toastWarning } from "@/lib/toast";
const CUSTOMERS_COLUMNS = [
  "#",
  "Nama",
  "Email",
  "No Telepon",
  "Follow Up",
  "Riwayat Order",
  "Verifikasi",
  "Actions",
];

export default function AdminCustomerPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [filterPreset, setFilterPreset] = useState("all"); // all | today
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showView, setShowView] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showFollowupLog, setShowFollowupLog] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const getCustomerDate = useCallback((c) => {
    const raw =
      c?.created_at ||
      c?.createdAt ||
      c?.tanggal ||
      c?.date ||
      c?.created ||
      c?.updated_at ||
      c?.updatedAt;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }, []);

  // 🔹 Load data dari backend, batched via needsRefresh flag
  useEffect(() => {
    if (!needsRefresh) return;
    const loadCustomers = async () => {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (err) {
        console.error("Error fetching customers:", err);
        toastError("Gagal memuat data customer");
      } finally {
        setNeedsRefresh(false);
      }
    };
    loadCustomers();
  }, [needsRefresh]);

  // 🔹 Filter pencarian (memoized + debounced input)
  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return customers.filter((c) => {
      if (c.status !== "1") return false;
      if (filterPreset === "today") {
        const d = getCustomerDate(c);
        if (!d) return false;
        const now = new Date();
        const sameDay =
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate();
        if (!sameDay) return false;
      }
      if (!term) return true;
      return [c.nama, c.email, c.wa].some((field) => field?.toLowerCase().includes(term));
    });
  }, [customers, debouncedSearch, filterPreset, getCustomerDate]);

  // 🔹 Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterPreset]);

  // 🔹 Helpers
  const closeAllModals = () => {
    setShowEdit(false);
    setShowDelete(false);
    setShowView(false);
    setShowAdd(false);
    setSelectedCustomer(null);
  };

  const requestRefresh = (message, type = "success") => {
    if (type === "error") {
      toastError(message);
    } else if (type === "warning") {
      toastWarning(message);
    } else {
      toastSuccess(message);
    }
    setNeedsRefresh(true);
  };

  // 🔹 Handler edit
  const handleEdit = (cust) => {
    setSelectedCustomer(cust);
    setShowEdit(true);
  };

  const handleSuccessEdit = (message) => {
    requestRefresh(message);
    setShowEdit(false);
  };

  // 🔹 Handler delete
  const handleDelete = (cust) => {
    setSelectedCustomer(cust);
    setShowDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCustomer(selectedCustomer.id);
      requestRefresh("Customer berhasil dihapus!", "warning");
    } catch (err) {
      console.error("Error deleting customer:", err);
      toastError("Gagal menghapus customer");
    } finally {
      setShowDelete(false);
      setSelectedCustomer(null);
    }
  };

  const handleView = (cust) => {
    setSelectedCustomer(cust);
    setShowView(true);
  };

  const handleHistory = (cust) => {
    setSelectedCustomer(cust);
    setShowHistory(true);
  };

  const handleFollowupLog = (cust) => {
    setSelectedCustomer(cust);
    setShowFollowupLog(true);
  };

  return (
    <Layout title="Manage Customers">
      <div className="dashboard-shell customers-shell">
        <section className="dashboard-hero customers-hero">
          <div className="customers-toolbar">
            <div className="customers-search">
              <input
                type="search"
                placeholder="Cari nama, email, atau WhatsApp"
                className="customers-search__input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <span className="customers-search__icon pi pi-search" />
            </div>
            <div className="customers-filters" aria-label="Filter pelanggan">
              <button
                type="button"
                className={`customers-filter-btn ${filterPreset === "all" ? "is-active" : ""}`}
                onClick={() => setFilterPreset("all")}
              >
                Semua
              </button>
              <button
                type="button"
                className={`customers-filter-btn ${filterPreset === "today" ? "is-active" : ""}`}
                onClick={() => setFilterPreset("today")}
                title="Filter customer yang tanggalnya hari ini (butuh field tanggal dari API)"
              >
                Hari Ini
              </button>
              <button
                type="button"
                className="customers-filter-btn customers-filter-icon-btn"
                title="Filter"
                aria-label="Filter"
                onClick={() => {}}
              >
                <Filter size={16} />
              </button>
            </div>
          </div>
        </section>

        <section className="dashboard-summary customers-summary">
          <article className="summary-card summary-card--combined summary-card--three-cols">
            <div className="summary-card__column">
              <div className={`summary-card__icon accent-orange`}>
                <Users size={22} />
              </div>
              <div>
                <p className="summary-card__label">Total customers</p>
                <p className="summary-card__value">{customers.length}</p>
              </div>
            </div>
            <div className="summary-card__divider"></div>
            <div className="summary-card__column">
              <div className={`summary-card__icon accent-orange`}>
                <CheckCircle size={22} />
              </div>
              <div>
                <p className="summary-card__label">Verified</p>
                <p className="summary-card__value">
                  {customers.filter((c) => c.verifikasi === "1" || c.verifikasi === true).length}
                </p>
              </div>
            </div>
            <div className="summary-card__divider"></div>
            <div className="summary-card__column">
              <div className={`summary-card__icon accent-orange`}>
                <Filter size={22} />
              </div>
              <div>
                <p className="summary-card__label">Unverified</p>
                <p className="summary-card__value">
                  {customers.filter((c) => c.verifikasi !== "1" && c.verifikasi !== true).length}
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="panel customers-panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Directory</p>
              <h3 className="panel__title">Customer roster</h3>
            </div>
            <div className="customers-toolbar-buttons">
              <button 
                className="customers-button customers-button--secondary" 
                onClick={() => router.push("/sales/followup/report")}
              >
                <i className="pi pi-chart-bar" style={{ marginRight: "6px" }} />
                Report Follow Up
              </button>
              <button className="customers-button customers-button--primary" onClick={() => setShowAdd(true)}>
                + Tambah Customer
              </button>
            </div>
          </div>

          <div className="customers-table__wrapper">
            <div className="customers-table">
              <div className="customers-table__head">
                {CUSTOMERS_COLUMNS.map((column) => (
                  <span key={column}>{column}</span>
                ))}
              </div>
              <div className="customers-table__body">
                {paginatedData.length > 0 ? (
                  paginatedData.map((cust, i) => (
                  <div className="customers-table__row" key={cust.id || `${cust.email}-${i}`}>
                    <div className="customers-table__cell" data-label="#">
                      {startIndex + i + 1}
                    </div>
                    <div className="customers-table__cell customers-table__cell--strong" data-label="Nama">
                      {cust.nama || "-"}
                    </div>
                    <div className="customers-table__cell" data-label="Email">
                      {cust.email || "-"}
                    </div>
                    <div className="customers-table__cell" data-label="No Telepon">
                      {cust.wa ? (
                        <a
                          href={`https://wa.me/${cust.wa.replace(/[^0-9]/g, "").replace(/^0/, "62")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="wa-link"
                          title={`Chat WhatsApp ${cust.wa}`}
                        >
                          <svg 
                            viewBox="0 0 24 24" 
                            width="14" 
                            height="14" 
                            fill="currentColor"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          <span>{cust.wa}</span>
                        </a>
                      ) : (
                        "-"
                      )}
                    </div>
                    <div className="customers-table__cell" data-label="Follow Up">
                      <a
                        href="#"
                        className="customers-history-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleFollowupLog(cust);
                        }}
                      >
                        Lihat Log
                      </a>
                    </div>
                    <div className="customers-table__cell" data-label="Riwayat Order">
                      <a
                        href="#"
                        className="customers-history-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleHistory(cust);
                        }}
                      >
                        Lihat Riwayat
                      </a>
                    </div>
                    <div className="customers-table__cell" data-label="Verifikasi">
                      <span
                        className={`customers-verif-tag ${
                          cust.verifikasi === "1" || cust.verifikasi === true ? "is-verified" : "is-unverified"
                        }`}
                      >
                        {cust.verifikasi === "1" || cust.verifikasi === true ? "Verified" : "Unverified"}
                      </span>
                    </div>
                    <div className="customers-table__cell customers-table__cell--actions" data-label="Actions">
                      <button
                        className="customers-action-btn"
                        title="Lihat"
                        onClick={() => handleView(cust)}
                      >
                        <i className="pi pi-eye" />
                      </button>
                      <button
                        className="customers-action-btn customers-action-btn--ghost"
                        title="Edit"
                        onClick={() => handleEdit(cust)}
                      >
                        <i className="pi pi-pencil" />
                      </button>
                      <button
                        className="customers-action-btn customers-action-btn--danger"
                        title="Hapus"
                        onClick={() => handleDelete(cust)}
                      >
                        <i className="pi pi-trash" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="customers-empty">
                  {customers.length ? "Tidak ada hasil pencarian." : "Loading data..."}
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
        {showEdit && selectedCustomer && (
          <EditCustomerModal
            customer={selectedCustomer}
            onClose={() => {
              setShowEdit(false);
              setSelectedCustomer(null);
            }}
            onSuccess={handleSuccessEdit}
          />
        )}

        {showDelete && selectedCustomer && (
          <DeleteCustomerModal
            customer={selectedCustomer}
            onClose={() => {
              setShowDelete(false);
              setSelectedCustomer(null);
            }}
            onConfirm={handleConfirmDelete}
          />
        )}

        {showView && selectedCustomer && (
          <ViewCustomerModal
            customer={selectedCustomer}
            onClose={() => {
              setShowView(false);
              setSelectedCustomer(null);
            }}
          />
        )}

        {showHistory && selectedCustomer && (
          <HistoryCustomerModal
            customer={selectedCustomer}
            onClose={() => {
              setShowHistory(false);
              setSelectedCustomer(null);
            }}
          />
        )}

        {showFollowupLog && selectedCustomer && (
          <FollowupLogModal
            customer={selectedCustomer}
            onClose={() => {
              setShowFollowupLog(false);
              setSelectedCustomer(null);
            }}
          />
        )}

        {showAdd && (
          <AddCustomerModal
            onClose={() => {
              setShowAdd(false);
            }}
            onSuccess={(msg) => {
              requestRefresh(msg);
              setShowAdd(false);
            }}
          />
        )}

      </div>
    </Layout>
  );
}