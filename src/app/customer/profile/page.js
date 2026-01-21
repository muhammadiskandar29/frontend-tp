"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Smartphone, User, Briefcase, MapPin, Loader2, Shield } from "lucide-react";
import toast from "react-hot-toast";
import CustomerLayout from "@/components/customer/CustomerLayout";

// Helper function untuk update data
async function updateCustomerService(payload) {
    const token = localStorage.getItem("customer_token");

    if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
    }

    try {
        const response = await fetch("/api/customer/customer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || data?.success !== true) {
            throw new Error(data?.message || "Gagal mengupdate profile");
        }

        return data;
    } catch (error) {
        console.error("❌ [UPDATE_PROFILE] Error:", error);
        throw error;
    }
}

export default function CustomerProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nama_panggilan: "",
        instagram: "",
        profesi: "",
        pendapatan_bln: "",
        industri_pekerjaan: "",
        jenis_kelamin: "l",
        tanggal_lahir: "",
        alamat: "",
        customer_id: null,
        wa: "",
        password: "", // Untuk reset password jika diisi
    });

    // Fetch data
    useEffect(() => {
        async function fetchDetail() {
            try {
                const token = localStorage.getItem("customer_token");
                if (!token) {
                    router.push("/customer/auth/login");
                    return;
                }

                const response = await fetch("/api/customer/customer/detail", {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Accept": "application/json",
                    },
                });

                const json = await response.json();

                if (json.success && json.data) {
                    const user = json.data;
                    setFormData(prev => ({
                        ...prev,
                        nama_panggilan: user.nama_panggilan || user.nama || "",
                        instagram: user.instagram || "",
                        profesi: user.profesi || "",
                        pendapatan_bln: user.pendapatan_bln || "",
                        industri_pekerjaan: user.industri_pekerjaan || "",
                        jenis_kelamin: user.jenis_kelamin || "l",
                        tanggal_lahir: user.tanggal_lahir ? user.tanggal_lahir.slice(0, 10) : "",
                        alamat: user.alamat || "",
                        customer_id: user.id,
                        wa: user.phone || user.wa || "", // Handling different field names
                    }));
                }
            } catch (err) {
                console.error("Gagal load profile:", err);
                toast.error("Gagal memuat data profile");
            } finally {
                setLoading(false);
            }
        }

        fetchDetail();
    }, [router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        // Validasi sederhana
        if (!formData.nama_panggilan?.trim()) {
            toast.error("Nama panggilan wajib diisi");
            setSaving(false);
            return;
        }

        try {
            // Hapus password jika kosong agar tidak terupdate
            const payload = { ...formData };
            if (!payload.password) delete payload.password;

            await updateCustomerService(payload);
            toast.success("Profile berhasil diperbarui");

            // Refresh page or redirection if needed
            router.refresh();
        } catch (err) {
            toast.error(err.message || "Gagal menyimpan perubahan");
        } finally {
            setSaving(false);
        }
    };

    const handleChangeWA = () => {
        // Implementasi logika ubah WA, bisa redirect ke halaman khusus atau modal
        toast((t) => (
            <span>
                Fitur ubah nomor WhatsApp akan menghubungi admin.
                <button onClick={() => toast.dismiss(t.id)} style={{ marginLeft: '8px', border: '1px solid #333', padding: '2px 5px', borderRadius: '4px' }}>Dismiss</button>
            </span>
        ), { icon: 'ℹ️' });
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <Loader2 className="animate-spin text-orange-500" size={32} />
                <p>Memuat profil...</p>
            </div>
        );
    }

    return (
        <CustomerLayout>
            <div className="profile-page">
                <div className="profile-header">
                    <button onClick={() => router.back()} className="back-btn">
                        <ArrowLeft size={20} />
                        <span>Kembali</span>
                    </button>
                    <h1>Profile Saya</h1>
                </div>

                <div className="profile-container">
                    <form onSubmit={handleSubmit}>

                        {/* Section: Akun & Keamanan */}
                        <section className="form-section">
                            <h3 className="section-title"><Shield size={18} /> Akun & Keamanan</h3>
                            <div className="form-grid">
                                {/* WA Field */}
                                <div className="form-group full-width">
                                    <label>Nomor WhatsApp</label>
                                    <div className="input-with-action">
                                        <div className="input-icon-wrapper">
                                            <Smartphone size={18} className="text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.wa}
                                                disabled
                                                className="input-disabled pl-10"
                                            />
                                        </div>
                                        <button type="button" onClick={handleChangeWA} className="action-btn">
                                            Ubah No WA
                                        </button>
                                    </div>
                                    <p className="field-note">Nomor WhatsApp digunakan untuk login dan notifikasi.</p>
                                </div>

                                {/* Password */}
                                <div className="form-group full-width">
                                    <label>Password Baru (Opsional)</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Isi jika ingin mengubah password"
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section: Data Diri */}
                        <section className="form-section">
                            <h3 className="section-title"><User size={18} /> Data Diri</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Nama Panggilan <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="nama_panggilan"
                                        value={formData.nama_panggilan}
                                        onChange={handleChange}
                                        required
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Instagram <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="instagram"
                                        value={formData.instagram}
                                        onChange={handleChange}
                                        placeholder="@username"
                                        required
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Jenis Kelamin</label>
                                    <select
                                        name="jenis_kelamin"
                                        value={formData.jenis_kelamin}
                                        onChange={handleChange}
                                        className="form-input"
                                    >
                                        <option value="l">Laki-laki</option>
                                        <option value="p">Perempuan</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Tanggal Lahir</label>
                                    <input
                                        type="date"
                                        name="tanggal_lahir"
                                        value={formData.tanggal_lahir}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section: Pekerjaan */}
                        <section className="form-section">
                            <h3 className="section-title"><Briefcase size={18} /> Pekerjaan & Profesi</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Profesi <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="profesi"
                                        value={formData.profesi}
                                        onChange={handleChange}
                                        placeholder="Contoh: Karyawan Swasta"
                                        required
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Industri Pekerjaan <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="industri_pekerjaan"
                                        value={formData.industri_pekerjaan}
                                        onChange={handleChange}
                                        placeholder="Contoh: Teknologi"
                                        required
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Pendapatan per Bulan <span className="text-red-500">*</span></label>
                                    <select
                                        name="pendapatan_bln"
                                        value={formData.pendapatan_bln}
                                        onChange={handleChange}
                                        required
                                        className="form-input"
                                    >
                                        <option value="">Pilih Range Pendapatan</option>
                                        <option value="10-20jt">10 - 20 Juta</option>
                                        <option value="20-30jt">20 - 30 Juta</option>
                                        <option value="30-40jt">30 - 40 Juta</option>
                                        <option value="40-50jt">40 - 50 Juta</option>
                                        <option value="50-60jt">50 - 60 Juta</option>
                                        <option value="60-70jt">60 - 70 Juta</option>
                                        <option value="70-80jt">70 - 80 Juta</option>
                                        <option value="80-90jt">80 - 90 Juta</option>
                                        <option value="90-100jt">90 - 100 Juta</option>
                                        <option value=">100jt">&gt; 100 Juta</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Section: Alamat */}
                        <section className="form-section">
                            <h3 className="section-title"><MapPin size={18} /> Alamat Lengkap</h3>
                            <div className="form-group">
                                <textarea
                                    name="alamat"
                                    value={formData.alamat}
                                    onChange={handleChange}
                                    rows={3}
                                    className="form-textarea"
                                    placeholder="Masukkan alamat lengkap..."
                                />
                            </div>
                        </section>

                        <div className="form-actions">
                            <button type="submit" className="save-btn" disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Simpan Perubahan
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>

                <style jsx>{`
        .profile-page {
            max-width: 800px;
            margin: 0 auto;
            padding: 24px;
            min-height: 100vh;
            background-color: #f8fafc;
            color: #1e293b;
            font-family: 'Inter', sans-serif;
        }

        .profile-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            gap: 16px;
            color: #64748b;
        }

        .profile-header {
            margin-bottom: 32px;
        }

        .profile-header h1 {
            font-size: 28px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 16px;
        }

        .back-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            background: none;
            border: none;
            color: #64748b;
            font-weight: 500;
            cursor: pointer;
            padding: 0;
            transition: color 0.2s;
        }
        .back-btn:hover { color: #f1a124; }

        .profile-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            overflow: hidden;
            padding: 32px;
        }

        .form-section {
            margin-bottom: 40px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 32px;
        }
        .form-section:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }

        .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 18px;
            font-weight: 700;
            color: #334155;
            margin-bottom: 24px;
        }

        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        @media (max-width: 640px) {
            .form-grid { grid-template-columns: 1fr; }
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .form-group.full-width {
            grid-column: 1 / -1;
        }

        .form-group label {
            font-size: 14px;
            font-weight: 600;
            color: #475569;
        }

        .form-input, .form-textarea, .input-disabled {
            width: 100%;
            padding: 10px 14px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-size: 14px;
            color: #1e293b;
            transition: all 0.2s;
            outline: none;
        }

        .form-input:focus, .form-textarea:focus {
            border-color: #f1a124;
            box-shadow: 0 0 0 3px rgba(241, 161, 36, 0.1);
        }

        .form-textarea {
            resize: vertical;
        }

        .input-disabled {
            background-color: #f1f5f9;
            color: #64748b;
            cursor: not-allowed;
        }

        .input-with-action {
            display: flex;
            gap: 8px;
        }
        
        .input-icon-wrapper {
            position: relative;
            flex: 1;
        }

        .input-icon-wrapper svg {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #94a3b8;
        }

        .input-icon-wrapper .input-disabled {
            padding-left: 40px;
        }

        .action-btn {
            white-space: nowrap;
            padding: 0 16px;
            border: 1px solid #cbd5e1;
            background: white;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            color: #475569;
            cursor: pointer;
            transition: all 0.2s;
        }
        .action-btn:hover {
            background-color: #f8fafc;
            border-color: #94a3b8;
        }

        .field-note {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 4px;
        }

        .form-actions {
            margin-top: 32px;
            display: flex;
            justify-content: flex-end;
        }

        .save-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, #f1a124 0%, #d97706 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 4px 6px -1px rgba(241, 161, 36, 0.3);
            transition: transform 0.1s;
        }
        .save-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px rgba(241, 161, 36, 0.4);
        }
        .save-btn:active {
            transform: translateY(0);
        }
        .save-btn:disabled {
            opacity: 0.7;
            cursor: wait;
        }
      `}</style>
            </div>
        </CustomerLayout>
    );
}
