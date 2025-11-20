import { useState, useEffect, useCallback } from "react";
import {
  getOrders,
  getOrderById,
  createOrderAdmin,
  createOrderCustomer,
  updateOrderAdmin,
  confirmOrderPayment,
} from "@/lib/orders";

export default function useOrders({ mode = "admin" } = {}) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ======================
      🔄 Fetch Orders (Admin)
  ====================== */
  const fetchOrders = useCallback(async () => {
    if (mode !== "admin") return;
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error("❌ Error fetch orders:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  /* ======================
      🔍 Get Order Detail
  ====================== */
  const fetchOrderById = useCallback(async (id) => {
    setLoading(true);
    try {
      const data = await getOrderById(id);
      setSelectedOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ======================
      🟢 Create Order
  ====================== */
  const createOrder = useCallback(
    async (formData) => {
      setLoading(true);
      try {
        let res;
        if (mode === "admin") {
          res = await createOrderAdmin({
            nama: formData.nama || undefined,
            wa: formData.wa || undefined,
            email: formData.email || undefined,
            alamat: formData.alamat || undefined,
            customer: formData.customer ? Number(formData.customer) : undefined,
            produk: Number(formData.produk),
            harga: Number(formData.harga),
            ongkir: Number(formData.ongkir),
            total_harga: Number(formData.total_harga),
            sumber: formData.sumber,
            notif: formData.notif ? 1 : 0,
          });
        } else {
          res = await createOrderCustomer({
            nama: formData.nama,
            wa: formData.wa,
            email: formData.email,
            alamat: formData.alamat,
            produk: Number(formData.produk),
            harga: Number(formData.harga),
            ongkir: Number(formData.ongkir),
            total_harga: Number(formData.total_harga),
            metode_bayar: formData.metode_bayar,
            sumber: formData.sumber,
            custom_value: formData.custom_value || [],
          });
        }

        if (res.success && mode === "admin") await fetchOrders();
        return res;
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [mode, fetchOrders]
  );

  /* ======================
      🟡 Update Order (Admin)
  ====================== */
  const updateOrder = useCallback(async (id, data) => {
    if (mode !== "admin") return;
    setLoading(true);
    try {
      const res = await updateOrderAdmin(id, data);
      if (res.success) await fetchOrders();
      return res;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mode, fetchOrders]);

  /* ======================
      💳 Konfirmasi Pembayaran
  ====================== */
  const confirmPayment = useCallback(async (id, data) => {
    if (mode !== "admin") return;
    setLoading(true);
    try {
      const res = await confirmOrderPayment(id, data);
      if (res.success) await fetchOrders();
      return res;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mode, fetchOrders]);

  /* ======================
      Auto Fetch (Admin Only)
  ====================== */
  useEffect(() => {
    if (mode === "admin") fetchOrders();
  }, [fetchOrders, mode]);

  return {
    orders,
    selectedOrder,
    loading,
    error,
    fetchOrders,
    fetchOrderById,
    createOrder,
    updateOrder,
    confirmPayment,
  };
}
