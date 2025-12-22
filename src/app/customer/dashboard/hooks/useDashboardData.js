"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCustomerSession } from "@/lib/customerAuth";
import { fetchCustomerDashboard } from "@/lib/customerDashboard";

export function useDashboardData() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    stats: [
      { id: "total", label: "Total Order", value: 0, icon: "📦" },
      { id: "active", label: "Order Aktif", value: 0, icon: "✅" },
    ],
    activeOrders: [],
    customerInfo: null,
    unpaidCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatCurrency = (value) => {
    if (!value) return "Rp 0";
    const numberValue = Number(String(value).replace(/\D/g, ""));
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numberValue || 0);
  };

  const parseDateFromString = (value) => {
    if (!value) return null;
    const direct = Date.parse(value);
    if (!Number.isNaN(direct)) return new Date(direct);
    
    const match = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/.exec(value.trim());
    if (match) {
      const [, dd, mm, yyyy, hh = "00", min = "00"] = match;
      const iso = `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
      const parsed = Date.parse(iso);
      if (!Number.isNaN(parsed)) return new Date(parsed);
    }
    return null;
  };

  const getOrderStartDate = (order) => {
    return (
      parseDateFromString(order.webinar?.start_time) ||
      parseDateFromString(order.webinar?.start_time_formatted) ||
      parseDateFromString(order.tanggal_event) ||
      parseDateFromString(order.tanggal_order_raw) ||
      null
    );
  };

  const adaptOrders = (orders = []) =>
    orders.map((order) => {
      const kategoriNama = order.kategori_nama || "Produk";
      const formatKategori = (nama) => {
        if (!nama) return "Produk";
        return nama.charAt(0).toUpperCase() + nama.slice(1);
      };
      
      const typeLabel = formatKategori(kategoriNama);
      const schedule =
        order.webinar?.start_time_formatted ||
        order.webinar?.start_time ||
        order.tanggal_order ||
        "-";

      const getActionLabel = (kategoriNama) => {
        const kategoriLower = kategoriNama?.toLowerCase() || "";
        if (kategoriLower === "seminar") return "Join Seminar";
        if (kategoriLower === "e-book" || kategoriLower === "ebook") return "Buka Ebook";
        if (kategoriLower === "webinar") return "Join Webinar";
        if (kategoriLower === "workshop") return "Join Workshop";
        return "Lihat Detail";
      };

      const actionLabel = getActionLabel(kategoriNama);
      const startDate = getOrderStartDate(order);
      const statusPembayaran = order.status_pembayaran || order.status_pembayaran_id;
      
      // If order is from orders_aktif, it should be paid
      // Otherwise check status_pembayaran
      const isPaid = order._isFromActive || statusPembayaran === 3 || statusPembayaran === "3";
      
      return {
        id: order.id,
        type: typeLabel,
        title: order.produk_nama || "Produk Tanpa Nama",
        slug: order.ebook_url || order.produk_kode || order.kategori_nama || "-",
        total: order.total_harga_formatted || formatCurrency(order.total_harga),
        kategoriNama: kategoriNama,
        orderDate: order.tanggal_order || "-",
        schedule,
        actionLabel,
        startDate,
        isPaid,
        statusPembayaran,
      };
    });

  const loadDashboardData = useCallback(async () => {
    const session = getCustomerSession();

    if (!session.token) {
      setError("Token tidak ditemukan. Silakan login kembali.");
      setLoading(false);
      router.replace("/customer");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchCustomerDashboard(session.token);
      const customerData = data.customer || null;

      // Sync customer data to localStorage
      if (customerData) {
        const existingUser = session.user || {};
        const updatedUser = {
          ...existingUser,
          ...customerData,
          nama_panggilan: customerData.nama_panggilan || existingUser.nama_panggilan,
          profesi: customerData.profesi || existingUser.profesi,
          verifikasi: customerData.verifikasi !== undefined 
            ? customerData.verifikasi 
            : (existingUser.verifikasi !== undefined ? existingUser.verifikasi : "0"),
        };
        localStorage.setItem("customer_user", JSON.stringify(updatedUser));
        setDashboardData(prev => ({ ...prev, customerInfo: updatedUser }));
      }

      // Update stats
      const newStats = [
        { id: "total", label: "Total Order", value: data?.statistik?.total_order ?? 0, icon: "📦" },
        { id: "active", label: "Order Aktif", value: data?.statistik?.order_aktif ?? 0, icon: "✅" },
      ];

      // orders_aktif from API should already be paid orders
      // But we'll still check status_pembayaran to be safe
      const activeOrders = (data?.orders_aktif || []).map((order) => ({
        ...order,
        _isFromActive: true, // Mark as from orders_aktif (should be paid)
      }));

      // Get unpaid orders for count
      const unpaidOrders = (data?.orders_pending || []).filter((order) => {
        const statusPembayaran = order.status_pembayaran || order.status_pembayaran_id;
        return statusPembayaran !== 3 && statusPembayaran !== "3";
      });

      const unpaidCount = unpaidOrders.length;

      setDashboardData({
        stats: newStats,
        activeOrders: adaptOrders(activeOrders),
        customerInfo: customerData || session.user,
        unpaidCount,
      });
    } catch (error) {
      console.error("[DASHBOARD] Failed to load data:", error);
      setError(error.message || "Gagal memuat data dashboard.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    ...dashboardData,
    loading,
    error,
    refetch: loadDashboardData,
  };
}


