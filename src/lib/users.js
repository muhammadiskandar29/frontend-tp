/**
 * Users API Functions
 * Centralized functions untuk user management
 * Menggunakan API_ENDPOINTS untuk konsistensi
 */

import { api } from "./api";
import { API_ENDPOINTS } from "@/config/api";

/** 
 * 📘 GET - Ambil semua user 
 * @returns {Promise<Array>} Array of users
 */
export async function getUsers() {
  const res = await api(API_ENDPOINTS.admin.users, { method: "GET" });
  return res.data || []; 
}

/** 
 * 🟢 POST - Tambah user baru 
 * @param {object} userData - User data (nama, email, divisi, level, dll)
 * @returns {Promise<{success: boolean, message: string, data: object}>}
 */
export async function createUser(userData) {
  const res = await api(API_ENDPOINTS.admin.users, {
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
 * @param {number|string} id - User ID
 * @param {object} userData - Updated user data
 * @returns {Promise<{success: boolean, message: string, data: object}>}
 */
export async function updateUser(id, userData) {
  const res = await api(API_ENDPOINTS.admin.userById(id), {
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
 * @param {number|string} id - User ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteUser(id) {
  const res = await api(API_ENDPOINTS.admin.userById(id), {
    method: "DELETE",
  });

  return {
    success: res.success,
    message: res.message || "User berhasil dihapus",
  };
}
