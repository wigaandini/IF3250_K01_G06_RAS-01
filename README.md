# IF3250 K01 G06 RAS-01

Proyek aplikasi web berbasis Next.js dengan fitur autentikasi, manajemen database, dan visualisasi data.

## 📋 Daftar Isi

- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Pengujian](#pengujian)
- [Struktur Proyek](#struktur-proyek)
- [Fitur Utama](#fitur-utama)
- [Script yang Tersedia](#script-yang-tersedia)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Kontribusi](#kontribusi)

## 🔧 Persyaratan Sistem

Pastikan sistem Anda telah menginstal:

- **Node.js** versi 18 atau lebih baru
- **npm** atau **yarn** sebagai package manager
- **PostgreSQL** (jika menggunakan database lokal)
- **Git** untuk version control

## 🚀 Instalasi

1. **Clone repository**
   ```bash
   git clone <url-repository>
   cd if3250_k01_g06_ras-01
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   atau
   ```bash
   yarn install
   ```

## ⚙️ Konfigurasi

1. **Buat file environment**
   
   Salin file `.env.example` menjadi `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. **Atur variabel environment**
   
   Edit file `.env.local` dan sesuaikan dengan konfigurasi Anda:
   ```env
   # Database
   DATABASE_URL="your_database_connection_string"
   
   # Supabase (jika digunakan)
   NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
   
   # JWT Secret
   JWT_SECRET="your_jwt_secret_key"
   
   # Next.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your_nextauth_secret"
   ```

3. **Setup Database**
   
   Jalankan migrasi Prisma:
   ```bash
   npx prisma migrate dev
   ```
   
   Seed database (opsional):
   ```bash
   npx prisma db seed
   ```

## 🏃‍♂️ Menjalankan Aplikasi

### Mode Development
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:3000`

### Mode Production
1. Build aplikasi:
   ```bash
   npm run build
   ```

2. Jalankan aplikasi:
   ```bash
   npm run start
   ```

## 🧪 Pengujian

### Menjalankan Test
```bash
# Jalankan semua test sekali
npm run test

# Jalankan test dalam mode watch
npm run test:watch
```

### Linting
```bash
npm run lint
```

## 📁 Struktur Proyek

```
if3250_k01_g06_ras-01/
├── components/          # Komponen React yang dapat digunakan ulang
├── pages/              # Halaman Next.js dan API routes
├── prisma/             # Schema database dan migrations
├── public/             # File statis (gambar, icon, dll)
├── styles/             # File CSS dan styling
├── lib/                # Utility functions dan konfigurasi
├── types/              # TypeScript type definitions
├── __tests__/          # File pengujian
├── .env.local          # Environment variables (local)
├── .env.example        # Template environment variables
├── next.config.js      # Konfigurasi Next.js
├── tailwind.config.js  # Konfigurasi Tailwind CSS
├── prisma.schema       # Schema database Prisma
└── package.json        # Dependencies dan scripts
```

## ✨ Fitur Utama

### 🔐 Autentikasi
- Login/Register dengan JWT
- Password hashing menggunakan bcrypt
- Session management

### 🗄️ Database
- Integrasi dengan Prisma ORM
- Support PostgreSQL melalui Supabase
- Database seeding

### 🎨 UI Components
- Radix UI components untuk accessibility
- Tailwind CSS untuk styling
- Dark/Light theme support
- Toast notifications

### 📊 Data Management
- Import/Export Excel files
- CSV parsing dan processing
- Data visualization

### 🗺️ Maps
- Integrasi Leaflet untuk peta interaktif
- React Leaflet components

### 📱 Responsive Design
- Mobile-first approach
- Responsive di semua ukuran layar

## 📜 Script yang Tersedia

| Script | Deskripsi |
|--------|-----------|
| `npm run dev` | Menjalankan aplikasi dalam mode development |
| `npm run build` | Build aplikasi untuk production |
| `npm run start` | Menjalankan aplikasi production |
| `npm run test` | Menjalankan test suite |
| `npm run test:watch` | Menjalankan test dalam mode watch |
| `npm run lint` | Menjalankan ESLint untuk code quality |

## 🛠️ Teknologi yang Digunakan

### Frontend
- **Next.js 15** - React framework dengan SSR/SSG
- **React 18** - Library untuk membangun UI
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Modern database toolkit
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing

### Database
- **PostgreSQL** - Relational database
- **Supabase** - Backend-as-a-Service

### Testing
- **Vitest** - Fast unit test framework
- **Jest** - JavaScript testing framework

### Tools & Utilities
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Swagger** - API documentation

## 🤝 Kontribusi

1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📞 Kontak

Untuk pertanyaan lebih lanjut, silakan hubungi tim pengembang atau buat issue di repository ini.

---