"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { Users, RefreshCw, Plus, Sparkles, Filter, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import "@/styles/sales/dashboard-premium.css";
import "@/styles/sales/admin.css";
import "@/styles/sales/leads.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import { toastSuccess, toastError, toastWarning } from "@/lib/toast";

const BASE_URL = "/api";

// Lazy load modals
const AddLeadModal = dynamic(() => import("./addLead"), { ssr: false });
const GenerateLeadsModal = dynamic(() => import("./generateLeads"), { ssr: false });
const BroadcastLeadModal = dynamic(() => import("./broadcastLead"), { ssr: false });

const LEADS_COLUMNS = [
  "Nama Customer",
  "Label",
  "Status",
  "Assign Sales",
  "Minat Produk",
  "Last Contact",
  "Next Follow Up",
  "Aksi",
];

// Status options untuk dropdown
const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

// Label options untuk dropdown
const LABEL_OPTIONS = [
  { value: "all", label: "Semua Label" },
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
];

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  
  // Modal states
  const [showAddLead, setShowAddLead] = useState(false);
  const [showGenerateLeads, setShowGenerateLeads] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);

  // Statistics
  const [statistics, setStatistics] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    converted: 0,
  });
  
  const [needsRefresh, setNeedsRefresh] = useState(true);

  // Fetch leads data
  useEffect(() => {
    if (!needsRefresh) return;
    
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        // TODO: Replace with actual API call
        const res = await fetch(`${BASE_URL}/sales/leads`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setLeads(data.data);
            
            // Calculate statistics
            setStatistics({
              total: data.data.length,
              new: data.data.filter((l) => l.status?.toLowerCase() === "new").length,
              contacted: data.data.filter((l) => l.status?.toLowerCase() === "contacted").length,
              converted: data.data.filter((l) => l.status?.toLowerCase() === "converted").length,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching leads:", err);
        toastError("Gagal memuat data leads");
      } finally {
        setLoading(false);
        setNeedsRefresh(false);
      }
    };

    fetchLeads();
  }, [needsRefresh]);

  // Filter leads berdasarkan search, status, dan label
  const filteredLeads = useMemo(() => {
    let filtered = [...leads];

    // Filter by search
    if (searchInput.trim()) {
      const searchLower = searchInput.toLowerCase().trim();
      filtered = filtered.filter((lead) => {
        const nama = lead.nama?.toLowerCase() || "";
        const email = lead.email?.toLowerCase() || "";
        const wa = lead.wa?.toLowerCase() || "";
        const produk = lead.minat_produk?.toLowerCase() || "";
        return (
          nama.includes(searchLower) ||
          email.includes(searchLower) ||
          wa.includes(searchLower) ||
          produk.includes(searchLower)
        );
      });
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((lead) => {
        const leadStatus = lead.status?.toLowerCase() || "";
        return leadStatus === statusFilter.toLowerCase();
      });
    }

    // Filter by label
    if (labelFilter !== "all") {
      filtered = filtered.filter((lead) => {
        const leadLabel = lead.label?.toLowerCase() || "";
        return leadLabel === labelFilter.toLowerCase();
      });
    }

    return filtered;
  }, [leads, searchInput, statusFilter, labelFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeads = useMemo(() => {
    return filteredLeads.slice(startIndex, endIndex);
  }, [filteredLeads, startIndex, endIndex]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput, statusFilter, labelFilter]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".leads-filter-dropdown")) {
        setShowStatusDropdown(false);
        setShowLabelDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Implement API call
      // const data = await getLeads();
      // setLeads(data);
      toastSuccess("Data berhasil diperbarui");
    } catch (err) {
      toastError("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBroadcast = () => {
    setShowBroadcast(true);
  };

  const handleAddLead = () => {
    setShowAddLead(true);
  };

  const handleGenerateLeads = () => {
    setShowGenerateLeads(true);
  };

  const handleModalSuccess = (message) => {
    toastSuccess(message);
    setNeedsRefresh(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const getStatusClass = (status) => {
    const statusLower = status?.toLowerCase() || "";
    const statusMap = {
      new: "status-new",
      contacted: "status-contacted",
      qualified: "status-qualified",
      converted: "status-converted",
      lost: "status-lost",
    };
    return statusMap[statusLower] || "status-default";
  };

  const getLabelClass = (label) => {
    const labelLower = label?.toLowerCase() || "";
    const labelMap = {
      hot: "label-hot",
      warm: "label-warm",
      cold: "label-cold",
    };
    return labelMap[labelLower] || "label-default";
  };

  return (
    <Layout>
      <div className="dashboard-shell leads-shell">
        {/* Summary Cards */}
        <section className="dashboard-summary leads-summary">
          <article className="summary-card summary-card--combined summary-card--four-cols">
            <div className="summary-card__column">
              <div className="summary-card__icon accent-orange">
                <Users size={24} />
              </div>
              <div>
                <p className="summary-card__label">Total Leads</p>
                <p className="summary-card__value">{statistics.total}</p>
              </div>
            </div>
            <div className="summary-card__divider"></div>
            <div className="summary-card__column">
              <div className="summary-card__icon accent-orange">
                <Users size={24} />
              </div>
              <div>
                <p className="summary-card__label">New Leads</p>
                <p className="summary-card__value">{statistics.new}</p>
              </div>
            </div>
            <div className="summary-card__divider"></div>
            <div className="summary-card__column">
              <div className="summary-card__icon accent-orange">
                <Users size={24} />
              </div>
              <div>
                <p className="summary-card__label">Contacted</p>
                <p className="summary-card__value">{statistics.contacted}</p>
              </div>
            </div>
            <div className="summary-card__divider"></div>
            <div className="summary-card__column">
              <div className="summary-card__icon accent-orange">
                <Users size={24} />
              </div>
              <div>
                <p className="summary-card__label">Converted</p>
                <p className="summary-card__value">{statistics.converted}</p>
              </div>
            </div>
          </article>
        </section>

        {/* Toolbar */}
        <section className="dashboard-hero leads-hero">
          <div className="orders-toolbar">
            <div className="orders-search">
              <input
                type="search"
                placeholder="Cari nama, email, atau produk..."
                className="orders-search__input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <span className="orders-search__icon pi pi-search" />
            </div>
            <div className="orders-toolbar-buttons">
              {/* Status Filter Dropdown */}
              <div className="leads-filter-dropdown" style={{ position: "relative" }}>
                <button
                  type="button"
                  className={`leads-filter-btn ${statusFilter !== "all" ? "is-active" : ""}`}
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowLabelDropdown(false);
                  }}
                >
                  {STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label || "Semua Status"}
                  <ChevronDown size={16} style={{ marginLeft: "0.5rem" }} />
                </button>
                {showStatusDropdown && (
                  <div className="leads-filter-dropdown-menu">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`leads-filter-dropdown-item ${statusFilter === option.value ? "is-selected" : ""}`}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setShowStatusDropdown(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Label Filter Dropdown */}
              <div className="leads-filter-dropdown" style={{ position: "relative" }}>
                <button
                  type="button"
                  className={`leads-filter-btn ${labelFilter !== "all" ? "is-active" : ""}`}
                  onClick={() => {
                    setShowLabelDropdown(!showLabelDropdown);
                    setShowStatusDropdown(false);
                  }}
                >
                  {LABEL_OPTIONS.find((opt) => opt.value === labelFilter)?.label || "Semua Label"}
                  <ChevronDown size={16} style={{ marginLeft: "0.5rem" }} />
                </button>
                {showLabelDropdown && (
                  <div className="leads-filter-dropdown-menu">
                    {LABEL_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`leads-filter-dropdown-item ${labelFilter === option.value ? "is-selected" : ""}`}
                        onClick={() => {
                          setLabelFilter(option.value);
                          setShowLabelDropdown(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                className="customers-button customers-button--secondary"
                onClick={handleBroadcast}
                title="Broadcast"
              >
                <span style={{ marginRight: "0.5rem" }}>📢</span>
                Broadcast
              </button>
              <button
                type="button"
                className="customers-button customers-button--secondary"
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh"
              >
                <RefreshCw size={16} style={{ marginRight: "0.5rem" }} />
                Refresh
              </button>
              <button
                type="button"
                className="customers-button customers-button--primary"
                onClick={handleAddLead}
                title="Tambah Lead"
              >
                <Plus size={16} style={{ marginRight: "0.5rem" }} />
                Tambah Lead
              </button>
              <button
                type="button"
                className="customers-button customers-button--primary"
                onClick={handleGenerateLeads}
                title="Generate Leads"
              >
                <Sparkles size={16} style={{ marginRight: "0.5rem" }} />
                Generate Leads
              </button>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="panel leads-panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">CRM / Leads Management</p>
              <h3 className="panel__title">Daftar Leads</h3>
            </div>
          </div>

          <div className="leads-table__wrapper">
            <div className="leads-table">
              <div className="leads-table__head">
                {LEADS_COLUMNS.map((column) => (
                  <span key={column}>{column}</span>
                ))}
              </div>
              <div className="leads-table__body">
                {paginatedLeads.length > 0 ? (
                  paginatedLeads.map((lead, i) => (
                    <div key={lead.id || i} className="leads-table__row">
                      <span className="leads-table__cell">{lead.nama || "-"}</span>
                      <span className="leads-table__cell">
                        {lead.label ? (
                          <span className={`leads-label ${getLabelClass(lead.label)}`}>
                            {lead.label}
                          </span>
                        ) : (
                          "-"
                        )}
                      </span>
                      <span className="leads-table__cell">
                        {lead.status ? (
                          <span className={`leads-status ${getStatusClass(lead.status)}`}>
                            {lead.status}
                          </span>
                        ) : (
                          "-"
                        )}
                      </span>
                      <span className="leads-table__cell">{lead.assign_sales || "-"}</span>
                      <span className="leads-table__cell">{lead.minat_produk || "-"}</span>
                      <span className="leads-table__cell">{formatDate(lead.last_contact)}</span>
                      <span className="leads-table__cell">{formatDate(lead.next_followup)}</span>
                      <span className="leads-table__cell leads-table__cell--actions">
                        <div className="leads-table__actions">
                          <button
                            className="leads-table__action-btn"
                            onClick={() => {
                              // TODO: Implement view/edit action
                              toastWarning("Fitur aksi akan segera tersedia");
                            }}
                            title="Lihat Detail"
                          >
                            <span className="pi pi-eye" />
                          </button>
                          <button
                            className="leads-table__action-btn"
                            onClick={() => {
                              // TODO: Implement edit action
                              toastWarning("Fitur edit akan segera tersedia");
                            }}
                            title="Edit"
                          >
                            <span className="pi pi-pencil" />
                          </button>
                        </div>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="leads-table__row">
                    <div className="leads-table__empty">
                      <p>Tidak ada data leads</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="customers-pagination">
              <button
                className="customers-pagination__btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="customers-pagination__info">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                className="customers-pagination__btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {showAddLead && (
        <AddLeadModal
          onClose={() => setShowAddLead(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {showGenerateLeads && (
        <GenerateLeadsModal
          onClose={() => setShowGenerateLeads(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {showBroadcast && (
        <BroadcastLeadModal
          onClose={() => setShowBroadcast(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </Layout>
  );
}

