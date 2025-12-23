"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { Users, RefreshCw, Plus, Sparkles, Filter, ChevronDown, Eye, Edit, MessageSquare } from "lucide-react";
import dynamic from "next/dynamic";
import "@/styles/sales/dashboard-premium.css";
import "@/styles/sales/admin.css";
import "@/styles/sales/leads.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import { toastSuccess, toastError, toastWarning } from "@/lib/toast";

const BASE_URL = "/api";

// Lazy load modals
const AddFollowUpModal = dynamic(() => import("../leads/addFollowUp"), { ssr: false });
const ViewLeadModal = dynamic(() => import("../leads/viewLead"), { ssr: false });
const EditLeadModal = dynamic(() => import("../leads/editLead"), { ssr: false });
const SendWhatsAppModal = dynamic(() => import("../leads/sendWhatsApp"), { ssr: false });

const LEADS_COLUMNS = [
  "Nama Customer",
  "Label",
  "Status",
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

export default function CRMPage() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState("all");
  const [labelOptions, setLabelOptions] = useState([{ value: "all", label: "Semua Label" }]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [paginationInfo, setPaginationInfo] = useState(null);
  const perPage = 15;
  const fetchingRef = useRef(false);
  
  // Modal states
  const [showSendWhatsApp, setShowSendWhatsApp] = useState(false);
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [showViewLead, setShowViewLead] = useState(false);
  const [showEditLead, setShowEditLead] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Statistics
  const [statistics, setStatistics] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    converted: 0,
  });
  
  // Fetch label options
  const fetchLabelOptions = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`/api/sales/lead?per_page=1`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.label_options && Array.isArray(json.label_options)) {
          setLabelOptions([
            { value: "all", label: "Semua Label" },
            ...json.label_options.map((label) => ({ value: label, label: label })),
          ]);
        }
      }
    } catch (err) {
      console.error("Error fetching label options:", err);
    }
  }, []);
  
  // Fetch leads data dengan pagination
  const fetchLeads = useCallback(async (pageNumber = 1) => {
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

      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", pageNumber.toString());
      params.append("per_page", perPage.toString());
      
      // Add filters
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter.toUpperCase());
      }
      if (labelFilter && labelFilter !== "all") {
        params.append("lead_label", labelFilter);
      }
      if (searchInput && searchInput.trim()) {
        params.append("search", searchInput.trim());
      }

      const res = await fetch(`/api/sales/lead?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      
      if (json.success && json.data && Array.isArray(json.data)) {
        setLeads(json.data);

        const currentPageLabels = [...new Set(json.data.map((lead) => lead.lead_label).filter(Boolean))];
        setLabelOptions((prev) => {
          const existingValues = new Set(prev.map((opt) => opt.value));
          const newLabels = currentPageLabels.filter((label) => !existingValues.has(label));
          if (newLabels.length > 0) {
            return [
              ...prev,
              ...newLabels.map((label) => ({ value: label, label: label })),
            ];
          }
          return prev;
        });

        if (json.pagination && typeof json.pagination === "object") {
          const isLastPage = json.pagination.current_page >= json.pagination.last_page;
          setHasMore(!isLastPage);
          setPaginationInfo(json.pagination);
        } else {
          setPaginationInfo(null);
          if (json.data.length < perPage) {
            setHasMore(false);
          } else {
            setHasMore(true);
          }
        }

        if (json.pagination && json.pagination.total) {
          setStatistics({
            total: json.pagination.total || json.data.length,
            new: json.data.filter((l) => l.status?.toLowerCase() === "new").length,
            contacted: json.data.filter((l) => l.status?.toLowerCase() === "contacted").length,
            converted: json.data.filter((l) => l.status?.toLowerCase() === "converted").length,
          });
        } else {
          setStatistics({
            total: json.data.length,
            new: json.data.filter((l) => l.status?.toLowerCase() === "new").length,
            contacted: json.data.filter((l) => l.status?.toLowerCase() === "contacted").length,
            converted: json.data.filter((l) => l.status?.toLowerCase() === "converted").length,
          });
        }
      } else {
        console.warn("⚠️ Unexpected response format (leads):", json);
        setLeads([]);
        setHasMore(false);
        setPaginationInfo(null);
      }
      
      setLoading(false);
      fetchingRef.current = false;
    } catch (err) {
      console.error("❌ Error fetching leads:", err);
      toastError("Gagal memuat data leads");
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [statusFilter, labelFilter, searchInput, perPage]);

  // Initial load
  useEffect(() => {
    fetchLabelOptions();
    fetchLeads(1);
  }, []);

  // Refetch when filters change
  useEffect(() => {
    setPage(1);
    fetchLeads(1);
  }, [statusFilter, labelFilter, searchInput]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeads(1);
  };

  const handleRefresh = () => {
    fetchLeads(page);
  };

  const handleViewLead = (lead) => {
    setSelectedLead(lead);
    setShowViewLead(true);
  };

  const handleEditLead = (lead) => {
    setSelectedLead(lead);
    setShowEditLead(true);
  };

  const handleAddFollowUp = (lead) => {
    setSelectedLead(lead);
    setShowAddFollowUp(true);
  };

  const handleSendWhatsApp = (lead) => {
    setSelectedLead(lead);
    setShowSendWhatsApp(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = status?.toLowerCase() || "";
    switch (statusLower) {
      case "new":
        return "badge badge--new";
      case "contacted":
        return "badge badge--contacted";
      case "qualified":
        return "badge badge--qualified";
      case "converted":
        return "badge badge--converted";
      case "lost":
        return "badge badge--lost";
      default:
        return "badge";
    }
  };

  return (
    <Layout title="CRM">
      <div className="admin-shell">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">CRM - Customer Relationship Management</h1>
            <p className="admin-subtitle">Kelola leads dan follow up customer</p>
          </div>
          <div className="admin-header-actions">
            <button
              onClick={handleRefresh}
              className="btn btn--icon"
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: "#FEF3C7" }}>
              <Users size={20} style={{ color: "#F59E0B" }} />
            </div>
            <div>
              <p className="stat-card__label">Total Leads</p>
              <p className="stat-card__value">{statistics.total}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: "#DBEAFE" }}>
              <Sparkles size={20} style={{ color: "#3B82F6" }} />
            </div>
            <div>
              <p className="stat-card__label">New</p>
              <p className="stat-card__value">{statistics.new}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: "#D1FAE5" }}>
              <MessageSquare size={20} style={{ color: "#10B981" }} />
            </div>
            <div>
              <p className="stat-card__label">Contacted</p>
              <p className="stat-card__value">{statistics.contacted}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: "#FCE7F3" }}>
              <Users size={20} style={{ color: "#EC4899" }} />
            </div>
            <div>
              <p className="stat-card__label">Converted</p>
              <p className="stat-card__value">{statistics.converted}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <form onSubmit={handleSearch} className="admin-search">
            <input
              type="text"
              placeholder="Cari nama customer, email, atau nomor telepon..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input input--search"
            />
            <button type="submit" className="btn btn--primary">
              Cari
            </button>
          </form>

          <div className="admin-filter-group">
            <div className="dropdown-wrapper">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="btn btn--outline dropdown-trigger"
              >
                <Filter size={16} />
                Status: {STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label || "Semua"}
                <ChevronDown size={16} />
              </button>
              {showStatusDropdown && (
                <div className="dropdown-menu">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setShowStatusDropdown(false);
                      }}
                      className={`dropdown-item ${statusFilter === option.value ? "active" : ""}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="dropdown-wrapper">
              <button
                onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                className="btn btn--outline dropdown-trigger"
              >
                <Filter size={16} />
                Label: {labelOptions.find((opt) => opt.value === labelFilter)?.label || "Semua"}
                <ChevronDown size={16} />
              </button>
              {showLabelDropdown && (
                <div className="dropdown-menu">
                  {labelOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setLabelFilter(option.value);
                        setShowLabelDropdown(false);
                      }}
                      className={`dropdown-item ${labelFilter === option.value ? "active" : ""}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-wrapper">
          {loading && leads.length === 0 ? (
            <div className="admin-empty">
              <RefreshCw size={32} className="spin" />
              <p>Memuat data...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="admin-empty">
              <Users size={32} />
              <p>Belum ada data leads</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  {LEADS_COLUMNS.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div>
                        <strong>{lead.nama_customer || "-"}</strong>
                        {lead.email && <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>{lead.email}</div>}
                        {lead.no_telp && <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>{lead.no_telp}</div>}
                      </div>
                    </td>
                    <td>
                      <span className="badge">{lead.lead_label || "-"}</span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(lead.status)}>
                        {lead.status || "-"}
                      </span>
                    </td>
                    <td>{lead.minat_produk || "-"}</td>
                    <td>{formatDate(lead.last_contact)}</td>
                    <td>{formatDate(lead.next_follow_up)}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          onClick={() => handleViewLead(lead)}
                          className="btn btn--icon btn--sm"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditLead(lead)}
                          className="btn btn--icon btn--sm"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleAddFollowUp(lead)}
                          className="btn btn--icon btn--sm"
                          title="Follow Up"
                        >
                          <MessageSquare size={16} />
                        </button>
                        {lead.no_telp && (
                          <button
                            onClick={() => handleSendWhatsApp(lead)}
                            className="btn btn--icon btn--sm"
                            title="Kirim WhatsApp"
                          >
                            <MessageSquare size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {paginationInfo && paginationInfo.last_page > 1 && (
          <div className="admin-pagination">
            <button
              onClick={() => {
                if (page > 1) {
                  setPage(page - 1);
                  fetchLeads(page - 1);
                }
              }}
              disabled={page === 1 || loading}
              className="btn btn--outline"
            >
              Previous
            </button>
            <span className="admin-pagination-info">
              Halaman {paginationInfo.current_page} dari {paginationInfo.last_page} (Total: {paginationInfo.total})
            </span>
            <button
              onClick={() => {
                if (hasMore) {
                  setPage(page + 1);
                  fetchLeads(page + 1);
                }
              }}
              disabled={!hasMore || loading}
              className="btn btn--outline"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showViewLead && selectedLead && (
        <ViewLeadModal
          isOpen={showViewLead}
          onClose={() => {
            setShowViewLead(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onRefresh={handleRefresh}
        />
      )}

      {showEditLead && selectedLead && (
        <EditLeadModal
          isOpen={showEditLead}
          onClose={() => {
            setShowEditLead(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onRefresh={handleRefresh}
        />
      )}

      {showAddFollowUp && selectedLead && (
        <AddFollowUpModal
          isOpen={showAddFollowUp}
          onClose={() => {
            setShowAddFollowUp(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onRefresh={handleRefresh}
        />
      )}

      {showSendWhatsApp && selectedLead && (
        <SendWhatsAppModal
          isOpen={showSendWhatsApp}
          onClose={() => {
            setShowSendWhatsApp(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
        />
      )}
    </Layout>
  );
}

