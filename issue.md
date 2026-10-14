# Task: Setup Backend Project dengan Bun, ElysiaJS, Drizzle ORM, dan MySQL

## 1. Overview
Inisialisasi proyek backend baru menggunakan runtime **Bun**, framework web **ElysiaJS**, ORM **Drizzle**, dan basis data **MySQL**. Dokumen ini berfungsi sebagai panduan implementasi tingkat tinggi (high-level plan) untuk dieksekusi oleh programmer atau model AI.

---

## 2. Tech Stack
- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Web Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Migration & Dev Tool**: `drizzle-kit`
- **Database Driver**: `mysql2`
- **Database**: MySQL

---

## 3. High-Level Implementation Steps

### Phase 1: Inisialisasi Proyek
- Inisialisasi proyek Bun pada root direktori saat ini.
- Konfigurasi `package.json` dan `tsconfig.json` standar untuk Bun + TypeScript.
- Siapkan file `.gitignore` untuk mengabaikan `node_modules`, file environment (`.env`), dan artifact build.

### Phase 2: Instalasi Dependensi
- **Production Dependencies**:
  - `elysia`
  - `drizzle-orm`
  - `mysql2`
- **Development Dependencies**:
  - `drizzle-kit`
  - `@types/bun`

### Phase 3: Konfigurasi Environment & Database
- Buat file `.env.example` dan `.env` yang memuat parameter koneksi database:
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (atau format `DATABASE_URL`).
- Buat file konfigurasi Drizzle (`drizzle.config.ts`) untuk kebutuhan migrasi dan schema generation.
- Buat modul koneksi database (`db/index.ts` atau sejenisnya) yang menginisialisasi client MySQL dan instance Drizzle.

### Phase 4: Struktur Skema & Model Database
- Buat direktori skema Drizzle (misal: `src/db/schema/`).
- Definisikan minimal satu skema tabel awal (misal: tabel `users` atau item dasar) menggunakan helper MySQL dari Drizzle (`drizzle-orm/mysql-core`).
- Tambahkan script npm di `package.json` untuk:
  - Generate migrasi (`drizzle-kit generate`)
  - Eksekusi migrasi (`drizzle-kit migrate` atau `drizzle-kit push`)

### Phase 5: Setup ElysiaJS Server
- Buat entry point aplikasi (misal: `src/index.ts`).
- Inisialisasi instance Elysia server:
  - Endpoint root atau health check: `GET /` atau `GET /health` untuk memverifikasi server berjalan.
  - Endpoint contoh yang melakukan query sederhana ke database menggunakan Drizzle.
- Konfigurasi server untuk berjalan pada port tertentu (default: 3000 atau dari environment variable).

### Phase 6: Scripts & Standarisasi Menjalankan Aplikasi
- Tambahkan script yang nyaman di `package.json`:
  - `dev`: Menjalankan server dalam mode watch (`bun --watch src/index.ts`)
  - `start`: Menjalankan server untuk production (`bun src/index.ts`)
  - `db:generate`: Generate schema migrasi
  - `db:push` / `db:migrate`: Menerapkan perubahan schema ke database MySQL

---

## 4. Rekomendasi Struktur Direktori (High-Level)

```text
├── src/
│   ├── db/
│   │   ├── index.ts        # Inisialisasi koneksi database
│   │   └── schema.ts       # Definisi schema tabel Drizzle
│   ├── routes/             # Handler / controller route (opsional)
│   └── index.ts            # Entry point server Elysia
├── drizzle/                # File migrasi yang di-generate (drizzle-kit)
├── .env.example            # Template variabel environment
├── drizzle.config.ts       # Konfigurasi drizzle-kit
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5. Acceptance Criteria (Definition of Done)
1. **Server Berjalan**: Perintah `bun dev` atau `bun run dev` berhasil menjalankan server Elysia tanpa error.
2. **Koneksi Database**: Aplikasi dapat terhubung ke MySQL menggunakan konfigurasi environment.
3. **ORM & Migrasi Siap**: Perintah `drizzle-kit` dapat membaca schema dan men-generate atau mengeksekusi migrasi ke MySQL.
4. **Endpoint Responsif**: Mengakses endpoint health check mengembalikan status `200 OK`.
