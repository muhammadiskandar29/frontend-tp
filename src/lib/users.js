import { api } from "./api";

/** 
 * 📘 GET - Ambil semua user 
 * @returns {Promise<{success:boolean, message:string, data:Array}>}
 */
export async function getUsers() {
  const res = await api("/admin/users", { method: "GET" });
  return res.data || []; 
}

/** 
 * 🟢 POST - Tambah user baru 
 * @param {object} userData 
 */
export async function createUser(userData) {
  const res = await api("/admin/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });

  return {
    success: res.success,
    message: res.message || "User berhasil ditambahkan",
    data: res.data,
  };
}

/** 
 * 🟡 PUT - Update user 
 * @param {number|string} id 
 * @param {object} userData 
 */
export async function updateUser(id, userData) {
  const res = await api(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });

  return {
    success: res.success,
    message: res.message || "User berhasil diperbarui",
    data: res.data,
  };
}

/** 
 * 🔴 DELETE - Nonaktifkan user (status 1 -> N)
 * @param {number|string} id 
 */
export async function deleteUser(id) {
  const res = await api(`/admin/users/${id}`, {
    method: "DELETE",
  });

  return {
    success: res.success,
    message: res.message || "User berhasil dihapus",
  };
}
