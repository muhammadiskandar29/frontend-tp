"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { getCustomers, deleteCustomer } from "@/lib/sales/customer";
import { Users, CheckCircle, Filter, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import "@/styles/sales/dashboard-premium.css";
import "@/styles/sales/admin.css";
import "@/styles/sales/customers-premium.css";
import "@/styles/sales/leads.css";

import "@/styles/sales/shared-table.css";

// Lazy load modals
// Lazy load modals
const EditCustomerModal = dynamic(() => import("./editCustomer"), { ssr: false });
const ViewCustomerModal = dynamic(() => import("./viewCustomer"), { ssr: false });
const DeleteCustomerModal = dynamic(() => import("./deleteCustomer"), { ssr: false });
const AddCustomerModal = dynamic(() => import("./addCustomer"), { ssr: false });
const HistoryCustomerModal = dynamic(() => import("./historyCustomer"), { ssr: false });
const FollowupLogModal = dynamic(() => import("./followupLog"), { ssr: false });
const FilterCustomerModal = dynamic(() => import("./filterCustomer"), { ssr: false });
import CustomerOrderStatsCells from "./CustomerOrderStatsCells";

import { toastSuccess, toastError, toastWarning } from "@/lib/toast";

/**
 * Simple debounce hook to avoid rerunning expensive computations
 */
function useDebouncedValue(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

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
  const debouncedSearch = useDebouncedValue(searchInput, 500); // Debounce 500ms
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showView, setShowView] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showFollowupLog, setShowFollowupLog] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  // State untuk nested modal (dari viewCustomer)
  const [showEditFromView, setShowEditFromView] = useState(false);
  const [showDeleteFromView, setShowDeleteFromView] = useState(false);

  // Filter state
  const [verifikasiFilter, setVerifikasiFilter] = useState("all");
  const [salesFilter, setSalesFilter] = useState("all");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [salesOptions, setSalesOptions] = useState([]); // List sales untuk dropdown

  // Convert filter untuk API (termasuk search)
  const filters = useMemo(() => ({
    verifikasi: verifikasiFilter,
    status: "all",
    dateRange: null,
    jenis_kelamin: "all",
    sales_id: salesFilter, // Add sales_id filter
    search: debouncedSearch.trim() || null,
  }), [verifikasiFilter, salesFilter, debouncedSearch]);

  // Memoize summary statistics untuk performa
  const summaryStats = useMemo(() => {
    const verified = customers.filter((c) => c.verifikasi === "1" || c.verifikasi === true).length;
    const unverified = customers.filter((c) => c.verifikasi !== "1" && c.verifikasi !== true).length;
    return { verified, unverified };
  }, [customers]);

  const [userMap, setUserMap] = useState(new Map());

  // Fetch users untuk Sales mapping
  useEffect(() => {
    async function fetchUsers() {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const usersRes = await fetch("/api/admin/users", { headers });
        const usersJson = await usersRes.json();

        if (usersJson.success && Array.isArray(usersJson.data)) {
          const map = new Map();
          const options = [];

          usersJson.data.forEach((u) => {
            const userId = u.user_rel?.id || u.sales_rel?.id || u.user?.id || u.sales?.id || u.id;
            const nama = u.user_rel?.nama || u.sales_rel?.nama || u.user?.nama || u.sales?.nama || u.nama || u.name || `User #${userId}`;
            // Check division/role - assuming structure has user_rel.role or similar, or checking the array source
            // Based on context, we only want those explicitly marked as sales
            const role = u.user_rel?.role || u.role || "";

            if (userId) {
              map.set(String(userId), nama);
              // Only add to options if role is sales (case insensitive)
              if (role.toLowerCase() === 'sales') {
                options.push({ id: String(userId), text: nama });
              }
            }
          });
          setUserMap(map);
          setSalesOptions(options);
        }
      } catch (err) {
        console.error("Error fetching users for Sales mapping:", err);
      }
    }

    fetchUsers();
  }, []);

  const fetchingRef = useRef(false); // Prevent multiple simultaneous fetches

  // 🔹 Fetch customers dengan fallback pagination - optimized
  const fetchCustomers = useCallback(async (pageNumber = 1) => {
    // Prevent multiple simultaneous calls using ref
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      const result = await getCustomers(pageNumber, perPage, filters);

      if (result.success && result.data && Array.isArray(result.data)) {
        // Filter dan sort data di frontend untuk memastikan filter bekerja dengan benar
        let filteredData = [...result.data];

        // 🛡️ DOUBLE PROTECTION: Validasi Client-Side
        // Jika backend bocor/ignore filter, kita filter ulang di sini untuk kepastian UX

        // 1. Filter Verifikasi
        if (filters.verifikasi && filters.verifikasi !== "all") {
          // Handle "none" logic if necessary, though simpler to assume valid arrays or strings
          const wantVerified = Array.isArray(filters.verifikasi)
            ? filters.verifikasi.includes("verified")
            : filters.verifikasi === "verified";

          const wantUnverified = Array.isArray(filters.verifikasi)
            ? filters.verifikasi.includes("unverified")
            : filters.verifikasi === "unverified";

          // Jika user pilih keduanya (verified & unverified) -> Show All (no filter needed)
          // Jika user TIDAK pilih keduanya -> Show None
          // Jika pilih salah satu -> Filter

          if (wantVerified && !wantUnverified) {
            // Show ONLY Verified
            filteredData = filteredData.filter(c =>
              String(c.verifikasi) === "1" || c.verifikasi === true || c.verifikasi === 1
            );
          } else if (!wantVerified && wantUnverified) {
            // Show ONLY Unverified
            filteredData = filteredData.filter(c =>
              c.verifikasi === null || c.verifikasi === undefined ||
              String(c.verifikasi) === "0" || c.verifikasi === false || c.verifikasi === 0
            );
          } else if (!wantVerified && !wantUnverified) {
            // User uncheck both -> Show Empty
            filteredData = [];
          }
        }

        // 2. Filter Sales
        if (filters.sales_id && filters.sales_id !== "all") {
          const targetSalesId = String(filters.sales_id);
          filteredData = filteredData.filter(c => {
            // Robust check for Sales ID in various possible locations
            const sId1 = c.sales_id;
            const sId2 = c.sales_rel?.id;
            const sId3 = c.sales_rel?.user_id; // Potential alternative structure

            // Compare all potential IDs safely
            const match1 = sId1 !== undefined && sId1 !== null && String(sId1) === targetSalesId;
            const match2 = sId2 !== undefined && sId2 !== null && String(sId2) === targetSalesId;
            const match3 = sId3 !== undefined && sId3 !== null && String(sId3) === targetSalesId;

            return match1 || match2 || match3;
          });
        }

        // Sort data dari terbaru ke terlama berdasarkan create_at atau id
        filteredData.sort((a, b) => {
          // Prioritas: create_at jika ada, fallback ke id
          const dateA = a.create_at ? new Date(a.create_at).getTime() : 0;
          const dateB = b.create_at ? new Date(b.create_at).getTime() : 0;

          if (dateA !== 0 && dateB !== 0) {
            return dateB - dateA; // Terbaru di atas
          }

          // Fallback ke id jika create_at tidak ada
          const idA = a.id || 0;
          const idB = b.id || 0;
          return idB - idA; // ID lebih besar (terbaru) di atas
        });

        // Selalu replace data (bukan append) - setiap page menampilkan data yang berbeda
        setCustomers(filteredData);

        // Gunakan pagination object jika tersedia
        if (result.pagination && typeof result.pagination === 'object') {
          // Struktur pagination: { current_page, last_page, per_page, total }
          const isLastPage = result.pagination.current_page >= result.pagination.last_page;
          setHasMore(!isLastPage);
          setPaginationInfo(result.pagination);
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
        setCustomers([]);
        setHasMore(false);
      }

      setLoading(false);
      fetchingRef.current = false;
    } catch (err) {
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

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setPage(1);
    setCustomers([]);
    setHasMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, verifikasiFilter, salesFilter]); // Reset when search or filter changes

  // Fetch data saat page atau filters berubah
  useEffect(() => {
    if (page > 0) {
      fetchCustomers(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]); // Depend pada page dan filters

  // 🔹 Next page
  const handleNextPage = useCallback(() => {
    if (loading || !hasMore) return;
    setPage(prev => prev + 1);
  }, [hasMore, loading]);

  // 🔹 Previous page
  const handlePrevPage = useCallback(() => {
    if (loading || page <= 1) return;
    setPage(prev => prev - 1);
  }, [page, loading]);

  // 🔹 Helpers
  const closeAllModals = () => {
    setShowEdit(false);
    setShowDelete(false);
    setShowView(false);
    setShowAdd(false);
    setShowEditFromView(false);
    setShowDeleteFromView(false);
    setShowFilterModal(false);
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

  const handleSuccessEdit = (message, updatedCustomer) => {
    requestRefresh(message);
    setShowEdit(false);

    // If we have an updated customer object, update the state so modals (like View) reflect changes
    if (updatedCustomer) {
      setSelectedCustomer(updatedCustomer);
    }
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

  // 🔹 Handler untuk edit dari viewCustomer modal
  const handleEditFromView = (cust) => {
    // Biarkan viewCustomer modal tetap terbuka, buka editCustomer modal di atasnya
    setSelectedCustomer(cust);
    setShowEditFromView(true);
  };

  // 🔹 Handler untuk delete dari viewCustomer modal
  const handleDeleteFromView = (cust) => {
    // Biarkan viewCustomer modal tetap terbuka, buka deleteCustomer modal di atasnya
    setSelectedCustomer(cust);
    setShowDeleteFromView(true);
  };

  const handleHistory = (cust) => {
    setSelectedCustomer(cust);
    setShowHistory(true);
  };

  const handleFollowupLog = (cust) => {
    setSelectedCustomer(cust);
    setShowFollowupLog(true);
  };

  // 🔹 Filter handler from Modal
  const handleFilterApply = (newFilters) => {
    setVerifikasiFilter(newFilters.verifikasi);
    setSalesFilter(newFilters.sales_id);
    setPage(1); // Reset to page 1 when filter changes
  };

  return (
    <Layout title="Manage Customers">
      <div className="dashboard-shell customers-shell table-shell">
        <section className="dashboard-summary customers-summary">
          <article className="summary-card summary-card--combined summary-card--three-cols">
            <div className="summary-card__column">
              <div className={`summary-card__icon accent-orange`}>
                <Users size={22} />
              </div>
              <div>
                <p className="summary-card__label">Total customers</p>
                <p className="summary-card__value">{paginationInfo?.total || customers.length}</p>
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
                  {summaryStats.verified}
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
                  {summaryStats.unverified}
                </p>
              </div>
            </div>
          </article>
        </section>
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
            <div className="customers-filters" aria-label="Filter pelanggan" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {/* Filter Button */}
              <button
                type="button"
                className="filter-btn-orange"
                onClick={() => setShowFilterModal(true)}
                style={{
                  backgroundColor: "white",
                  border: "1px solid #fab005",
                  color: "#fab005",
                  padding: "8px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "40px",
                  width: "40px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fff9db"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                title="Filter Data"
              >
                <Filter size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>
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

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {/* Sticky 1: Member ID */}
                  <th className="sticky-left-1">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>MEMBER</span>
                      <span>ID</span>
                    </div>
                  </th>
                  {/* Sticky 2: Nama */}
                  <th className="sticky-left-2">NAMA</th>
                  <th>EMAIL</th>
                  <th>NO WA</th>
                  <th>VERIFIKASI</th>
                  <th>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>PESANAN</span>
                      <span>SUKSES</span>
                    </div>
                  </th>
                  <th>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>TOTAL NET</span>
                      <span>REVENUE</span>
                    </div>
                  </th>

                </tr>
              </thead>
              <tbody>
                {loading && customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="table-empty">Loading data...</td>
                  </tr>
                ) : customers.length > 0 ? (
                  customers.map((cust, i) => (
                    <tr key={cust.id || `${cust.email}-${i}`}>
                      {/* Sticky 1: Member ID */}
                      <td className="sticky-left-1" style={{ fontWeight: 500 }}>
                        {cust.memberID || "-"}
                      </td>

                      {/* Sticky 2: Nama */}
                      <td className="sticky-left-2">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span
                            style={{ color: '#0ea5e9', fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => handleView(cust)}
                          >
                            {cust.nama || "-"}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                            Sales: {cust.sales_rel?.nama || userMap.get(String(cust.sales_id)) || cust.sales_nama || "-"}
                          </span>
                        </div>
                      </td>

                      <td>{cust.email || "-"}</td>

                      <td>
                        {cust.wa ? (
                          <a
                            href={`https://wa.me/${cust.wa.replace(/[^0-9]/g, "").replace(/^0/, "62")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#25D366', textDecoration: 'none' }}
                            title={`Chat WhatsApp ${cust.wa}`}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            <span>{cust.wa}</span>
                          </a>
                        ) : "-"}
                      </td>

                      <td>
                        <span
                          className={`customers-verif-tag ${cust.verifikasi === "1" || cust.verifikasi === true ? "is-verified" : "is-unverified"
                            }`}
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            backgroundColor: cust.verifikasi === "1" || cust.verifikasi === true ? '#ecfdf5' : '#fef2f2',
                            color: cust.verifikasi === "1" || cust.verifikasi === true ? '#059669' : '#dc2626',
                            border: `1px solid ${cust.verifikasi === "1" || cust.verifikasi === true ? '#34d399' : '#f87171'}`
                          }}
                        >
                          {cust.verifikasi === "1" || cust.verifikasi === true ? "Verified" : "Unverified"}
                        </span>
                      </td>

                      {/* Stats Cells: Auto Fetch */}
                      <CustomerOrderStatsCells customerId={cust.id} />

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="table-empty">
                      {debouncedSearch.trim() ? "Tidak ada hasil pencarian." : "Tidak ada data customer"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
            onEdit={handleEditFromView}
            onDelete={handleDeleteFromView}
          />
        )}

        {/* Nested modals dari viewCustomer - dengan z-index lebih tinggi */}
        {showEditFromView && selectedCustomer && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1001 }}>
            <EditCustomerModal
              customer={selectedCustomer}
              onClose={() => {
                setShowEditFromView(false);
                // Jangan set selectedCustomer ke null, biarkan viewCustomer modal tetap terbuka
              }}
              onSuccess={(msg, updatedCustomer) => {
                requestRefresh(msg);
                setShowEditFromView(false);

                // Update selectedCustomer with new data to refresh View Modal immediately
                if (updatedCustomer) {
                  setSelectedCustomer(updatedCustomer);
                }
              }}
            />
          </div>
        )}

        {showDeleteFromView && selectedCustomer && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1001 }}>
            <DeleteCustomerModal
              customer={selectedCustomer}
              onClose={() => {
                setShowDeleteFromView(false);
                // Jangan set selectedCustomer ke null, biarkan viewCustomer modal tetap terbuka
              }}
              onConfirm={async () => {
                try {
                  await deleteCustomer(selectedCustomer.id);
                  requestRefresh("Customer berhasil dihapus!", "warning");
                  // Tutup semua modal setelah delete
                  setShowDeleteFromView(false);
                  setShowView(false);
                  setSelectedCustomer(null);
                } catch (err) {
                  console.error("Error deleting customer:", err);
                  toastError("Gagal menghapus customer");
                  setShowDeleteFromView(false);
                }
              }}
            />
          </div>
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

        {showFilterModal && (
          <FilterCustomerModal
            onClose={() => setShowFilterModal(false)}
            onApply={handleFilterApply}
            currentFilters={{ verifikasi: verifikasiFilter, sales_id: salesFilter }}
            salesOptions={salesOptions}
          />
        )}

      </div>
    </Layout>
  );
}