import { useState, useCallback, useEffect } from "react";
import { getProvinces, getCities, getDistricts } from "@/utils/shippingService";

/**
 * useAddressData
 * Mengelola data wilayah (Provinsi, Kota, Kecamatan) dan fitur pencarian wilayah.
 * Menggantikan logic filter client-side dengan server-side search API.
 */
export function useAddressData() {
    // Cascading Dropdown State (Produk Fisik)
    const [wilayahData, setWilayahData] = useState({
        provinces: [],
        cities: [],
        districts: []
    });

    const [selectedWilayahIds, setSelectedWilayahIds] = useState({
        provinceId: "",
        cityId: "",
        districtId: ""
    });

    const [loadingWilayah, setLoadingWilayah] = useState({
        provinces: false,
        cities: false,
        districts: false
    });

    // Search State (Produk Digital/Non-Fisik)
    const [districtSearchTerm, setDistrictSearchTerm] = useState("");
    const [districtSearchResults, setDistrictSearchResults] = useState([]);
    const [loadingDistrictSearch, setLoadingDistrictSearch] = useState(false);
    const [showDistrictResults, setShowDistrictResults] = useState(false); // UI State

    // Load Provinces on Mount
    useEffect(() => {
        let isMounted = true;

        async function fetchProvinces() {
            setLoadingWilayah(prev => ({ ...prev, provinces: true }));
            try {
                const data = await getProvinces();
                if (isMounted && data && Array.isArray(data)) {
                    setWilayahData(prev => ({ ...prev, provinces: data }));
                }
            } catch (err) {
                console.error("Error fetching provinces:", err);
            } finally {
                if (isMounted) setLoadingWilayah(prev => ({ ...prev, provinces: false }));
            }
        }

        fetchProvinces();

        return () => { isMounted = false; };
    }, []);

    // Load Cities when Province changes
    useEffect(() => {
        if (!selectedWilayahIds.provinceId) {
            setWilayahData(prev => ({ ...prev, cities: [], districts: [] }));
            return;
        }

        let isMounted = true;
        async function fetchCities() {
            setLoadingWilayah(prev => ({ ...prev, cities: true }));
            try {
                const data = await getCities(selectedWilayahIds.provinceId);
                if (isMounted && data && Array.isArray(data)) {
                    setWilayahData(prev => ({ ...prev, cities: data, districts: [] }));
                }
            } catch (err) {
                console.error("Error fetching cities:", err);
            } finally {
                if (isMounted) setLoadingWilayah(prev => ({ ...prev, cities: false }));
            }
        }

        fetchCities();
        return () => { isMounted = false; };
    }, [selectedWilayahIds.provinceId]);

    // Load Districts when City changes
    useEffect(() => {
        if (!selectedWilayahIds.cityId) {
            setWilayahData(prev => ({ ...prev, districts: [] }));
            return;
        }

        let isMounted = true;
        async function fetchDistricts() {
            setLoadingWilayah(prev => ({ ...prev, districts: true }));
            try {
                const data = await getDistricts(selectedWilayahIds.cityId);
                if (isMounted && data && Array.isArray(data)) {
                    setWilayahData(prev => ({ ...prev, districts: data }));
                }
            } catch (err) {
                console.error("Error fetching districts:", err);
            } finally {
                if (isMounted) setLoadingWilayah(prev => ({ ...prev, districts: false }));
            }
        }

        fetchDistricts();
        return () => { isMounted = false; };
    }, [selectedWilayahIds.cityId]);

    // Search Logic with Debounce
    useEffect(() => {
        // Skip if term is short
        if (!districtSearchTerm || districtSearchTerm.length < 3) {
            setDistrictSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoadingDistrictSearch(true);
            try {
                // ✅ NEW: Fetch to server-side API instead of local filtering
                const res = await fetch(`/api/region/search?q=${encodeURIComponent(districtSearchTerm)}`);
                const data = await res.json();

                if (data.success) {
                    setDistrictSearchResults(data.data);
                    setShowDistrictResults(true);
                } else {
                    setDistrictSearchResults([]);
                }
            } catch (err) {
                console.error("Error searching districts:", err);
                setDistrictSearchResults([]);
            } finally {
                setLoadingDistrictSearch(false);
            }
        }, 500); // 500ms Debounce (Optimized)

        return () => clearTimeout(timeoutId);
    }, [districtSearchTerm]);

    return {
        // Cascading Data
        wilayahData,
        selectedWilayahIds,
        setSelectedWilayahIds,
        loadingWilayah,

        // Search Data
        districtSearchTerm,
        setDistrictSearchTerm,
        districtSearchResults,
        setDistrictSearchResults, // Exposed in case we need to manual clear
        loadingDistrictSearch,
        showDistrictResults,
        setShowDistrictResults
    };
}
