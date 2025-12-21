"use client";

import { useState, useEffect } from "react";
import "@/styles/sales/customer.css";
import "@/styles/sales/admin.css";
import "@/styles/sales/leads-modal.css";
import "@/styles/sales/leads-detail.css";
import { toastError } from "@/lib/toast";

const BASE_URL = "/api";

export default function ViewLeadModal({ lead, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState("detail");
  const [followUps, setFollowUps] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get customer info from lead
  const customer = lead?.customer_rel || {};
  const customerName = customer.nama || lead?.nama || "-";
  const customerEmail = customer.email || lead?.email || "-";
  const customerPhone = customer.wa || lead?.wa || "-";
  const customerPendapatan = customer.pendapatan_bln || lead?.pendapatan || "-";

  // Fetch follow ups and activities
  useEffect(() => {
    if (lead?.id) {
      fetchFollowUps();
      fetchActivities();
    }
  }, [lead?.id]);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${BASE_URL}/sales/leads/${lead.id}/follow-ups`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setFollowUps(data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching follow ups:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${BASE_URL}/sales/leads/${lead.id}/activities`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setActivities(data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  };

  const formatPendapatan = (pendapatan) => {
    if (!pendapatan || pendapatan === "-" || pendapatan === 0) return "-";
    if (typeof pendapatan === "number") {
      return `Rp ${pendapatan.toLocaleString("id-ID")}`;
    }
    if (typeof pendapatan === "string") {
      const num = parseInt(pendapatan.replace(/[^\d]/g, ""));
      if (isNaN(num)) return "-";
      return `Rp ${num.toLocaleString("id-ID")}`;
    }
    return "-";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const formatActivityDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const getChannelIcon = (channel) => {
    const channelLower = channel?.toLowerCase() || "";
    if (channelLower.includes("whatsapp")) return "pi-whatsapp";
    if (channelLower.includes("telepon") || channelLower.includes("call")) return "pi-phone";
    if (channelLower.includes("email")) return "pi-envelope";
    if (channelLower.includes("meeting")) return "pi-calendar";
    return "pi-circle";
  };

  const getChannelColor = (channel) => {
    const channelLower = channel?.toLowerCase() || "";
    if (channelLower.includes("whatsapp")) return "#25d366";
    if (channelLower.includes("telepon") || channelLower.includes("call")) return "#6b7280";
    if (channelLower.includes("email")) return "#3b82f6";
    if (channelLower.includes("meeting")) return "#8b5cf6";
    return "#6b7280";
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card leads-detail-modal" style={{ width: "min(800px, 95vw)", maxHeight: "90vh" }}>
        {/* Header */}
        <div className="modal-header">
          <h2>Detail Lead</h2>
          <button className="modal-close" onClick={onClose} type="button" aria-label="Tutup modal">
            <i className="pi pi-times" />
          </button>
        </div>

        {/* Tabs */}
        <div className="leads-detail-tabs">
          <button
            type="button"
            className={`leads-detail-tab ${activeTab === "detail" ? "is-active" : ""}`}
            onClick={() => setActiveTab("detail")}
          >
            Detail
          </button>
          <button
            type="button"
            className={`leads-detail-tab ${activeTab === "followup" ? "is-active" : ""}`}
            onClick={() => setActiveTab("followup")}
          >
            Follow Up
          </button>
          <button
            type="button"
            className={`leads-detail-tab ${activeTab === "aktivitas" ? "is-active" : ""}`}
            onClick={() => setActiveTab("aktivitas")}
          >
            Aktivitas
          </button>
        </div>

        {/* Tab Content */}
        <div className="modal-body leads-detail-body" style={{ overflowY: "auto" }}>
          {/* Tab Detail */}
          {activeTab === "detail" && (
            <div className="leads-detail-content">
              {/* Customer Info */}
              <div className="leads-detail-section">
                <div className="leads-detail-customer-name">{customerName}</div>
                <div className="leads-detail-customer-info">
                  <div className="leads-detail-info-row">
                    <span className="leads-detail-info-label">Email:</span>
                    <span className="leads-detail-info-value">{customerEmail}</span>
                  </div>
                  <div className="leads-detail-info-row">
                    <span className="leads-detail-info-label">WhatsApp:</span>
                    <span className="leads-detail-info-value">{customerPhone}</span>
                  </div>
                  <div className="leads-detail-info-row">
                    <span className="leads-detail-info-label">Pendapatan:</span>
                    <span className="leads-detail-info-value">{formatPendapatan(customerPendapatan)}</span>
                  </div>
                </div>
              </div>

              {/* Lead Info */}
              <div className="leads-detail-section">
                <div className="leads-detail-field">
                  <span className="leads-detail-field-label">Label</span>
                  <span className="leads-detail-field-value">{lead?.label || "-"}</span>
                </div>
                <div className="leads-detail-field">
                  <span className="leads-detail-field-label">Status</span>
                  <span className={`leads-status ${lead?.status ? `status-${lead.status.toLowerCase()}` : "status-default"}`}>
                    {lead?.status ? lead.status.toUpperCase() : "-"}
                  </span>
                </div>
                <div className="leads-detail-field">
                  <span className="leads-detail-field-label">Minat Produk</span>
                  <span className="leads-detail-field-value">{lead?.minat_produk || "-"}</span>
                </div>
                <div className="leads-detail-field">
                  <span className="leads-detail-field-label">Last Contact</span>
                  <span className="leads-detail-field-value">{formatDate(lead?.last_contact)}</span>
                </div>
                <div className="leads-detail-field">
                  <span className="leads-detail-field-label">Next Follow Up</span>
                  <span className="leads-detail-field-value">{formatDate(lead?.next_followup)}</span>
                </div>
                <div className="leads-detail-field">
                  <span className="leads-detail-field-label">Alasan Tertarik</span>
                  <span className="leads-detail-field-value">{lead?.alasan_tertarik || "-"}</span>
                </div>
                <div className="leads-detail-field">
                  <span className="leads-detail-field-label">Alasan Belum</span>
                  <span className="leads-detail-field-value">{lead?.alasan_belum_membeli || "-"}</span>
                </div>
                <div className="leads-detail-field">
                  <span className="leads-detail-field-label">Harapan</span>
                  <span className="leads-detail-field-value">{lead?.harapan_customer || "-"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab Follow Up */}
          {activeTab === "followup" && (
            <div className="leads-detail-content">
              {loading ? (
                <div className="leads-detail-loading">Memuat data...</div>
              ) : followUps.length > 0 ? (
                <div className="leads-followup-list">
                  {followUps.map((followUp, i) => (
                    <div key={followUp.id || i} className="leads-followup-item">
                      <div className="leads-followup-date">{formatDate(followUp.created_at || followUp.tanggal)}</div>
                      <div className="leads-followup-content">
                        <div className="leads-followup-channel">
                          <i className={`pi ${getChannelIcon(followUp.channel)}`} style={{ color: getChannelColor(followUp.channel) }} />
                          <span>{followUp.channel || "-"}</span>
                        </div>
                        <div className="leads-followup-keterangan">{followUp.keterangan || followUp.type_aktivitas || "-"}</div>
                        {followUp.created_by && (
                          <div className="leads-followup-oleh">
                            Oleh: {followUp.created_by}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="leads-detail-empty">Tidak ada data follow up</div>
              )}
            </div>
          )}

          {/* Tab Aktivitas */}
          {activeTab === "aktivitas" && (
            <div className="leads-detail-content">
              {activities.length > 0 ? (
                <div className="leads-activity-timeline">
                  {activities.map((activity, i) => (
                    <div key={activity.id || i} className="leads-activity-item">
                      <div className="leads-activity-dot"></div>
                      <div className="leads-activity-content">
                        <div className="leads-activity-date">{formatActivityDate(activity.created_at || activity.tanggal)}</div>
                        <div className="leads-activity-type">{activity.type || activity.event || "-"}</div>
                        <div className="leads-activity-description">{activity.description || activity.keterangan || "-"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="leads-detail-empty">Tidak ada aktivitas</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer modal-footer--form">
          <button type="button" className="customers-button customers-button--secondary" onClick={onClose}>
            Tutup
          </button>
          <button
            type="button"
            className="customers-button customers-button--primary"
            onClick={() => {
              if (onEdit) {
                onEdit(lead);
                onClose();
              }
            }}
          >
            Edit Lead
          </button>
        </div>
      </div>
    </div>
  );
}

