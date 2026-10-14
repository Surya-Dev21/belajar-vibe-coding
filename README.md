# Belajar Vibe Coding - Backend API

Backend REST API yang dibangun dengan **Bun**, **ElysiaJS**, **Drizzle ORM**, dan **MySQL**.

## 🚀 Tech Stack
- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: MySQL (`mysql2` driver)

## 📁 Struktur Direktori
```text
├── src/
│   ├── db/
│   │   ├── index.ts        # Inisialisasi pool koneksi MySQL dan Drizzle instance
│   │   └── schema.ts       # Definisi schema tabel Drizzle
│   └── index.ts            # Entry point server Elysia & endpoint routes
├── drizzle/                # File migrasi yang di-generate (drizzle-kit)
├── .env.example            # Template variabel environment
├── .env                    # Variabel environment lokal
├── drizzle.config.ts       # Konfigurasi drizzle-kit
├── package.json            # Daftar dependensi dan script npm
├── tsconfig.json           # Konfigurasi TypeScript untuk Bun
└── README.md
```

## 🛠️ Cara Menjalankan

1. **Install dependensi**:
   ```bash
   bun install
   ```

2. **Setup Environment**:
   Sesuaikan konfigurasi koneksi database MySQL pada file `.env`.

3. **Migrasi Database**:
   ```bash
   # Generate migration files
   bun run db:generate

   # Push schema langsung ke MySQL
   bun run db:push
   ```

4. **Jalankan Server**:
   ```bash
   # Development (watch mode)
   bun run dev

   # Production mode
   bun run start
   ```

## 🔌 Endpoints
- `GET /` : Endpoint welcome & status server
- `GET /health` : Endpoint health check
- `GET /api/users` : Mendapatkan daftar user dari database
- `POST /api/users` : Menambahkan user baru (body: `{ "name": "...", "email": "..." }`)
