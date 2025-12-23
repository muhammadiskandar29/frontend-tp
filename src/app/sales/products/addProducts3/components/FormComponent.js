"use client";

import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import ComponentWrapper from "./ComponentWrapper";

export default function FormComponent({ data = {}, onUpdate, onMoveUp, onMoveDown, onDelete, index, productKategori }) {
  const kategori = data.kategori || null;
  
  // Kategori options
  const kategoriOptions = [
    { label: "Non-Fisik (Seminar, Webinar, dll)", value: null },
    { label: "Buku (dengan ongkir) - Kategori 13", value: 13 },
    { label: "Workshop (dengan down payment) - Kategori 15", value: 15 },
  ];

  const isKategoriBuku = () => kategori === 13;
  const isKategoriWorkshop = () => kategori === 15;

  const handleChange = (field, value) => {
    onUpdate?.({ ...data, [field]: value });
  };

  return (
    <ComponentWrapper
      title="Form Pemesanan"
      index={index}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onDelete={onDelete}
      isRequired={true}
    >
      <div className="form-component-content">
        {/* Kategori Selection */}
        <div className="form-field-group">
          <label className="form-label-small">Kategori Produk</label>
          <Dropdown
            value={kategori}
            options={kategoriOptions}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => handleChange("kategori", e.value)}
            placeholder="Pilih kategori produk"
            className="w-full"
            showClear
          />
          <p className="text-xs text-gray-500 mt-1">
            Pilih kategori untuk menampilkan form sesuai kebutuhan
          </p>
        </div>

        {/* Informasi Dasar Form - Selalu ada */}
        <div className="form-section-divider">
          <h4 className="form-section-title">Informasi Dasar Form Pemesanan</h4>
          <p className="form-section-desc">Form ini akan selalu muncul di preview</p>
        </div>

        <div className="form-info-box">
          <p className="text-sm text-gray-600">
            Form pemesanan akan menampilkan field berikut:
          </p>
          <ul className="form-info-list">
            <li>Nama Lengkap (wajib)</li>
            <li>No. WhatsApp (wajib)</li>
            <li>Email (wajib)</li>
            <li>Alamat (wajib)</li>
          </ul>
        </div>

        {/* Bagian Berdasarkan Kategori */}
        {isKategoriBuku() && (
          <div className="form-section-divider">
            <h4 className="form-section-title">Kategori Buku (Kategori 13)</h4>
            <p className="form-section-desc">Akan menampilkan kalkulator ongkir dan rincian pesanan</p>
          </div>
        )}

        {isKategoriWorkshop() && (
          <div className="form-section-divider">
            <h4 className="form-section-title">Kategori Workshop (Kategori 15)</h4>
            <p className="form-section-desc">Akan menampilkan input down payment</p>
          </div>
        )}

        {!kategori && (
          <div className="form-info-box">
            <p className="text-sm text-gray-500">
              Pilih kategori untuk melihat opsi tambahan
            </p>
          </div>
        )}
      </div>
    </ComponentWrapper>
  );
}
