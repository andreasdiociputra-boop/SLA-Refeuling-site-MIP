# Aplikasi Refueling & SLA Monitoring

Aplikasi ini terdiri dari 2 bagian dalam 1 project:
1. **Input Fuelman** (`/fuelman`) — dibuka lewat browser HP di lapangan.
2. **Dashboard Admin** (`/dashboard`) — Pencapaian SLA, Work Order Digital, Monitoring Unit Belum Terisi.

Anda **tidak perlu bisa ngoding** untuk menjalankan ini. Ikuti langkah berikut persis seperti resep masakan.

---
## BAGIAN 1 — Membuat Database (Supabase)

1. Buka https://supabase.com → Sign up (gratis) → **New Project**.
2. Beri nama project (bebas), buat password database (simpan baik-baik), pilih region terdekat (Singapore).
3. Setelah project jadi (tunggu ±2 menit), buka menu **SQL Editor** di sebelah kiri.
4. Klik **New query**, lalu buka file `supabase/schema.sql` di project ini, **copy semua isinya**, paste ke SQL Editor, klik **Run**.
   → Ini akan membuat semua tabel yang dibutuhkan (units, work order, dll).
5. Buka menu **Project Settings > API**. Catat 2 hal ini:
   - `Project URL`
   - `anon public key`

## BAGIAN 2 — Membuat User Admin & Fuelman

1. Di Supabase, buka menu **Authentication > Users > Add user**. Buat 1 user untuk admin (email + password) dan beberapa untuk fuelman.
2. Buka menu **Table Editor > profiles**, klik **Insert row**, isi:
   - `id` → copy dari User ID yang baru dibuat di langkah 1
   - `full_name` → nama orangnya
   - `role` → ketik `admin` untuk admin, atau `fuelman` untuk fuelman

## BAGIAN 3 — Menjalankan Aplikasi (Deploy ke Vercel, gratis)

1. Upload folder project ini ke akun **GitHub** Anda (buat repository baru, upload semua file). Jika belum punya akun, daftar gratis di https://github.com.
2. Buka https://vercel.com → Sign up pakai akun GitHub Anda → **Add New Project** → pilih repository yang tadi diupload.
3. Sebelum klik Deploy, buka bagian **Environment Variables**, tambahkan 2 baris:
   - `NEXT_PUBLIC_SUPABASE_URL` = (Project URL dari Bagian 1)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (anon public key dari Bagian 1)
4. Klik **Deploy**. Tunggu 1-2 menit → Anda akan mendapat link seperti `https://nama-app.vercel.app`.
5. Link inilah yang dibagikan ke fuelman (buka `/fuelman` atau langsung root) dan admin (`/dashboard`).

## BAGIAN 4 — Menambahkan Fuel Truck

Buka **Table Editor > fuel_trucks** di Supabase, tambahkan baris manual, contoh:
`code: FT-01, name: Fuel Truck 01, is_active: true`

## BAGIAN 5 — Membuat Work Order

1. Login sebagai admin → menu **Work Order Digital**.
2. Siapkan file Excel dengan 2 kolom, contoh:

| No Unit | Area  |
|---------|-------|
| HD-101  | Pit A |
| HD-102  | Pit A |
| EX-201  | Pit B |

3. Upload file → sistem otomatis mengelompokkan menjadi Work Order per area → klik "Buat Work Order Sekarang".

---
## Mode Demo (Coba Dulu Tanpa Setup Database)

Jika `NEXT_PUBLIC_SUPABASE_URL` belum diisi, aplikasi otomatis berjalan dengan **data contoh** supaya Anda bisa melihat alurnya dulu. Untuk mencoba di komputer:

```
npm install
npm run dev
```

Lalu buka `http://localhost:3000` di browser.

---
## Menjalankan status refueling

Pilihan status yang tersedia untuk fuelman saat klik unit:
- **Refueling** — sedang diisi
- **Fuel Aman** — selesai diisi, aman
- **Unit BD** — unit breakdown, tidak bisa diisi
- **Jalan Tidak Ready** — akses jalan belum siap
- **Unit Tidak Reposisi** — unit belum diposisikan untuk diisi

## Perlu bantuan lanjutan?

Jika Anda butuh bantuan setup GitHub/Vercel/Supabase secara langsung (klik demi klik), atau ingin fitur tambahan (misalnya notifikasi WhatsApp saat unit lewat SLA, laporan Excel otomatis, dsb), sampaikan saja — bisa dilanjutkan bertahap.
