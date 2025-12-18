"use client";

import "@/styles/sales/customer.css";

// Helper untuk display pendapatan dalam format readable
const formatPendapatan = (value) => {
  if (!value) return "—";
  const mapping = {
    "<1jt": "< 1 Juta",
    "1-5jt": "1 - 5 Juta",
    "5-10jt": "5 - 10 Juta",
    "10-15jt": "10 - 15 Juta",
    "15-20jt": "15 - 20 Juta",
    ">20jt": "> 20 Juta",
  };
  return mapping[value] || value;
};

// Helper untuk format value dengan placeholder
const formatValue = (value) => {
  return value || "—";
};

// Helper untuk format Instagram
const formatInstagram = (value) => {
  if (!value) return "—";
  return value.startsWith("@") ? value : "@" + value;
};

// Helper untuk format jenis kelamin
const formatJenisKelamin = (value) => {
  if (value === "l") return "Laki-laki";
  if (value === "p") return "Perempuan";
  return "—";
};

// Komponen Field untuk layout modern
const DetailField = ({ label, value, className = "" }) => {
  const isEmpty = !value || value === "—";
  return (
    <div className={`customer-detail-field ${className}`}>
      <div className="customer-detail-label">{label}</div>
      <div className={`customer-detail-value ${isEmpty ? "customer-detail-value--empty" : ""}`}>
        {value}
      </div>
    </div>
  );
};

export default function ViewCustomerModal({ customer, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* HEADER */}
        <div className="modal-header">
          <h2>Detail Data Customer</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="pi pi-times"></i>
          </button>
        </div>

        {/* BODY - Modern Grid Layout */}
        <div className="modal-body">
          <div className="customer-detail-grid">
            <DetailField 
              label="Nama" 
              value={formatValue(customer.nama)} 
            />
            
            <DetailField 
              label="Email" 
              value={formatValue(customer.email)} 
            />
            
            <DetailField 
              label="No. HP" 
              value={formatValue(customer.wa)} 
            />
            
            <DetailField 
              label="Nama Panggilan" 
              value={formatValue(customer.nama_panggilan)} 
            />
            
            <DetailField 
              label="Instagram" 
              value={formatInstagram(customer.instagram)} 
            />
            
            <DetailField 
              label="Profesi" 
              value={formatValue(customer.profesi)} 
            />
            
            <DetailField 
              label="Pendapatan per Bulan" 
              value={formatPendapatan(customer.pendapatan_bln)} 
            />
            
            <DetailField 
              label="Industri Pekerjaan" 
              value={formatValue(customer.industri_pekerjaan)} 
            />
            
            <DetailField 
              label="Jenis Kelamin" 
              value={formatJenisKelamin(customer.jenis_kelamin)} 
            />
            
            <DetailField 
              label="Tanggal Lahir" 
              value={formatValue(customer.tanggal_lahir)} 
            />
            
            <DetailField 
              label="Alamat" 
              value={formatValue(customer.alamat)} 
              className="customer-detail-field--full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
