import { useState, useEffect } from "react";
import { toastSuccess, toastError } from "@/lib/toast";

export default function EditSalesModal({ sales, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        user_id: sales.sales_id || sales.user_id || "",
        nama: sales.user_rel?.nama || sales.nama || "",
        urutan: sales.urutan || "",
        woowa_key: sales.woowa_key || ""
    });

    // Fetch users for dropdown to allow changing user if needed (though API might restricted)
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
            // Request body according to prompt: name, urutan, woowa_key
            // We'll also include user_id if it changed, just in case the backend supports it, 
            // but primarily focusing on the requested fields.
            const bodyData = {
                nama: formData.nama,
                urutan: formData.urutan,
                woowa_key: formData.woowa_key,
                user_id: formData.user_id // Included to be safe, though prompt only listed the others
            };

            const res = await fetch(`/api/sales/sales-list/${sales.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(bodyData)
            });

            const json = await res.json();
            if (json.success) {
                toastSuccess("Data sales berhasil diperbarui");
                onSuccess();
            } else {
                toastError(json.message || "Gagal memperbarui sales");
            }
        } catch (err) {
            console.error("Error updating sales:", err);
            toastError("Terjadi kesalahan saat memperbarui sales");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2>Edit Sales</h2>
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
                                placeholder="Urutan"
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
