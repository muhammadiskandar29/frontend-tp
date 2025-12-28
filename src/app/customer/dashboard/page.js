"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CustomerLayout from "@/components/customer/CustomerLayout";
import UpdateCustomerModal from "./updateCustomer";
import HeroSection from "./components/HeroSection";
import StatsSection from "./components/StatsSection";
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
  
  const { 
    stats, 
    customerInfo, 
    unpaidCount,
    loading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useDashboardData();
  
  const { products, loading: productsLoading } = useProducts();

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
    }

    localStorage.removeItem("customer_show_update_modal");
    setShowUpdateModal(false);
    
    toast.success("Data berhasil diperbarui!");
    refetchDashboard();
  };

  return (
    <CustomerLayout>
      {/* Modal Update Data Customer */}
      {showUpdateModal && (
        <UpdateCustomerModal
          isOpen={showUpdateModal}
          onClose={() => {}}
          onSuccess={handleUpdateSuccess}
          title={
            updateModalReason === "password"
              ? "Ubah Password & Lengkapi Data"
              : "Lengkapi Data Profil Anda"
          }
          requirePassword={updateModalReason === "password"}
        />
      )}

      <div className="customer-dashboard">
        {/* Hero Section */}
        <HeroSection 
          customerInfo={customerInfo} 
          isLoading={dashboardLoading}
        />

        {/* Error Alert */}
        {!dashboardLoading && dashboardError && (
          <div className="dashboard-error-alert">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
              <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 6V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 14H10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{dashboardError}</span>
          </div>
        )}

        {/* Quick Actions */}
        <QuickActions unpaidCount={unpaidCount} />

        {/* Stats Section */}
        <StatsSection stats={stats} isLoading={dashboardLoading} />

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
