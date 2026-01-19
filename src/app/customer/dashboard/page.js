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

  const isVerified = String(verifikasiValue) === "1" || verifikasiValue === true || verifikasiValue === 1;

  // Fungsi untuk mengecek apakah data customer sudah lengkap
  const isCustomerDataComplete = (customer) => {
    if (!customer) return false;

    // Field required: nama_panggilan dan profesi
    const hasNamaPanggilan = customer.nama_panggilan && customer.nama_panggilan.trim() !== "";
    const hasProfesi = customer.profesi && customer.profesi.trim() !== "";

    return hasNamaPanggilan && hasProfesi;
  };

  // Cek apakah modal harus ditampilkan
  useEffect(() => {
    // Tunggu sampai loading selesai
    if (dashboardLoading) return;

    // Cek dari localStorage dulu (untuk trigger dari OTP page)
    const showModalFlag = localStorage.getItem("customer_show_update_modal");
    if (showModalFlag === "1") {
      setShowUpdateModal(true);
      setUpdateModalReason("password");
      return;
    }

    // Combine info for completeness check
    const combinedInfo = { ...session?.user, ...customerInfo };

    // Cek apakah data customer sudah lengkap
    if (customerInfo && !isCustomerDataComplete(combinedInfo)) {
      console.log("[DASHBOARD] Customer data incomplete, showing modal");
      setShowUpdateModal(true);
      setUpdateModalReason("data");
    } else if (customerInfo && isCustomerDataComplete(combinedInfo)) {
      // Data sudah lengkap, pastikan modal tertutup
      if (showUpdateModal) {
        setShowUpdateModal(false);
      }
    }
  }, [customerInfo, dashboardLoading]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <CustomerLayout>
      {/* Modal Update Data Customer */}
      {showUpdateModal && (
        <UpdateCustomerModal
          isOpen={showUpdateModal}
          onClose={() => {
            // Modal bisa ditutup kapan saja, tapi akan muncul lagi saat login jika data belum lengkap
            setShowUpdateModal(false);
            localStorage.removeItem("customer_show_update_modal");
            toast.info("Anda bisa melengkapi data nanti. Modal akan muncul lagi saat login berikutnya jika data belum lengkap.");
          }}
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
        <QuickActions unpaidCount={unpaidCount} />

        {/* Stats Section */}
        <StatsSection stats={stats} isLoading={dashboardLoading} />

        {/* Orders Section */}
        <OrdersSection
          orders={activeOrders}
          isLoading={dashboardLoading}
          currentTime={currentTime}
        />

        {/* Products Section */}
        {products.length > 0 && (
          <ProductsSection
            products={products}
            isLoading={productsLoading}
          />
        )}
      </div>
    </CustomerLayout>
  );
}
