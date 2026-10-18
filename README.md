# 🚀 Belajar Vibe Coding - Backend API

Backend REST API modern dan berkinerja tinggi yang dibangun menggunakan **Bun**, **ElysiaJS**, **Drizzle ORM**, dan **MySQL**. Aplikasi ini menyediakan fitur autentikasi berbasis session (stateful bearer token), registrasi pengguna dengan enkripsi password (bcrypt), manajemen akun, serta endpoint monitoring sistem.

---

## 📋 Daftar Isi
- [Tentang Aplikasi](#-tentang-aplikasi)
- [Tech Stack & Library](#-tech-stack--library)
- [Arsitektur & Struktur Folder](#-arsitektur--struktur-folder)
- [Skema Database](#-skema-database)
- [Dokumentasi API](#-dokumentasi-api)
- [Instalasi & Setup Project](#-instalasi--setup-project)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Pengujian (Testing)](#-pengujian-testing)

---

## 💡 Tentang Aplikasi

Aplikasi ini adalah backend service yang dirancang dengan memisahkan layer HTTP routing dan business logic (*Separation of Concerns*). Fitur utama mencakup:
- **Autentikasi & Otorisasi**: Registrasi pengguna, login multi-sesi dengan token UUID unik, proteksi endpoint dengan Bearer Token, dan logout.
- **Keamanan Data**: Hashing password menggunakan algoritma bcrypt (cost factor 10) bawaan runtime Bun.
- **Validasi Input**: Validasi schema request ketat menggunakan schema validator bawaan ElysiaJS (TypeBox).
- **Automated Testing**: Test suite komprehensif menggunakan native test runner `bun test` dengan database integration test yang idempotent.

---

## 🛠️ Tech Stack & Library

### Core Technologies
- **Runtime**: [Bun](https://bun.sh/) (v1.x) - JavaScript/TypeScript runtime & package manager ultra-cepat.
- **Framework**: [ElysiaJS](https://elysiajs.com/) - Web framework berperforma tinggi untuk Bun dengan TypeScript end-to-end type safety.
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM bertipe aman dan ringan.
- **Database**: [MySQL](https://www.mysql.com/) (versi 8.x / MariaDB).

### Dependencies (`package.json`)
| Library / Package | Tipe | Deskripsi / Fungsi |
|-------------------|------|--------------------|
| `elysia` | Dependency | Framework web HTTP server dan skema validasi type-safe |
| `@elysiajs/swagger` | Dependency | Plugin dokumentasi interaktif Swagger UI & OpenAPI spec |
| `drizzle-orm` | Dependency | Query builder dan ORM untuk berinteraksi dengan database |
| `mysql2` | Dependency | Driver client MySQL untuk koneksi database |
| `drizzle-kit` | Dev Dependency | CLI migrasi skema database, pembuatan file SQL, dan schema push |
| `@types/bun` | Dev Dependency | Definisi tipe TypeScript untuk runtime Bun |

### Fitur Native Runtime yang Digunakan
- `Bun.password`: Algoritma hashing bcrypt bawaan untuk enkripsi dan verifikasi password (`hash` & `verify`).
- `crypto.randomUUID()`: Generator token UUID v4 standar untuk session token.
- `bun test`: Runner unit test & integration test bawaan Bun.

---

## 🏗️ Arsitektur & Struktur Folder

Aplikasi menggunakan arsitektur berlapis (*Layered Architecture*) untuk memastikan kode mudah dirawat, modular, dan teruji:

```text
belajar-vibe-coding/
├── src/
│   ├── db/
│   │   ├── index.ts              # Inisialisasi pool koneksi MySQL (mysql2) & instance Drizzle
│   │   └── schema.ts             # Definisi skema tabel MySQL, relasi, dan tipe TypeScript
│   ├── routes/
│   │   └── users-route.ts        # Layer HTTP: routing endpoint, validasi schema input (TypeBox), status code
│   ├── services/
│   │   ├── users-service.ts      # Layer Bisnis: registrasi pengguna & pengambilan data profil user
│   │   └── sessions-service.ts   # Layer Bisnis: autentikasi login, pembuatan session token, & logout
│   └── index.ts                  # Entry point aplikasi: setup Elysia app, global middleware, & conditional listen
├── tests/
│   ├── setup.ts                  # Konfigurasi test: helper database cleanup dan pembuatan test data
│   ├── users.test.ts             # Test suite endpoint Root, Health, dan Users (GET & POST)
│   └── sessions.test.ts          # Test suite endpoint Login, Current User, dan Logout
├── drizzle/                      # File migrasi SQL hasil generate Drizzle Kit
├── .env.example                  # Template konfigurasi environment variables
├── .env                          # Konfigurasi environment lokal (diabaikan oleh git)
├── drizzle.config.ts             # Konfigurasi generator & migration Drizzle Kit
├── package.json                  # Konfigurasi dependensi dan script eksekusi
├── tsconfig.json                 # Konfigurasi TypeScript untuk runtime Bun
└── README.md                     # Dokumentasi utama proyek
```

### Penjelasan Layer:
1. **Routing Layer (`src/routes/`)**: Bertanggung jawab menerima HTTP request, memvalidasi tipe data body/headers, memanggil service terkait, dan menyusun HTTP response (status code & payload).
2. **Service Layer (`src/services/`)**: Berisi seluruh aturan bisnis (*business logic*), seperti cek keunikan email, enkripsi password, query Drizzle ORM, dan manajemen status sesi.
3. **Database Layer (`src/db/`)**: Mengelola koneksi database MySQL connection pool dan mendefinisikan skema tabel secara deklaratif menggunakan Drizzle ORM.
4. **Testing Layer (`tests/`)**: Pengujian end-to-end integration test terhadap instance aplikasi Elysia dan database.

---

## 🗄️ Skema Database

Skema didefinisikan pada [`src/db/schema.ts`](file:///c:/Users/user/Documents/Developments/GITHUB/belajar-vibe-coding/src/db/schema.ts) menggunakan Drizzle ORM.

### 1. Tabel `users`
Menyimpan informasi identitas akun pengguna.

| Kolom | Tipe Data | Constraint / Atribut | Keterangan |
|-------|-----------|----------------------|------------|
| `id` | `BIGINT (serial)` | Primary Key, Auto Increment | Identifikasi unik user |
| `name` | `VARCHAR(255)` | NOT NULL | Nama lengkap pengguna |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Alamat email unik untuk login |
| `password` | `VARCHAR(255)` | NOT NULL | Hash password menggunakan bcrypt |
| `created_at` | `TIMESTAMP` | DEFAULT `CURRENT_TIMESTAMP` | Waktu user didaftarkan |

### 2. Tabel `sessions`
Menyimpan token sesi aktif untuk autentikasi stateful.

| Kolom | Tipe Data | Constraint / Atribut | Keterangan |
|-------|-----------|----------------------|------------|
| `id` | `BIGINT (serial)` | Primary Key, Auto Increment | Identifikasi unik baris sesi |
| `token` | `VARCHAR(255)` | NOT NULL | UUID v4 sebagai Bearer token |
| `user_id` | `INT` | NOT NULL, References `users.id` | Foreign key ke tabel `users` |
| `created_at` | `TIMESTAMP` | DEFAULT `CURRENT_TIMESTAMP` | Waktu sesi dibuat |

---

## 🔌 Dokumentasi API

Base URL lokal: `http://localhost:3000`

> [!TIP]
> **Swagger UI Interaktif** tersedia di [`http://localhost:3000/swagger`](http://localhost:3000/swagger). Anda dapat mengeksplorasi endpoint, melihat schema data, dan mencoba langsung request (termasuk fitur *Authorize* dengan Bearer token).

### 1. Welcome & System Health

#### `GET /`
Mendapatkan pesan selamat datang dan status server.
- **Headers**: `-`
- **Response `200 OK`**:
  ```json
  {
    "message": "Welcome to Elysia + Bun + Drizzle + MySQL API",
    "status": "ok",
    "timestamp": "2026-10-18T01:00:00.000Z"
  }
  ```

#### `GET /health`
Mengecek status kesehatan server dan uptime.
- **Headers**: `-`
- **Response `200 OK`**:
  ```json
  {
    "status": "healthy",
    "uptime": 123.45
  }
  ```

---

### 2. User & Authentication Endpoints

#### `GET /api/users`
Mengambil daftar seluruh pengguna dari database.
- **Headers**: `-`
- **Response `200 OK`**:
  ```json
  [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "password": "$2b$10$...",
      "createdAt": "2026-10-18T01:00:00.000Z"
    }
  ]
  ```

#### `POST /api/users`
Mendaftarkan akun pengguna baru.
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "rahasiaPassword123"
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "data": "OK"
    }
    ```
  - `400 Bad Request` (Email sudah terdaftar):
    ```json
    {
      "error": "Email sudah terdaftar"
    }
    ```
  - `422 Unprocessable Entity` (Validasi input gagal: field kosong, format email salah, panjang karakter tidak sesuai).

#### `POST /api/users/login`
Autentikasi user dan membuat sesi login baru.
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "rahasiaPassword123"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "data": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    }
    ```
  - `400 Bad Request` (Kredensial tidak cocok):
    ```json
    {
      "error": "Email atau password salah"
    }
    ```
  - `422 Unprocessable Entity` (Validasi input gagal).

#### `GET /api/users/current`
Mendapatkan informasi profil user berdasarkan session token yang valid.
- **Headers**: `Authorization: Bearer <token>`
- **Responses**:
  - `200 OK`:
    ```json
    {
      "data": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "created_at": "2026-10-18T01:00:00.000Z"
      }
    }
    ```
  - `401 Unauthorized` (Token hilang, tidak valid, atau format salah):
    ```json
    {
      "error": "Unauthorized"
    }
    ```

#### `DELETE /api/users/logout`
Menghapus session token aktif dari database.
- **Headers**: `Authorization: Bearer <token>`
- **Responses**:
  - `200 OK`:
    ```json
    {
      "data": "OK"
    }
    ```
  - `401 Unauthorized` (Token tidak ditemukan atau sudah logout):
    ```json
    {
      "error": "Unauthorized"
    }
    ```

---

## 💻 Instalasi & Setup Project

### Prasyarat
1. Telah menginstal **[Bun](https://bun.sh/)** (v1.0 atau lebih baru).
2. Service **MySQL** aktif dan dapat diakses (misal via XAMPP, Laragon, Docker, atau MySQL Server langsung).

### Langkah-Langkah Setup

1. **Clone Repositori**:
   ```bash
   git clone https://github.com/Surya-Dev21/belajar-vibe-coding.git
   cd belajar-vibe-coding
   ```

2. **Install Dependensi**:
   ```bash
   bun install
   ```

3. **Konfigurasi Environment Variables**:
   Salin template `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Buka file `.env` dan sesuaikan kredensial database Anda:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=belajar_vibe_coding
   DATABASE_URL=mysql://root:@localhost:3306/belajar_vibe_coding
   ```

   > [!NOTE]
   > Pastikan database dengan nama yang ditentukan pada `DB_NAME` sudah dibuat di MySQL Anda:
   > ```sql
   > CREATE DATABASE belajar_vibe_coding;
   > ```

4. **Sinkronisasi Skema Database**:
   Terapkan skema Drizzle ke database:
   ```bash
   # Opsi 1: Push skema langsung (disarankan untuk development)
   bun run db:push

   # Opsi 2: Generate file migrasi SQL lalu jalankan migrasi
   bun run db:generate
   bun run db:migrate
   ```

---

## 🏃 Menjalankan Aplikasi

Tersedia beberapa script pada `package.json`:

```bash
# Mode Development (otomatis reload saat file berubah)
bun run dev

# Mode Production
bun run start
```

Setelah server berjalan, akses di browser atau API client (Postman/cURL):
```text
http://localhost:3000/
```

---

## 🧪 Pengujian (Testing)

Proyek ini telah dilengkapi dengan unit & integration test komprehensif menggunakan native test runner `bun test`. Test mencakup pengujian:
- Status dan respon endpoint Root & Health.
- Registrasi pengguna (sukses, validasi missing fields, email duplikat, dan verifikasi hash password bcrypt).
- Login pengguna (sukses, wrong password, user not found, dan multi-session token).
- Mengambil profil `current user` dengan Bearer token (valid, token salah, token tanpa prefix, verifikasi proteksi password).
- Logout user dan pembatalan token sesi.

### Menjalankan Test Suite
Pastikan database MySQL lokal Anda sedang aktif, lalu jalankan:

```bash
bun test
```
atau
```bash
bun run test
```

> [!TIP]
> File pengujian berada di folder `tests/`. Setiap skenario pengujian akan otomatis membersihkan tabel `sessions` dan `users` melalui helper `cleanDatabase()` agar seluruh test bersifat idempotent dan tidak saling mempengaruhi.