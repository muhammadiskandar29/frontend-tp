"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { getCustomers, deleteCustomer } from "@/lib/sales/customer";
import { Users, CheckCircle, Filter } from "lucide-react";
import { Calendar } from "primereact/calendar";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
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
  // Pagination state dengan fallback pagination
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [hasMore, setHasMore] = useState(true); // penentu masih ada halaman berikutnya
  const [loading, setLoading] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState(null); // Store pagination info from backend
  const perPage = 15; // Data per halaman
  
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
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    verifikasi: "all", // all | verified | unverified
    status: "all", // all | active | inactive
    dateRange: null, // [startDate, endDate] atau null
    jenis_kelamin: "all", // all | l | p
  });
  
  const fetchingRef = useRef(false); // Prevent multiple simultaneous fetches

  // 🔹 Fetch customers dengan fallback pagination
  const fetchCustomers = useCallback(async (pageNumber = 1) => {
    // Prevent multiple simultaneous calls using ref
    if (fetchingRef.current) {
      console.log("⏸️ Already fetching, skipping duplicate request for page", pageNumber);
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found");
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      console.log("📤 Fetching customers - page:", pageNumber, "perPage:", perPage, "filters:", filters);
      const result = await getCustomers(pageNumber, perPage, filters);
      
      if (result.success && result.data && Array.isArray(result.data)) {
        // Selalu replace data (bukan append) - setiap page menampilkan data yang berbeda
        setCustomers(result.data);

        // Gunakan pagination object jika tersedia
        if (result.pagination && typeof result.pagination === 'object') {
          // Struktur pagination: { current_page, last_page, per_page, total }
          const isLastPage = result.pagination.current_page >= result.pagination.last_page;
          setHasMore(!isLastPage);
          setPaginationInfo(result.pagination);
          console.log("📄 Pagination info:", {
            current_page: result.pagination.current_page,
            last_page: result.pagination.last_page,
            total: result.pagination.total,
            hasMore: !isLastPage
          });
        } else {
          setPaginationInfo(null);
          // Fallback pagination: cek jumlah data untuk menentukan hasMore
          if (result.data.length < perPage) {
            setHasMore(false); // sudah halaman terakhir
          } else {
            setHasMore(true); // masih ada halaman berikutnya
          }
        }
      } else {
        // Jika response tidak sesuai format yang diharapkan
        console.warn("⚠️ Unexpected response format:", result);
        setCustomers([]);
        setHasMore(false);
      }
      
      setLoading(false);
      fetchingRef.current = false;
    } catch (err) {
      console.error("Error fetching customers:", err);
      toastError("Gagal memuat data customer");
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [perPage, filters]);

  // Initial load: fetch page 1
  useEffect(() => {
    setPage(1);
    setCustomers([]);
    setHasMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Hanya sekali saat mount

  // Fetch data saat page atau filters berubah
  useEffect(() => {
    if (page > 0) {
      console.log("🔄 useEffect triggered - page:", page, "filters:", filters);
      fetchCustomers(page);
      // Tidak scroll ke atas, tetap di posisi saat ini
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]); // Depend pada page dan filters

  // 🔹 Next page
  const handleNextPage = useCallback(() => {
    if (loading || !hasMore) return; // Jangan load jika sedang loading atau sudah habis
    
    const nextPage = page + 1;
    console.log("🔄 Next page clicked, loading page:", nextPage);
    setPage(nextPage);
  }, [page, hasMore, loading]);

  // 🔹 Previous page
  const handlePrevPage = useCallback(() => {
    if (loading || page <= 1) return; // Jangan load jika sedang loading atau sudah di page 1
    
    const prevPage = page - 1;
    console.log("🔄 Previous page clicked, loading page:", prevPage);
    setPage(prevPage);
  }, [page, loading]);

  // 🔹 Helpers
  const closeAllModals = () => {
    setShowEdit(false);
    setShowDelete(false);
    setShowView(false);
    setShowAdd(false);
    setSelectedCustomer(null);
  };

  // 🔹 Refresh all data (reset to page 1)
  const requestRefresh = async (message, type = "success") => {
    setPage(1);
    setCustomers([]);
    setHasMore(true);
    await fetchCustomers(1);
    if (message) {
      if (type === "error") {
        toastError(message);
      } else if (type === "warning") {
        toastWarning(message);
      } else {
        toastSuccess(message);
      }
    }
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

  // 🔹 Filter handlers
  const handleApplyFilter = () => {
    setShowFilterModal(false);
    // Reset to page 1 when filter changes
    setPage(1);
    // fetchCustomers will be triggered by useEffect when page or filters change
  };

  const handleResetFilter = () => {
    const resetFilters = {
      verifikasi: "all",
      status: "all",
      dateRange: null,
      jenis_kelamin: "all",
    };
    setFilters(resetFilters);
    setPage(1);
    setShowFilterModal(false);
    // fetchCustomers will be triggered by useEffect
  };

  const hasActiveFilters = () => {
    return (
      filters.verifikasi !== "all" ||
      filters.status !== "all" ||
      filters.jenis_kelamin !== "all" ||
      (filters.dateRange && Array.isArray(filters.dateRange) && filters.dateRange.length === 2 && filters.dateRange[0] && filters.dateRange[1])
    );
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
                className={`customers-filter-btn customers-filter-icon-btn ${Object.values(filters).some(v => v !== "all" && v !== null) ? "is-active" : ""}`}
                title="Filter"
                aria-label="Filter"
                onClick={() => setShowFilterModal(true)}
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
                {customers.length > 0 ? (
                  customers.map((cust, i) => (
                  <div className="customers-table__row" key={cust.id || `${cust.email}-${i}`}>
                    <div className="customers-table__cell" data-label="#">
                      {(page - 1) * perPage + i + 1}
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

          {/* Pagination dengan Next/Previous Button */}
          <div className="customers-pagination" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", padding: "1.5rem", flexWrap: "wrap" }}>
            {/* Previous Button */}
            <button
              className="customers-pagination__btn"
              onClick={handlePrevPage}
              disabled={page === 1 || loading}
              aria-label="Previous page"
              style={{
                padding: "0.75rem 1rem",
                minWidth: "100px",
                background: page === 1 || loading ? "#e5e7eb" : "#f1a124",
                color: page === 1 || loading ? "#9ca3af" : "#fff",
                border: "none",
                borderRadius: "0.5rem",
                cursor: page === 1 || loading ? "not-allowed" : "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                justifyContent: "center",
                transition: "all 0.2s ease"
              }}
            >
              <i className="pi pi-chevron-left" />
              Previous
            </button>

            {/* Page Info */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem",
              fontSize: "0.95rem",
              color: "var(--dash-text)",
              fontWeight: 500
            }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <i className="pi pi-spin pi-spinner" />
                  Loading...
                </span>
              ) : (
                <span>
                  Page {paginationInfo?.current_page || page} of {paginationInfo?.last_page || "?"}
                  {paginationInfo?.total && ` (${paginationInfo.total} total)`}
                </span>
              )}
            </div>

            {/* Next Button */}
            <button
              className="customers-pagination__btn"
              onClick={handleNextPage}
              disabled={!hasMore || loading}
              aria-label="Next page"
              style={{
                padding: "0.75rem 1rem",
                minWidth: "100px",
                background: !hasMore || loading ? "#e5e7eb" : "#f1a124",
                color: !hasMore || loading ? "#9ca3af" : "#fff",
                border: "none",
                borderRadius: "0.5rem",
                cursor: !hasMore || loading ? "not-allowed" : "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                justifyContent: "center",
                transition: "all 0.2s ease"
              }}
            >
              Next
              <i className="pi pi-chevron-right" />
            </button>
          </div>
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

        {/* Filter Modal */}
        {showFilterModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowFilterModal(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#ffffff",
                borderRadius: "0.75rem",
                padding: "1.5rem",
                width: "90%",
                maxWidth: "500px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              }}
            >
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, color: "var(--dash-text-dark)" }}>
                  Filter Customer
                </h3>
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem", color: "var(--dash-muted)" }}>
                  Pilih filter untuk menyaring data customer
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Verifikasi Filter */}
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--dash-text)" }}>
                    Verifikasi
                  </label>
                  <select
                    value={filters.verifikasi}
                    onChange={(e) => setFilters({ ...filters, verifikasi: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      border: "1px solid var(--dash-border)",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      background: "var(--dash-surface)",
                      color: "var(--dash-text)",
                      cursor: "pointer",
                    }}
                  >
                    <option value="all">Semua</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--dash-text)" }}>
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      border: "1px solid var(--dash-border)",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      background: "var(--dash-surface)",
                      color: "var(--dash-text)",
                      cursor: "pointer",
                    }}
                  >
                    <option value="all">Semua</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Jenis Kelamin Filter */}
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--dash-text)" }}>
                    Jenis Kelamin
                  </label>
                  <select
                    value={filters.jenis_kelamin}
                    onChange={(e) => setFilters({ ...filters, jenis_kelamin: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      border: "1px solid var(--dash-border)",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      background: "var(--dash-surface)",
                      color: "var(--dash-text)",
                      cursor: "pointer",
                    }}
                  >
                    <option value="all">Semua</option>
                    <option value="l">Laki-laki</option>
                    <option value="p">Perempuan</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--dash-text)" }}>
                    Tanggal Registrasi
                  </label>
                  <Calendar
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.value })}
                    selectionMode="range"
                    readOnlyInput
                    showIcon
                    icon="pi pi-calendar"
                    placeholder="Pilih rentang tanggal"
                    dateFormat="dd M yyyy"
                    monthNavigator
                    yearNavigator
                    yearRange="2020:2030"
                    style={{
                      width: "100%",
                    }}
                    inputStyle={{
                      width: "100%",
                      padding: "0.55rem 2.2rem 0.55rem 0.75rem",
                      border: "1px solid var(--dash-border)",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      background: "var(--dash-surface)",
                      color: "var(--dash-text)",
                      boxShadow: "none",
                      cursor: "pointer",
                    }}
                    panelStyle={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="customers-button customers-button--secondary"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleApplyFilter}
                  className="customers-button customers-button--primary"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Terapkan Filter
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}