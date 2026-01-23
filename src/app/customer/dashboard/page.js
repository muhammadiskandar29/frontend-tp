"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CustomerLayout from "@/components/customer/CustomerLayout";
import UpdateCustomerModal from "./updateCustomer";
import HeroSection from "./components/HeroSection";
import VerificationCard from "./components/VerificationCard";
import StatsSection from "./components/StatsSection";
import OrdersSection from "./components/OrdersSection";
import ProductsSection from "./components/ProductsSection";
import QuickActions from "./components/QuickActions";
import { useDashboardData } from "./hooks/useDashboardData";
import { useProducts } from "./hooks/useProducts";
import { getCustomerSession } from "@/lib/customerAuth";
import { toast } from "react-hot-toast";

export default function DashboardPage() {
  const router = useRouter();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateModalReason, setUpdateModalReason] = useState("password");
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const {
    stats,
    activeOrders,
    customerInfo,
    unpaidCount,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useDashboardData();

  const { products, loading: productsLoading } = useProducts();

  // Verification status logic:
  // API customer/dashboard might be missing 'verifikasi' field.
  // We merge/check with session storage to get the accurate status.
  const session = getCustomerSession();
  const sessionVerifikasi = session?.user?.verifikasi;

  // Prioritize API if exists (in case it updated), otherwise fallback to session
  const verifikasiValue = customerInfo?.hasOwnProperty('verifikasi')
    ? customerInfo.verifikasi
    : sessionVerifikasi;

  // Debug verification status
  console.log("[DASHBOARD] Verif Check:", { api: customerInfo?.verifikasi, session: sessionVerifikasi, final: verifikasiValue });
  const isVerified = Number(verifikasiValue) === 1 || verifikasiValue === true || String(verifikasiValue) === "1";

  // Fungsi untuk mengecek apakah data customer sudah lengkap
  const isCustomerDataComplete = (customer) => {
    if (!customer) return false;

    // Field required: nama_panggilan, profesi, dan ALAMAT (baru)
    const hasNamaPanggilan = customer.nama_panggilan && customer.nama_panggilan.trim() !== "";
    const hasProfesi = customer.profesi && customer.profesi.trim() !== "";
    const hasAlamat = customer.alamat && customer.alamat.trim() !== "";

    return hasNamaPanggilan && hasProfesi && hasAlamat;
  };

  // Cek apakah modal harus ditampilkan
  useEffect(() => {
    // Tunggu sampai loading selesai
    if (dashboardLoading) return;

    // Combine info for completeness check
    const combinedInfo = { ...session?.user, ...customerInfo };
    console.log("[DASHBOARD] Checking Data Completeness:", combinedInfo);

    // Cek apakah data customer sudah lengkap
    const isComplete = isCustomerDataComplete(combinedInfo);
    console.log("[DASHBOARD] Is Data Complete?", isComplete);

    // 1. Jika data sudah LENGKAP, segera bersihkan semua trigger modal
    if (isComplete) {
      if (localStorage.getItem("customer_show_update_modal")) {
        console.log("[DASHBOARD] Data complete, removing localStorage flag");
        localStorage.removeItem("customer_show_update_modal");
      }
      if (showUpdateModal) {
        setShowUpdateModal(false);
      }
      return; // Selesai, tidak perlu lanjut ke pengecekan show modal
    }

    // 2. Jika data TIDAK LENGKAP, baru cek trigger pemunculan

    // Cek apakah ada flag force show dari localStorage (misal dari OTP page)
    const showModalFlag = localStorage.getItem("customer_show_update_modal");

    if (showModalFlag === "1") {
      if (!showUpdateModal) {
        setShowUpdateModal(true);
        setUpdateModalReason("password");
      }
    } else {
      // Jika tidak ada flag, tapi data tetap tidak lengkap, munculkan dengan alasan 'data'
      if (!showUpdateModal) {
        console.log("[DASHBOARD] Customer data incomplete, showing modal");
        setShowUpdateModal(true);
        setUpdateModalReason("data");
      }
    }
  }, [customerInfo, dashboardLoading]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [paymentLoading, setPaymentLoading] = useState(false);

  const handleUpdateSuccess = (data) => {
    console.log("[DASHBOARD] Update success, data received:", data);

    const session = getCustomerSession();
    if (session.user) {
      const verifikasiFromResponse = data?.verifikasi !== undefined ? data.verifikasi : "1";

      const updatedUser = {
        ...session.user,
        ...data,
        nama_panggilan: data?.nama_panggilan || session.user.nama_panggilan,
        profesi: data?.profesi || session.user.profesi,
        wa: data?.wa || session.user.wa, // Fix: Ensure WA is not overwritten with null
        verifikasi: verifikasiFromResponse,
      };

      localStorage.setItem("customer_user", JSON.stringify(updatedUser));

      // Cek apakah data sudah lengkap setelah update
      if (isCustomerDataComplete(updatedUser)) {
        localStorage.removeItem("customer_show_update_modal");
        setShowUpdateModal(false);
        toast.success("Data berhasil diperbarui!");
      } else {
        // Data masih belum lengkap, tetap tampilkan modal
        toast.success("Data berhasil disimpan. Silakan lengkapi data yang masih kosong.");
      }
    }

    refetchDashboard();
  };

  const handleContinuePayment = async (order) => {
    // Ambil data dari localStorage sebagai prioritas jika ada matching orderId
    const storedOrderData = localStorage.getItem("customer_order_data");
    let localPaymentMethod = null;

    if (storedOrderData) {
      try {
        const parsed = JSON.parse(storedOrderData);
        if (String(parsed.orderId) === String(order.id)) {
          localPaymentMethod = parsed.paymentMethod;
        }
      } catch (e) {
        console.error("Error parsing stored order data", e);
      }
    }

    const { title: productName, total_harga: totalHarga, id: orderId } = order;
    // Gunakan paymentMethod dari order (DB) atau fallback ke localPaymentMethod (localStorage)
    const rawPaymentMethod = order.paymentMethod || localPaymentMethod || order.metode_bayar || "manual";
    const paymentMethod = String(rawPaymentMethod).toLowerCase();

    // Jika metode pembayaran adalah E-Payment (ewallet, cc, va, midtrans, dll), panggil Midtrans
    const isMidtransMethod = ["ewallet", "cc", "va", "midtrans", "virtual account", "e-payment", "qris"].includes(paymentMethod);

    if (isMidtransMethod) {
      // Ambil data customer dari session sebagai fallback
      const session = getCustomerSession();
      const finalNama = customerInfo?.nama || customerInfo?.nama_lengkap || session?.user?.nama || "";
      const finalEmail = customerInfo?.email || session?.user?.email || "";

      // Validasi data yang diperlukan
      if (!finalNama || !finalEmail) {
        toast.error("Data customer tidak lengkap. Silakan lengkapi profil Anda terlebih dahulu.");
        setShowUpdateModal(true);
        setUpdateModalReason("data");
        return;
      }

      // Parse total harga
      let amount = 0;
      if (typeof totalHarga === "string") {
        const numericValue = totalHarga.replace(/\D/g, "");
        amount = parseInt(numericValue, 10) || 0;
      } else {
        amount = parseInt(totalHarga, 10) || 0;
      }

      if (amount <= 0) {
        toast.error("Jumlah pembayaran tidak valid.");
        return;
      }

      try {
        setPaymentLoading(true);

        // Tentukan endpoint berdasarkan metode pembayaran
        let endpoint = "/api/midtrans/create-snap-va"; // Default fallback
        if (paymentMethod === "ewallet" || paymentMethod === "qris") {
          endpoint = "/api/midtrans/create-snap-ewallet";
        } else if (paymentMethod === "cc") {
          endpoint = "/api/midtrans/create-snap-cc";
        } else {
          // Default ke VA untuk midtrans, virtual account, e-payment, dll
          endpoint = "/api/midtrans/create-snap-va";
        }

        console.log("[DASHBOARD] Calling Midtrans API:", {
          endpoint,
          name: finalNama,
          email: finalEmail,
          amount,
          product_name: productName,
          order_id: orderId,
        });

        // Panggil API Midtrans
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: finalNama,
            email: finalEmail,
            amount: amount,
            product_name: productName,
            order_id: orderId,
          }),
        });

        const data = await response.json();
        console.log("[DASHBOARD] Midtrans response:", data);

        if (data.success === true && data.redirect_url) {
          if (orderId) {
            sessionStorage.setItem("midtrans_order_id", String(orderId));
          }
          if (data.snap_token) {
            sessionStorage.setItem("midtrans_snap_token", data.snap_token);
          }

          toast.success("Mengarahkan ke halaman pembayaran...");
          // Gunakan window.location.href alih-alih window.open agar tidak diblokir browser
          window.location.href = data.redirect_url;
        } else {
          toast.error(data.message || "Gagal membuat transaksi pembayaran");
          // Fallback
          const query = new URLSearchParams({
            product: productName || "",
            harga: totalHarga || "0",
            via: "manual",
            sumber: "dashboard",
          });
          router.push(`/payment?${query.toString()}`);
        }
      } catch (error) {
        console.error("[DASHBOARD] Error calling Midtrans:", error);
        toast.error("Terjadi kesalahan saat memproses pembayaran.");
      } finally {
        setPaymentLoading(false);
      }
    } else {
      // Manual transfer
      const query = new URLSearchParams({
        product: productName || "",
        harga: totalHarga || "0",
        via: "manual",
        sumber: "dashboard",
      });
      router.push(`/payment?${query.toString()}`);
    }
  };

  return (
    <CustomerLayout>
      {/* Modal Update Data Customer */}
      {showUpdateModal && (
        <UpdateCustomerModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={handleUpdateSuccess}
          title={
            updateModalReason === "password"
              ? "Ubah Password & Lengkapi Data"
              : "Lengkapi Data Profil Anda"
          }
          requirePassword={updateModalReason === "password"}
          allowClose={true}
        />
      )}

      <div className="customer-dashboard">
        {/* Hero Section */}
        <HeroSection
          customerInfo={customerInfo}
          isLoading={dashboardLoading}
        />

        {/* Verification Status Card */}
        {!dashboardLoading && (
          <div style={{ marginBottom: '2rem' }}>
            <VerificationCard isVerified={isVerified} />
          </div>
        )}

        {/* Error Alert */}
        {!dashboardLoading && dashboardError && (
          <div className="dashboard-error-alert">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
              <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 6V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 14H10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{dashboardError}</span>
          </div>
        )}

        {/* Quick Actions */}
        <QuickActions
          unpaidCount={unpaidCount}
          onUpdateProfile={() => {
            setShowUpdateModal(true);
            setUpdateModalReason("data");
          }}
        />

        {/* Stats Section */}
        <StatsSection stats={stats} isLoading={dashboardLoading} />

        {/* Orders Section */}
        <OrdersSection
          orders={activeOrders}
          isLoading={dashboardLoading}
          currentTime={currentTime}
          onPaymentAction={handleContinuePayment}
          isPaymentLoading={paymentLoading}
        />

        {/* Products Section */}
        {products.length > 0 && (
          <ProductsSection
            products={products}
            isLoading={productsLoading}
          />
        )}
      </div>
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </CustomerLayout>
  );
}
