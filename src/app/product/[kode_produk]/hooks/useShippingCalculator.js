import { useState, useCallback } from "react";
import { calculateDomesticCost } from "@/utils/shippingService";
import { toast } from "react-hot-toast";

/**
 * useShippingCalculator
 * Mengelola logic perhitungan ongkir menggunakan shippingService.
 */
export function useShippingCalculator() {
    const [ongkir, setOngkir] = useState(0);
    const [ongkirInfo, setOngkirInfo] = useState({ courier: '', service: '' });
    const [costResults, setCostResults] = useState([]);
    const [loadingCost, setLoadingCost] = useState(false);
    const [selectedCourier, setSelectedCourier] = useState("jne");

    // Constants (Moved from Component)
    const ORIGIN_DISTRICT_ID = 6204; // Kelapa Dua, Kabupaten Tangerang
    const DEFAULT_WEIGHT = 1000; // 1kg

    const handleCalculateOngkir = useCallback(async (destinationDistrictId, courier = selectedCourier) => {
        if (!destinationDistrictId) return;

        setLoadingCost(true);
        // Reset ongkir saat hitung ulang untuk mencegah race condition harga
        setOngkir(0);

        try {
            const results = await calculateDomesticCost({
                origin: ORIGIN_DISTRICT_ID,
                destination: destinationDistrictId,
                weight: DEFAULT_WEIGHT,
                courier: courier
            });

            setCostResults(results);

            // Auto-select first service if available (Existing behavior pattern)
            if (results && results.length > 0) {
                // Cari service termurah atau yang pertama logic existing biasanya user pilih manual, 
                // tapi kita siapkan state costResults untuk ditampilkan di UI
            } else {
                // console.warn("No shipping costs found");
            }
        } catch (err) {
            console.error("[SHIPPING] Calculate error:", err);
            toast.error("Gagal menghitung ongkos kirim");
        } finally {
            setLoadingCost(false);
        }
    }, [selectedCourier]);

    // Handle user selecting a shipping service from the list
    const selectShippingService = useCallback((cost, serviceName, courierCode) => {
        setOngkir(cost);
        setOngkirInfo({ courier: courierCode, service: serviceName });
    }, []);

    return {
        ongkir,
        setOngkir,
        ongkirInfo,
        setOngkirInfo,
        costResults, // To be displayed in UI
        setCostResults,
        loadingCost,
        selectedCourier,
        setSelectedCourier,
        handleCalculateOngkir,
        selectShippingService
    };
}
