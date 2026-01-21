"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Smartphone, User, Briefcase, MapPin, Loader2, Shield } from "lucide-react";
import toast from "react-hot-toast";
import CryptoJS from "crypto-js";
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

function ChangeWAModal({ isOpen, onClose, customerId }) {
    const router = useRouter();
    const [wa, setWa] = useState("");
    const [loading, setLoading] = useState(false);
    const isSubmitting = useRef(false);

    if (!isOpen) return null;

    const handleSave = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (loading || isSubmitting.current) return;

        if (!wa) return toast.error("Nomor WhatsApp wajib diisi");

        // Basic validation (must be digits, preferably starting with 62 or 08)
        const cleanWa = wa.replace(/\D/g, '');
        if (cleanWa.length < 9) return toast.error("Nomor WhatsApp tidak valid");

        try {
            isSubmitting.current = true;
            setLoading(true);
            const secret = process.env.NEXT_PUBLIC_OTP_SECRET_KEY;
            const timestamp = Math.floor(Date.now() / 1000).toString();
            // Create HMAC SHA256 signature
            const hash = CryptoJS.HmacSHA256(timestamp, secret).toString(CryptoJS.enc.Hex);

            const res = await fetch("/api/otp/update-wa", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Timestamp": timestamp,
                    "X-API-Hash": hash
                },
                body: JSON.stringify({
                    customer_id: customerId,
                    wa: cleanWa
                })
            });

            const json = await res.json();

            if (json.success) {
                toast.success(json.message || "Nomor berhasil diubah. Silakan verifikasi OTP.");

                // Update local session: Set verified to 0 and update phone
                const storedUser = localStorage.getItem("customer_user");
                if (storedUser) {
                    const currentUser = JSON.parse(storedUser);
                    const updatedUser = {
                        ...currentUser,
                        ...json.data.customer, // This should contain the new 'phone'
                        // IMPORTANT: Set verification to 0 so OTP page stays active
                        verifikasi: 0
                    };
                    localStorage.setItem("customer_user", JSON.stringify(updatedUser));
                    console.log("Updated local user for re-verification:", updatedUser);
                }

                onClose();
                // Redirect to OTP page
                router.push("/customer/otp");
            } else {
                toast.error(json.message || "Gagal mengubah nomor");
            }
        } catch (err) {
            console.error(err);
            toast.error("Terjadi kesalahan sistem saat menghubungi server");
        } finally {
            isSubmitting.current = false;
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Ubah Nomor WhatsApp</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <div className="modal-body">
                    <p className="modal-desc">
                        Masukkan nomor WhatsApp baru Anda. Kami akan mengirimkan kode OTP untuk verifikasi.
                    </p>
                    <div className="form-group">
                        <label>Nomor WhatsApp Baru</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Contoh: 62812345678"
                            value={wa}
                            onChange={e => setWa(e.target.value.replace(/\D/g, ''))}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn-cancel" disabled={loading}>Batal</button>
                    <button type="button" onClick={handleSave} className="save-btn" disabled={loading}>
                        {loading ? "Memproses..." : "Simpan dan Verifikasi"}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 20px;
                }
                .modal-content {
                    background: white;
                    border-radius: 16px;
                    width: 100%;
                    max-width: 450px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: #1e293b;
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: #94a3b8;
                    cursor: pointer;
                }
                .modal-body {
                    padding: 24px;
                }
                .modal-desc {
                    margin-bottom: 20px;
                    color: #64748b;
                    font-size: 14px;
                    line-height: 1.5;
                }
                .modal-footer {
                    padding: 20px;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    background: #f8fafc;
                }
                .btn-cancel {
                    padding: 10px 20px;
                    border: 1px solid #cbd5e1;
                    background: white;
                    border-radius: 8px;
                    color: #475569;
                    font-weight: 500;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}

export default function CustomerProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showWaModal, setShowWaModal] = useState(false);

    const [formData, setFormData] = useState({
        // Identitas & Akun
        memberID: "",
        keanggotaan: "",
        nama: "", // Nama Lengkap
        nama_panggilan: "",
        email: "",
        wa: "",
        sapaan: "",

        // Data Diri
        jenis_kelamin: "l",
        tanggal_lahir: "",

        // Pekerjaan
        profesi: "",
        industri_pekerjaan: "",
        pendapatan_bln: "",

        // Media Sosial
        instagram: "",

        // Alamat
        alamat: "",
        provinsi: "",
        kabupaten: "",
        kecamatan: "",
        kode_pos: "",

        // Keamanan
        password: "",
        customer_id: null,
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
                    console.log("Profile Data:", user); // Debug

                    setFormData(prev => ({
                        ...prev,
                        customer_id: user.id,

                        // Mapping fields
                        memberID: user.memberID || "-",
                        keanggotaan: user.keanggotaan || "Basic",
                        nama: user.nama || "",
                        nama_panggilan: user.nama_panggilan || "",
                        email: user.email || "",
                        wa: user.phone || user.wa || "",
                        sapaan: user.sapaan || "",

                        jenis_kelamin: user.jenis_kelamin || "l",
                        tanggal_lahir: user.tanggal_lahir ? user.tanggal_lahir.slice(0, 10) : "",

                        profesi: user.profesi || "",
                        industri_pekerjaan: user.industri_pekerjaan || "",
                        pendapatan_bln: user.pendapatan_bln || "",

                        instagram: user.instagram || "",

                        alamat: user.alamat || "",
                        provinsi: user.provinsi || "",
                        kabupaten: user.kabupaten || "",
                        kecamatan: user.kecamatan || "",
                        kode_pos: user.kode_pos || "",
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
            // Hapus field readonly/system agar tidak dikirim balik jika backend strict (opsional, tergantung backend)
            const payload = { ...formData };
            if (!payload.password) delete payload.password;

            // Kita asumsikan backend ignored field yg tidak ada di database, atau kita filter manual
            // Biasanya aman kirim semua, backend yg filter.

            await updateCustomerService(payload);
            toast.success("Profile berhasil diperbarui");
            router.refresh();
        } catch (err) {
            toast.error(err.message || "Gagal menyimpan perubahan");
        } finally {
            setSaving(false);
        }
    };

    const handleChangeWA = () => {
        setShowWaModal(true);
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

                        {/* GROUP 1: Informasi Akun (Read Only Mostly) */}
                        <section className="form-section">
                            <h3 className="section-title"><Shield size={18} /> Informasi Akun</h3>
                            <div className="info-cards-grid">
                                <div className="info-card">
                                    <span className="info-label">Member ID</span>
                                    <span className="info-value text-mono">{formData.memberID}</span>
                                </div>
                                <div className="info-card">
                                    <span className="info-label">Keanggotaan</span>
                                    <span className="info-badge">{formData.keanggotaan.toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="form-grid mt-4">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="input-disabled"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nomor WhatsApp</label>
                                    <div className="input-with-action">
                                        <input
                                            type="text"
                                            value={formData.wa}
                                            disabled
                                            className="input-disabled"
                                        />
                                        <button type="button" onClick={handleChangeWA} className="action-btn">
                                            Ubah
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* GROUP 2: Data Pribadi */}
                        <section className="form-section">
                            <h3 className="section-title"><User size={18} /> Data Pribadi</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Sapaan (Gelar)</label>
                                    <select name="sapaan" value={formData.sapaan || ""} onChange={handleChange} className="form-input">
                                        <option value="">- Pilih -</option>
                                        <option value="Bapak">Bapak</option>
                                        <option value="Ibu">Ibu</option>
                                        <option value="Sdr">Saudara (Sdr)</option>
                                        <option value="Sdri">Saudari (Sdri)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Nama Lengkap</label>
                                    <input
                                        type="text"
                                        name="nama"
                                        value={formData.nama}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="Nama Lengkap sesuai identitas"
                                    />
                                </div>
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
                                <div className="form-group">
                                    <label>Instagram</label>
                                    <div className="input-icon-wrapper">
                                        <span className="prefix-icon">@</span>
                                        <input
                                            type="text"
                                            name="instagram"
                                            value={formData.instagram.replace('@', '')}
                                            onChange={handleChange}
                                            className="form-input pl-8"
                                            placeholder="username"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* GROUP 3: Pekerjaan */}
                        <section className="form-section">
                            <h3 className="section-title"><Briefcase size={18} /> Pekerjaan & Profesi</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Profesi</label>
                                    <input
                                        type="text"
                                        name="profesi"
                                        value={formData.profesi}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Industri Pekerjaan</label>
                                    <input
                                        type="text"
                                        name="industri_pekerjaan"
                                        value={formData.industri_pekerjaan}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Pendapatan per Bulan</label>
                                    <select
                                        name="pendapatan_bln"
                                        value={formData.pendapatan_bln}
                                        onChange={handleChange}
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

                        {/* GROUP 4: Alamat & Lokasi */}
                        <section className="form-section">
                            <h3 className="section-title"><MapPin size={18} /> Alamat & Domisili</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Provinsi</label>
                                    <input type="text" name="provinsi" value={formData.provinsi} onChange={handleChange} className="form-input" placeholder="Nama Provinsi" />
                                </div>
                                <div className="form-group">
                                    <label>Kabupaten / Kota</label>
                                    <input type="text" name="kabupaten" value={formData.kabupaten} onChange={handleChange} className="form-input" placeholder="Nama Kabupaten/Kota" />
                                </div>
                                <div className="form-group">
                                    <label>Kecamatan</label>
                                    <input type="text" name="kecamatan" value={formData.kecamatan} onChange={handleChange} className="form-input" placeholder="Nama Kecamatan" />
                                </div>
                                <div className="form-group">
                                    <label>Kode Pos</label>
                                    <input type="text" name="kode_pos" value={formData.kode_pos} onChange={handleChange} className="form-input" placeholder="12345" />
                                </div>
                                <div className="form-group full-width">
                                    <label>Alamat Lengkap</label>
                                    <textarea
                                        name="alamat"
                                        value={formData.alamat}
                                        onChange={handleChange}
                                        rows={3}
                                        className="form-textarea"
                                        placeholder="Nama Jalan, No Rumah, RT/RW..."
                                    />
                                </div>
                            </div>
                        </section>

                        {/* GROUP 5: Keamanan Password */}
                        <section className="form-section">
                            <h3 className="section-title" style={{ color: '#ef4444' }}><Shield size={18} /> Ubah Password</h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Password Baru</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Kosongkan jika tidak ingin mengubah password"
                                        className="form-input"
                                    />
                                    <p className="field-note">Minimal 6 karakter.</p>
                                </div>
                            </div>
                        </section>

                        <div className="form-actions sticky-bottom">
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

                    <ChangeWAModal
                        isOpen={showWaModal}
                        onClose={() => setShowWaModal(false)}
                        customerId={formData.customer_id}
                    />
                </div>

                <style jsx>{`
        .info-cards-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .info-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 16px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .info-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-value {
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
        }

        .text-mono {
            font-family: 'Monaco', 'Consolas', monospace;
            letter-spacing: -0.5px;
        }

        .info-badge {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 20px;
            width: fit-content;
        }

        .input-icon-wrapper {
            position: relative;
            width: 100%;
        }

        .prefix-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #64748b;
            font-weight: 600;
            font-size: 14px;
            pointer-events: none;
            z-index: 10;
        }
        
        .pl-8 { padding-left: 32px !important; }
        .pl-10 { padding-left: 40px !important; }
        .mt-4 { margin-top: 16px; }

        @media (max-width: 640px) {
            .info-cards-grid { grid-template-columns: 1fr; }
        }

        .profile-page {
            max-width: 800px;
            margin: 0 auto;
            padding: 24px;
            min-height: 100vh;
            background-color: #f8fafc;
            color: #1e293b;
            font-family: 'Inter', sans-serif;
            padding-bottom: 100px; 
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
            border-color: #e2e8f0;
        }

        .input-with-action {
            display: flex;
            gap: 8px;
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
            border-top: 1px solid #f1f5f9;
            padding-top: 24px;
        }
        
        .sticky-bottom {
            position: sticky;
            bottom: 0;
            background: white;
            padding: 16px 0;
            margin-top: 0;
            border-top: 1px solid #e2e8f0;
            z-index: 10;
        }

        .save-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, #f1a124 0%, #d97706 100%);
            color: white;
            border: none;
            padding: 12px 32px;
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
