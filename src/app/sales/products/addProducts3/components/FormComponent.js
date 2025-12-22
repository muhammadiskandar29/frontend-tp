"use client";

import { FileText } from "lucide-react";

export default function FormComponent({ data = {}, onUpdate }) {
  // Form component - akan diisi nanti dengan form pemesanan
  return (
    <div className="block-component form-component">
      <div className="block-header">
        <FileText size={16} />
        <span>Form Pemesanan</span>
      </div>
      <div className="block-content">
        <p className="text-sm text-gray-500">
          Form pemesanan akan ditampilkan di sini. Konfigurasi form akan ditambahkan nanti.
        </p>
      </div>
    </div>
  );
}

