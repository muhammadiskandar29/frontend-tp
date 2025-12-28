# 📖 Panduan Penggunaan Dummy Products (Canvas Style)

## 🎯 Overview

Sistem ini mendukung **2 format produk**:
1. **Format Lama** - Produk dengan struktur data tradisional (gambar[], testimoni[], list_point[], dll)
2. **Format Canvas (Blocks)** - Produk dengan struktur blocks dari `addProducts3` (untuk testing sebelum backend siap)

## 🚀 Cara Menggunakan

### 1. Produk Dummy yang Tersedia

Saat ini ada **2 produk dummy** yang bisa diakses:

#### Produk 1: Webinar Ternak Properti
- **URL**: `/landing/webinar-ternak-properti`
- **Kategori**: Webinar (11)
- **Harga**: Rp 299.000 (dari Rp 500.000)
- **Fitur**: Text, Image, Price, List, Video, Testimoni, Form, FAQ

#### Produk 2: Buku Panduan Investasi Properti
- **URL**: `/landing/buku-panduan-investasi-properti`
- **Kategori**: Buku (13) - **Dengan Ongkir**
- **Harga**: Rp 120.000 (dari Rp 250.000)
- **Fitur**: Text, Image, Price, List, Testimoni, Form (dengan Ongkir Calculator), FAQ

#### Produk 3: Workshop Investasi Properti
- **URL**: `/landing/workshop-investasi-properti`
- **Kategori**: Workshop (15) - **Dengan Down Payment**
- **Harga**: Rp 2.000.000 (dari Rp 3.500.000)
- **Fitur**: Text, Image, Price, List, Video, Testimoni, Form (dengan Down Payment Input), FAQ

### 2. Cara Buka Produk

#### Via Browser:
```
http://localhost:3000/landing/webinar-ternak-properti
http://localhost:3000/landing/buku-panduan-investasi-properti
```

#### Via Production:
```
https://onedashboard.vercel.app/landing/webinar-ternak-properti
https://onedashboard.vercel.app/landing/buku-panduan-investasi-properti
```

### 3. Cara Menambah Produk Dummy Baru

Edit file: `src/data/dummy-products.js`

```javascript
export const dummyProducts = {
  // Tambah produk baru di sini
  "kode-produk-baru": {
    id: 997, // ID unik
    nama: "Nama Produk",
    kode: "kode-produk-baru",
    url: "/kode-produk-baru",
    kategori: "11", // 10=Ebook, 11=Webinar, 12=Seminar, 13=Buku, 14=Ecourse, 15=Workshop, 16=Private Mentoring
    kategori_id: 11,
    kategori_rel: { id: 11, nama: "Webinar" },
    harga_asli: 500000,
    harga_coret: 750000,
    harga_promo: 299000,
    landingpage: "1", // 1=non-fisik, 2=fisik
    status: 1,
    blocks: [
      // Tambah blocks di sini
      {
        id: "block-1",
        type: "text",
        data: { content: "Isi teks..." },
        order: 1
      },
      // ... blocks lainnya
    ]
  }
};
```

### 4. Format Blocks yang Didukung

#### Text Block
```javascript
{
  id: "block-1",
  type: "text",
  data: {
    content: "Isi teks di sini..."
  },
  order: 1
}
```

#### Image Block
```javascript
{
  id: "block-2",
  type: "image",
  data: {
    src: "https://images.unsplash.com/photo-xxx",
    alt: "Alt text",
    caption: "Caption gambar (opsional)"
  },
  order: 2
}
```

#### Price Block
```javascript
{
  id: "block-3",
  type: "price",
  data: {}, // Harga diambil dari productData
  order: 3
}
```

#### List Block
```javascript
{
  id: "block-4",
  type: "list",
  data: {
    items: [
      { nama: "Point 1" },
      { nama: "Point 2" },
      { nama: "Point 3" }
    ]
  },
  order: 4
}
```

#### Video Block
```javascript
{
  id: "block-5",
  type: "youtube", // atau "video"
  data: {
    items: [
      {
        embedUrl: "https://www.youtube.com/embed/VIDEO_ID"
      }
    ]
  },
  order: 5
}
```

#### Testimoni Block
```javascript
{
  id: "block-6",
  type: "testimoni",
  data: {
    items: [
      {
        nama: "Nama Testimoni",
        deskripsi: "Isi testimoni...",
        gambar: "https://i.pravatar.cc/150?img=1" // Opsional
      }
    ]
  },
  order: 6
}
```

#### Form Block
```javascript
{
  id: "block-7",
  type: "form",
  data: {
    kategori: "11" // Untuk menentukan ongkir/down payment
  },
  order: 7
}
```

#### FAQ Block
```javascript
{
  id: "block-8",
  type: "faq",
  data: {}, // FAQ otomatis berdasarkan kategori
  order: 8
}
```

## 🔄 Cara Kerja Sistem

### 1. Deteksi Format
Sistem otomatis mendeteksi format produk:
- Jika `data.blocks` ada → Render **Canvas Style**
- Jika tidak → Render **Old Style**

### 2. Form Order
Form order **selalu fungsional** untuk kedua format:
- ✅ Input: Nama, WhatsApp, Email, Alamat
- ✅ Ongkir Calculator (untuk kategori 13 - Buku)
- ✅ Down Payment (untuk kategori 15 - Workshop)
- ✅ Metode Pembayaran
- ✅ Submit ke `/api/order` (backend)

### 3. Backend Integration
- Form order submit ke `/api/order` (sudah ada)
- Data produk dummy **tidak** disimpan ke backend
- Hanya order yang dikirim ke backend

## 📝 Catatan Penting

1. **Dummy products hanya untuk testing** sebelum backend siap
2. **Form order tetap fungsional** dan mengirim ke backend
3. **Produk real dari backend** akan otomatis menggunakan format lama (backward compatible)
4. **Nanti ketika backend siap**, produk dari `addProducts3` akan disimpan dengan format blocks

## 🐛 Troubleshooting

### Produk tidak muncul?
- Pastikan kode produk ada di `dummy-products.js`
- Check console browser untuk error
- Pastikan URL sesuai: `/landing/[kode-produk]`

### Form order tidak submit?
- Check network tab di browser
- Pastikan backend `/api/order` berjalan
- Check console untuk error message

### Style tidak sesuai?
- Pastikan `add-products3.css` sudah di-import
- Check apakah ada CSS conflict
- Pastikan blocks di-render dengan benar

## 🎨 Customization

### Mengubah Style
- Edit `src/styles/sales/add-products3.css`
- Style akan apply ke semua produk dengan format blocks

### Mengubah Dummy Data
- Edit `src/data/dummy-products.js`
- Refresh browser untuk melihat perubahan

## 📞 Support

Jika ada masalah atau pertanyaan, silakan hubungi tim development.

---

**Last Updated**: 2024
**Version**: 1.0.0

