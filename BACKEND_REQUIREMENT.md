# Backend Requirement: Email Update Sync

## ⚠️ Masalah yang Terjadi

Ketika admin mengubah email user dari `asep@gmai.com` ke `asep@gmail.com`:

1. ✅ Email di tabel `users` sudah terupdate
2. ❌ Email di tabel `authentication/login` masih pakai email lama
3. ❌ User tidak bisa login dengan email baru, harus pakai email lama

## 🔧 Solusi yang Diperlukan

### Endpoint: `PUT /api/admin/users/{id}`

**Backend harus mengupdate email di 2 tempat:**

1. **Tabel `users`** (sudah dilakukan)
2. **Tabel `authentication/login`** (perlu ditambahkan)

### Contoh Implementasi

```php
// Pseudo code - sesuaikan dengan framework yang digunakan
public function updateUser($id, $data) {
    $oldUser = User::find($id);
    $oldEmail = $oldUser->email;
    $newEmail = $data['email'];
    
    // 1. Update tabel users
    $user = User::where('id', $id)->update([
        'nama' => $data['nama'],
        'email' => $newEmail,
        // ... field lainnya
    ]);
    
    // 2. ⚠️ PENTING: Update email di tabel authentication/login juga
    if ($oldEmail !== $newEmail) {
        // Update di tabel users (untuk login)
        Auth::where('email', $oldEmail)->update([
            'email' => $newEmail
        ]);
        
        // Atau jika menggunakan tabel terpisah
        UserAuth::where('user_id', $id)->update([
            'email' => $newEmail
        ]);
        
        // Atau jika email adalah username di tabel users
        // Pastikan email di tabel users yang digunakan untuk login juga terupdate
    }
    
    return response()->json([
        'success' => true,
        'message' => 'User berhasil diubah',
        'data' => $user
    ]);
}
```

## 📋 Checklist untuk Backend Developer

- [ ] Identifikasi tabel yang digunakan untuk authentication/login
- [ ] Pastikan email di tabel authentication terupdate saat update user
- [ ] Test: Update email user dan coba login dengan email baru
- [ ] Test: Pastikan login dengan email lama tidak bisa (jika diperlukan)
- [ ] Test: Pastikan login dengan email baru bisa

## 🧪 Test Case

1. **Test 1: Update email typo ke email valid**
   - User: `asep@gmai.com` → `asep@gmail.com`
   - Expected: User bisa login dengan `asep@gmail.com`
   - Current: ❌ User tidak bisa login dengan email baru

2. **Test 2: Update email ke email lain**
   - User: `user@yahoo.com` → `user@gmail.com`
   - Expected: User bisa login dengan `user@gmail.com`
   - Current: ❌ User tidak bisa login dengan email baru

## 📝 Catatan

- Frontend sudah memberikan warning yang jelas saat email diubah
- Frontend sudah meminta konfirmasi sebelum update email
- Backend harus memastikan email di tabel authentication juga terupdate
- Jika tidak, user akan tetap harus login dengan email lama

## 🔗 Related Files

- Frontend: `src/app/admin/users/editUsers.js`
- Frontend: `src/app/admin/users/page.js`
- Backend: `PUT /api/admin/users/{id}` endpoint

