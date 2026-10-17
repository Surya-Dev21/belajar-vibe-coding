# Bug: Tidak Ada Validasi Panjang Input pada Registrasi User

## 1. Deskripsi Bug

Endpoint **`POST /api/users`** (registrasi user baru) tidak memvalidasi panjang karakter dari field `name`, `email`, dan `password`. Ketika user mengirim `name` sepanjang **300 karakter**, server mengembalikan response:

```json
{
  "error": "Gagal mendaftarkan user"
}
```

**Status code**: `400`

Pesan error ini **terlalu generik** dan tidak menjelaskan penyebab sebenarnya. User/client tidak tahu bahwa masalahnya adalah nama yang terlalu panjang.

---

## 2. Cara Reproduksi

1. Jalankan aplikasi: `bun --watch src/index.ts`
2. Kirim request berikut (nama 300 karakter):

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "email": "test300@example.com",
    "password": "password123"
  }'
```

3. **Hasil aktual**: `{"error":"Gagal mendaftarkan user"}` (status 400)
4. **Hasil yang diharapkan**: `{"error":"Nama maksimal 255 karakter"}` (status 422 atau 400 dengan pesan spesifik)

---

## 3. Analisis Akar Masalah (Root Cause)

### Alur data saat ini:

```
Request masuk → Route (validasi Elysia) → Service → Database (MySQL)
```

### Masalah terjadi di 2 tempat:

### Masalah 1: Tidak ada validasi `maxLength` di Route

**File**: `src/routes/users-route.ts` (baris 27-31)

```typescript
body: t.Object({
  name: t.String({ minLength: 1 }),         // ❌ tidak ada maxLength
  email: t.String({ format: "email" }),      // ❌ tidak ada maxLength
  password: t.String({ minLength: 1 }),      // ❌ tidak ada maxLength
}),
```

Saat ini hanya ada validasi `minLength: 1` (tidak boleh kosong), tapi **tidak ada batas maksimal**. Seharusnya disesuaikan dengan batasan kolom di database.

### Masalah 2: Pesan error generik di catch block

**File**: `src/routes/users-route.ts` (baris 21-23)

```typescript
} catch (error: any) {
  set.status = 400;
  return { error: error.message || "Gagal mendaftarkan user" };
}
```

Ketika database menolak data karena terlalu panjang, error dari MySQL tidak informatif untuk end-user. Seharusnya validasi sudah ditangkap **sebelum** sampai ke database.

### Referensi schema database:

**File**: `src/db/schema.ts` (baris 3-9)

```typescript
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),      // maks 255 karakter
  email: varchar("email", { length: 255 }),     // maks 255 karakter
  password: varchar("password", { length: 255 }),// maks 255 karakter (sudah di-hash)
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## 4. Tahapan Perbaikan (Step-by-Step)

### Step 1: Tambahkan validasi `maxLength` di Route

**File yang diedit**: `src/routes/users-route.ts`

**Apa yang dilakukan**: Tambahkan constraint `maxLength` pada schema validasi body request di endpoint `POST /users`.

**Cari kode ini** (sekitar baris 27-31):

```typescript
body: t.Object({
  name: t.String({ minLength: 1 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 1 }),
}),
```

**Ganti menjadi**:

```typescript
body: t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  email: t.String({ format: "email", maxLength: 255 }),
  password: t.String({ minLength: 1, maxLength: 255 }),
}),
```

**Penjelasan**:
- `maxLength: 255` memastikan Elysia akan **otomatis menolak** request yang melebihi batas **sebelum** kode masuk ke service atau database.
- Elysia akan mengembalikan error validasi bawaan yang sudah cukup jelas (status `422`).
- Angka `255` disesuaikan dengan `varchar({ length: 255 })` pada schema database (`src/db/schema.ts` baris 5-7).

---

### Step 2: (Opsional) Tambahkan juga validasi `maxLength` di endpoint Login

**File yang diedit**: `src/routes/users-route.ts`

**Apa yang dilakukan**: Endpoint login juga tidak punya batasan maxLength. Meskipun tidak menyebabkan error database, tetap sebaiknya divalidasi untuk konsistensi dan keamanan (mencegah request body terlalu besar).

**Cari kode ini** (sekitar baris 47-50):

```typescript
body: t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 1 }),
}),
```

**Ganti menjadi**:

```typescript
body: t.Object({
  email: t.String({ format: "email", maxLength: 255 }),
  password: t.String({ minLength: 1, maxLength: 255 }),
}),
```

---

### Step 3: Testing — Pastikan Perbaikan Bekerja

Setelah perubahan disimpan, jalankan test berikut:

#### Test 1: Registrasi dengan nama 300 karakter (harus ditolak)

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "email": "test300@example.com",
    "password": "password123"
  }'
```

**Hasil yang diharapkan**: Status `422` dengan pesan error validasi dari Elysia (bukan error generik dari database).

#### Test 2: Registrasi dengan nama normal (harus berhasil)

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "johndoe@example.com",
    "password": "password123"
  }'
```

**Hasil yang diharapkan**: Status `201` dengan response `{"data":"OK"}`.

#### Test 3: Registrasi dengan email 300 karakter (harus ditolak)

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane",
    "email": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA@example.com",
    "password": "password123"
  }'
```

**Hasil yang diharapkan**: Status `422` dengan pesan error validasi.

---

## 5. File yang Perlu Diubah

| File | Perubahan |
|---|---|
| `src/routes/users-route.ts` | Tambah `maxLength: 255` pada validasi body `POST /users` dan `POST /users/login` |

---

## 6. Catatan Penting

- **Jangan ubah** file `src/db/schema.ts` — schema database sudah benar, masalahnya hanya di layer validasi route.
- **Jangan ubah** file `src/services/users-service.ts` — logic service tidak perlu dimodifikasi karena validasi seharusnya ditangani di layer route sebelum data masuk ke service.
- Prinsipnya: **validasi input di pintu masuk (route)**, bukan di dalam service atau database.
