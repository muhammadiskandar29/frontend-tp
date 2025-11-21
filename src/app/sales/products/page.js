"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useProducts } from "@/hooks/useProducts";
import { useRouter } from "next/navigation";
import "@/styles/produk.css";

export default function AdminProductsPage() {
  const { products, loading } = useProducts();
  const [activeMenu, setActiveMenu] = useState(null);
  const router = useRouter();

  const toggleMenu = (id) => {
    setActiveMenu(activeMenu === id ? null : id);
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <Layout title="Daftar Produk | One Dashboard">
      <div className="admin-header">
        <h1 className="admin-title">Daftar Produk</h1>

        <div className="admin-header-actions">
          {/* 🔥 Tambah Produk */}
          <button
            className="admin-button"
            onClick={() => router.push("/admin/products/addProducts")}
          >
            + Tambah Produk
          </button>

          <input
            type="text"
            placeholder="Cari pesanan..."
            className="search-input"
          />
        </div>
      </div>

      <div className="products-container">
        {loading ? (
          <p>Sedang memuat produk...</p>
        ) : (
          <table className="product-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nama Produk</th>
                <th>Harga</th>
                <th>COGS</th>
                <th>Inventory</th>
                <th>Order</th>
                <th>Paid</th>
                <th>Paid Ratio</th>
                <th>Qty Sold</th>
                <th>Net Revenue</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {products.map((p, index) => (
                <tr key={p.id}>
                  <td>{index + 1}</td>
                  <td>
  <div className="product-info">
    <img
      className="product-header-img"
      src={`/storage/${p.header}`}
      alt={p.nama}
      onError={(e) => (e.target.style.display = "none")}
    />
    <div className="product-text">
      {/* <-- clickable name only --> */}
      <p
        className="product-name clickable"
        onClick={(e) => {
          e.stopPropagation();            // jangan bubble ke row
          router.push(`/admin/products/view/${p.id}`);
        }}
      >
        {p.nama}
      </p>

      <a href="#" className="form-link" onClick={(e) => e.preventDefault()}>
        Form
      </a>
    </div>
  </div>
</td>


                  <td>Rp{p.harga_asli}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0%</td>
                  <td>0</td>
                  <td>Rp0</td>

                  <td className="action-cell" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="action-btn"
                      onClick={() => toggleMenu(p.id)}
                    >
                      ⋮
                    </button>

                    {activeMenu === p.id && (
                      <div className="action-menu">
                        <button>Edit</button>
                        <button>View</button>
                        <button>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        )}
      </div>
    </Layout>
  );
}
