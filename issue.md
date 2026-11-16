# Task: Implementasi Dokumentasi API Menggunakan Swagger (OpenAPI) di ElysiaJS

## 1. Ringkasan Tugas (Overview)
Tugas ini bertujuan untuk mengintegrasikan antarmuka dokumentasi interaktif **Swagger UI** ke dalam project. Dengan adanya Swagger, developer atau pengguna API dapat dengan mudah melihat seluruh daftar endpoint yang tersedia, skema request/response, mencoba langsung endpoint (*Try it out*), serta melakukan simulasi autentikasi dengan Bearer token melalui browser.

Library resmi yang digunakan adalah plugin **`@elysiajs/swagger`**.

---

## 2. Kriteria Keberhasilan (Acceptance Criteria)
- [ ] Library `@elysiajs/swagger` terpasang di `package.json` dependencies.
- [ ] Halaman Swagger UI dapat diakses melalui browser di path **`/swagger`** (misal: `http://localhost:3000/swagger`).
- [ ] Dokumentasi memiliki metadata yang jelas: Title, Version, dan Deskripsi API.
- [ ] Seluruh endpoint terdaftar dan dikelompokkan berdasarkan **Tags**:
  - `General`: `GET /`, `GET /health`
  - `Users`: `GET /api/users`, `POST /api/users`, `GET /api/users/current`
  - `Auth`: `POST /api/users/login`, `DELETE /api/users/logout`
- [ ] Fitur **Authorize (Bearer Token)** tersedia di Swagger UI sehingga endpoint yang membutuhkan header `Authorization: Bearer <token>` (`/current` dan `/logout`) dapat diuji langsung dari UI.
- [ ] Semua unit test yang sudah ada (`bun test`) tetap berjalan sukses (PASS) tanpa error.
- [ ] File `README.md` diperbarui dengan informasi tautan Swagger UI.

---

## 3. Struktur File Terkait

File-file yang akan disentuh dalam implementasi ini:
```text
belajar-vibe-coding/
├── package.json              # Ditambahkan dependensi @elysiajs/swagger
├── src/
│   ├── index.ts              # Inisialisasi plugin swagger & konfigurasi OpenAPI
│   └── routes/
│       └── users-route.ts    # Penambahan metadata detail (summary, tags, security)
└── README.md                 # Penambahan link & petunjuk akses /swagger
```

---

## 4. Tahapan Implementasi (Step-by-Step Guide)

### Langkah 1: Install Plugin `@elysiajs/swagger`
Jalankan perintah berikut di terminal root project:

```bash
bun add @elysiajs/swagger
```

**Verifikasi**: Pastikan `@elysiajs/swagger` sudah tercatat di bagian `dependencies` pada file [`package.json`](file:///c:/Users/user/Documents/Developments/GITHUB/belajar-vibe-coding/package.json).

---

### Langkah 2: Daftarkan Plugin Swagger di `src/index.ts`
Buka file [`src/index.ts`](file:///c:/Users/user/Documents/Developments/GITHUB/belajar-vibe-coding/src/index.ts).

1. Import fungsi `swagger` dari `@elysiajs/swagger`:
   ```typescript
   import { swagger } from "@elysiajs/swagger";
   ```

2. Pasang plugin `.use(swagger(...))` pada instance `app`.
   Konfigurasikan informasi dokumentasi dan skema keamanan Bearer token (`bearerAuth`) agar tombol **Authorize** muncul di Swagger UI:
   ```typescript
   export const app = new Elysia()
     .use(
       swagger({
         path: "/swagger",
         documentation: {
           info: {
             title: "Belajar Vibe Coding - API Documentation",
             version: "1.0.0",
             description:
               "Dokumentasi API interaktif untuk autentikasi user dan manajemen sesi dengan ElysiaJS, Drizzle ORM, dan MySQL.",
           },
           tags: [
             { name: "General", description: "Endpoint sistem dan monitoring kesehatan server" },
             { name: "Users", description: "Endpoint manajemen data dan registrasi pengguna" },
             { name: "Auth", description: "Endpoint autentikasi dan manajemen sesi login/logout" },
           ],
           components: {
             securitySchemes: {
               bearerAuth: {
                 type: "http",
                 scheme: "bearer",
                 bearerFormat: "UUID",
                 description: "Masukkan session token UUID yang didapat dari endpoint login",
               },
             },
           },
         },
       })
     )
   ```

3. Tambahkan metadata `detail` pada endpoint root dan health check di `src/index.ts`:
   - Endpoint `GET /`:
     ```typescript
     .get(
       "/",
       () => ({
         message: "Welcome to Elysia + Bun + Drizzle + MySQL API",
         status: "ok",
         timestamp: new Date().toISOString(),
       }),
       {
         detail: {
           tags: ["General"],
           summary: "Welcome message & server status",
         },
       }
     )
     ```
   - Endpoint `GET /health`:
     ```typescript
     .get(
       "/health",
       () => ({
         status: "healthy",
         uptime: process.uptime(),
       }),
       {
         detail: {
           tags: ["General"],
           summary: "Health check & uptime server",
         },
       }
     )
     ```
   - Endpoint `GET /api/users`:
     ```typescript
     .get(
       "/users",
       async () => {
         try {
           return await db.select().from(users);
         } catch (error: any) {
           return { error: error.message };
         }
       },
       {
         detail: {
           tags: ["Users"],
           summary: "Mendapatkan daftar seluruh user",
         },
       }
     )
     ```

---

### Langkah 3: Tambahkan Metadata Swagger pada Route Users (`src/routes/users-route.ts`)
Buka file [`src/routes/users-route.ts`](file:///c:/Users/user/Documents/Developments/GITHUB/belajar-vibe-coding/src/routes/users-route.ts).

Tambahkan properti `detail` pada konfigurasi skema setiap endpoint:

1. **`POST /` (Registrasi User)**:
   ```typescript
   {
     body: t.Object({
       name: t.String({ minLength: 1, maxLength: 255 }),
       email: t.String({ format: "email", maxLength: 255 }),
       password: t.String({ minLength: 1, maxLength: 255 }),
     }),
     detail: {
       tags: ["Users"],
       summary: "Registrasi pengguna baru",
       description: "Mendaftarkan user baru dengan email unik dan password yang di-hash dengan bcrypt.",
     },
   }
   ```

2. **`POST /login` (Login User)**:
   ```typescript
   {
     body: t.Object({
       email: t.String({ format: "email", maxLength: 255 }),
       password: t.String({ minLength: 1, maxLength: 255 }),
     }),
     detail: {
       tags: ["Auth"],
       summary: "Login pengguna",
       description: "Verifikasi email dan password, kemudian mengembalikan UUID session token baru.",
     },
   }
   ```

3. **`GET /current` (Get Current User Profile)**:
   Tambahkan konfigurasi `security: [{ bearerAuth: [] }]`:
   ```typescript
   {
     detail: {
       tags: ["Users"],
       summary: "Mendapatkan profil user yang sedang login",
       description: "Membutuhkan header Authorization dengan format 'Bearer <token>'.",
       security: [{ bearerAuth: [] }],
     },
   }
   ```

4. **`DELETE /logout` (Logout User)**:
   Tambahkan konfigurasi `security: [{ bearerAuth: [] }]`:
   ```typescript
   {
     detail: {
       tags: ["Auth"],
       summary: "Logout pengguna",
       description: "Menghapus token sesi dari database sehingga token tidak lagi valid.",
       security: [{ bearerAuth: [] }],
     },
   }
   ```

---

### Langkah 4: Perbarui `README.md`
Buka file [`README.md`](file:///c:/Users/user/Documents/Developments/GITHUB/belajar-vibe-coding/README.md).
1. Tambahkan informasi bahwa Swagger UI tersedia di `http://localhost:3000/swagger`.
2. Cantumkan `@elysiajs/swagger` pada tabel daftar library dependencies.

---

### Langkah 5: Pengujian & Verifikasi (Testing)

1. **Verifikasi Tampilan Swagger UI**:
   - Jalankan server:
     ```bash
     bun run dev
     ```
   - Buka browser ke alamat: `http://localhost:3000/swagger`
   - Pastikan:
     - Header halaman menampilkan judul **Belajar Vibe Coding - API Documentation**.
     - Tombol **Authorize** gembok hijau muncul di kanan atas.
     - Tag `General`, `Users`, dan `Auth` tampil rapi.
     - Setiap endpoint memiliki summary yang jelas.

2. **Verifikasi Interaksi & Fitur "Try it out"**:
   - Coba jalankan `GET /health` melalui Swagger UI, pastikan respon 200 muncul.
   - Coba jalankan `POST /api/users` untuk registrasi user baru.
   - Coba jalankan `POST /api/users/login`, copy string token UUID dari respon.
   - Klik tombol **Authorize** di atas, masukkan token ke form Bearer auth, klik **Authorize**, lalu **Close**.
   - Coba jalankan `GET /api/users/current`, pastikan data user berhasil tampil.
   - Coba jalankan `DELETE /api/users/logout`, pastikan respon `{"data": "OK"}`.

3. **Verifikasi Unit Test Otomatis**:
   Jalankan test suite untuk memastikan tidak ada perubahan yang merusak endpoint:
   ```bash
   bun test
   ```
   *Expected Output*: Semua test file (`tests/users.test.ts` dan `tests/sessions.test.ts`) lolos / PASS.

---

## 5. Ringkasan Checklist Pengerjaan

- [ ] Install `@elysiajs/swagger` menggunakan `bun add @elysiajs/swagger`.
- [ ] Daftarkan plugin di `src/index.ts` dengan path `/swagger` dan konfigurasi `documentation`.
- [ ] Tambahkan metadata `detail` pada endpoint di `src/index.ts` (`/`, `/health`, `/api/users`).
- [ ] Tambahkan metadata `detail` dan `security` pada endpoint di `src/routes/users-route.ts`.
- [ ] Update `README.md` dengan info Swagger UI.
- [ ] Buka `http://localhost:3000/swagger` di browser dan uji fitur *Authorize* serta *Try it out*.
- [ ] Jalankan `bun test` dan pastikan semua test PASS.
