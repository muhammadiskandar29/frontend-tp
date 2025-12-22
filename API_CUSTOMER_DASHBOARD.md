# API Documentation: Customer Dashboard

## Endpoint
```
GET /api/customer/dashboard
```

## Description
Mengambil data dashboard customer termasuk informasi customer, statistik order, dan order terakhir.

## Headers
```
Authorization: Bearer {token}
Content-Type: application/json
```

## Response

### Success Response (200 OK)

```json
{
    "success": true,
    "data": {
        "customer": {
            "id": 1,
            "nama": "samsul",
            "email": "smsamsul@gmail.com",
            "wa": "628990550113",
            "status": "1"
        },
        "statistik": {
            "total_order": 2,
            "order_selesai": 2,
            "order_proses": 0
        },
        "order_terakhir": {
            "produk": null,
            "tanggal": "2025-11-03 09:44:18",
            "status": "1",
            "total": "35.000"
        }
    }
}
```

### Response Fields

#### `customer`
- `id` (integer): ID customer
- `nama` (string): Nama lengkap customer
- `email` (string): Email customer
- `wa` (string): Nomor WhatsApp customer
- `status` (string): Status customer ("1" = aktif, "0" = tidak aktif)

#### `statistik`
- `total_order` (integer): Total jumlah order
- `order_selesai` (integer): Jumlah order yang sudah selesai
- `order_proses` (integer): Jumlah order yang sedang diproses

#### `order_terakhir`
- `produk` (string|null): Nama produk dari order terakhir
- `tanggal` (string): Tanggal order terakhir (format: "YYYY-MM-DD HH:mm:ss")
- `status` (string): Status order terakhir
- `total` (string): Total harga order terakhir

## Error Responses

### 401 Unauthorized
```json
{
    "success": false,
    "message": "Unauthorized"
}
```

### 500 Internal Server Error
```json
{
    "success": false,
    "message": "Internal server error"
}
```

## Notes

### Filtering Order Aktif
- Order yang ditampilkan di "Order Aktif Saya" harus memiliki `status_pembayaran = 3` (paid)
- Order dengan `status_pembayaran` selain 3 akan ditampilkan dengan:
  - Lock overlay dengan notifikasi "Selesaikan Pembayaran"
  - Button berubah menjadi "Selesaikan Pembayaran" (bukan button untuk ke proses produk)
  - Card dalam posisi locked (tidak bisa diakses)

### Status Pembayaran
- `status_pembayaran = 3` atau `"3"`: Order sudah dibayar (paid)
- `status_pembayaran` selain 3: Order belum dibayar (unpaid)

## Example Usage

```javascript
const response = await fetch('/api/customer/dashboard', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.data.customer);
console.log(data.data.statistik);
```

