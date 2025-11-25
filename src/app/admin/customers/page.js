"use client";

import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
import Layout from "@/components/Layout";
import { getCustomers, deleteCustomer } from "@/lib/customer";
import dynamic from "next/dynamic";
import "@/styles/dashboard.css";
import "@/styles/admin.css";
import "@/styles/customer.css";

// Lazy load modals
const EditCustomerModal = dynamic(() => import("./editCustomer"), { ssr: false });
const ViewCustomerModal = dynamic(() => import("./viewCustomer"), { ssr: false });
const DeleteCustomerModal = dynamic(() => import("./deleteCustomer"), { ssr: false });
const AddCustomerModal = dynamic(() => import("./addCustomer"), { ssr: false });
const HistoryCustomerModal = dynamic(() => import("./historyCustomer"), { ssr: false });

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

const DEFAULT_TOAST = { show: false, message: "", type: "success" };
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
  const [customers, setCustomers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showView, setShowView] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const [toast, setToast] = useState(DEFAULT_TOAST);
  const [followupMap, setFollowupMap] = useState({});
  const [followupLoading, setFollowupLoading] = useState({});
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ show: false, message: "", type });
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
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
        showToast("Gagal memuat data customer", "error");
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
      if (!term) return true;
      return [c.nama, c.email, c.wa].some((field) => field?.toLowerCase().includes(term));
    });
  }, [customers, debouncedSearch]);

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
  }, [debouncedSearch]);

  const FOLLOWUP_TYPES = {
    1: { label: "Follow Up 1" },
    2: { label: "Follow Up 2" },
    3: { label: "Follow Up 3" },
    4: { label: "Follow Up 4" },
    5: { label: "Register" },
    6: { label: "Processing" },
    7: { label: "Selesai" },
    8: { label: "Upselling" },
    9: { label: "Redirect" },
  };

  const fetchFollowupStatus = useCallback(
    async (customerId) => {
      if (!customerId || followupLoading[customerId] || followupMap[customerId] !== undefined)
        return;

      setFollowupLoading((prev) => ({ ...prev, [customerId]: true }));
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(`/api/admin/customer/followup/${customerId}`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.success && Array.isArray(data.data)) {
          const uniqueTypes = Array.from(
            new Set(
              data.data
                .map((item) => Number(item.follup ?? item.follup_rel?.type ?? item.type))
                .filter((type) => !Number.isNaN(type))
            )
          );
          setFollowupMap((prev) => ({ ...prev, [customerId]: uniqueTypes }));
        } else {
          setFollowupMap((prev) => ({ ...prev, [customerId]: [] }));
        }
      } catch (err) {
        console.error("❌ [FOLLOWUP] fetch error:", err);
        setFollowupMap((prev) => ({ ...prev, [customerId]: [] }));
      } finally {
        setFollowupLoading((prev) => ({ ...prev, [customerId]: false }));
      }
    },
    [followupLoading, followupMap]
  );

  useEffect(() => {
    paginatedData.forEach((cust) => {
      if (cust?.id) {
        fetchFollowupStatus(cust.id);
      }
    });
  }, [paginatedData, fetchFollowupStatus]);

  // 🔹 Helpers
  const closeAllModals = () => {
    setShowEdit(false);
    setShowDelete(false);
    setShowView(false);
    setShowAdd(false);
    setSelectedCustomer(null);
  };

  const requestRefresh = (message, type = "success") => {
    showToast(message, type);
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
      requestRefresh("🚫 Customer berhasil dihapus!", "warning");
    } catch (err) {
      console.error("Error deleting customer:", err);
      showToast("❌ Gagal menghapus customer", "error");
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

  return (
    <Layout title="Customers | One Dashboard">
      <div className="dashboard-shell customers-shell">
        <section className="dashboard-hero customers-hero">
          <div className="dashboard-hero__copy">
            <p className="dashboard-hero__eyebrow">Customers</p>
            <h2 className="dashboard-hero__title">Customer Directory</h2>
            <span className="dashboard-hero__meta">
              Monitor buying journeys and keep contact data in sync.
            </span>
          </div>

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
            <button className="customers-button customers-button--primary" onClick={() => setShowAdd(true)}>
              + Tambah Customer
            </button>
          </div>
        </section>

        <section className="dashboard-summary customers-summary">
          {[
            {
              label: "Total customers",
              value: customers.length,
              accent: "accent-emerald",
              icon: "🧑‍🤝‍🧑",
            },
            {
              label: "Verified",
              value: customers.filter((c) => c.verifikasi === "1" || c.verifikasi === true).length,
              accent: "accent-indigo",
              icon: "✅",
            },
            {
              label: "Active (filtered)",
              value: filtered.length,
              accent: "accent-amber",
              icon: "📘",
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

        <section className="panel customers-panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Directory</p>
              <h3 className="panel__title">Customer roster</h3>
            </div>
            <span className="panel__meta">{filtered.length} aktif</span>
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
                      {cust.wa || "-"}
                    </div>
                    <div className="customers-table__cell" data-label="Follow Up">
                      {followupLoading[cust.id] ? (
                        <span className="followup-chip followup-chip--loading">Memuat…</span>
                      ) : (followupMap[cust.id]?.length || 0) > 0 ? (
                        <div className="followup-chip-list">
                          {followupMap[cust.id].map((type) => (
                            <span key={`${cust.id}-${type}`} className="followup-chip">
                              {FOLLOWUP_TYPES[type]?.label || `Type ${type}`}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="followup-chip followup-chip--empty">Belum ada</span>
                      )}
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
                        {cust.verifikasi === "1" || cust.verifikasi === true ? "Sudah" : "Belum"}
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

        {/* TOAST */}
        {toast.show && (
          <div
            className={`toast ${toast.type === "error" ? "toast-error" : ""} ${
              toast.type === "warning" ? "toast-warning" : ""
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </Layout>
  );
}