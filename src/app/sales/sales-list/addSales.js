import { useState, useEffect } from "react";
import { toastSuccess, toastError } from "@/lib/toast";

export default function AddSalesModal({ onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        user_id: "",
        nama: "",
        urutan: "",
        woowa_key: ""
    });

    // Fetch users for dropdown
    useEffect(() => {
        async function fetchUsers() {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("/api/admin/users", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    setUsers(json.data);
                }
            } catch (err) {
                console.error("Error fetching users:", err);
                toastError("Gagal memuat daftar user");
            }
        }
        fetchUsers();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto fill nama when user is selected
            if (name === "user_id") {
                const selectedUser = users.find(u => String(u.id) === String(value));
                if (selectedUser) {
                    newData.nama = selectedUser.nama;
                } else {
                    newData.nama = "";
                }
            }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/sales/sales-list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const json = await res.json();
            if (json.success) {
                toastSuccess("Sales berhasil ditambahkan");
                onSuccess();
            } else {
                toastError(json.message || "Gagal menambahkan sales");
            }
        } catch (err) {
            console.error("Error adding sales:", err);
            toastError("Terjadi kesalahan set saat menambahkan sales");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2>Tambah Sales</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit} className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>User *</label>
                            <select
                                name="user_id"
                                value={formData.user_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Pilih User</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.nama} ({u.email})</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Woowa Key</label>
                            <input
                                type="text"
                                name="woowa_key"
                                placeholder="Masukkan Woowa Key"
                                value={formData.woowa_key}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Urutan</label>
                            <input
                                type="number"
                                name="urutan"
                                placeholder="Auto generate jika kosong"
                                value={formData.urutan}
                                onChange={handleChange}
                            />
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>Batal</button>
                    <button type="button" className="btn-save" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </div>
        </div>
    );
}
