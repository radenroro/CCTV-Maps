# SITS Project

## Pemasangan Dependensi

1. Pastikan Anda memiliki **Node.js** dan **npm** (Node Package Manager) terinstal di perangkat Anda.
2. Jalankan perintah berikut untuk menginstal semua dependensi yang diperlukan:
   ```bash
   npm install
   ```

## Cara Pemakaian Dependencies

- **Express.js**: Digunakan untuk membangun server backend.
- **PostgreSQL + PostGIS**: Digunakan sebagai database utama dengan dukungan geospasial.
- **Sequelize**: ORM untuk mengelola database.
- **dotenv**: Untuk mengelola variabel lingkungan.
- **Jest**: Untuk pengujian unit.

## Teknologi yang Digunakan

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL dengan ekstensi PostGIS
- **ORM**: Sequelize
- **Testing**: Jest
- **Environment Management**: dotenv

## Pemindahan PostgreSQL + PostGIS

1. **Instal PostgreSQL**:
   - Unduh PostgreSQL dari [situs resmi](https://www.postgresql.org/download/).
   - Ikuti panduan instalasi sesuai sistem operasi Anda.
2. **Tambahkan Ekstensi PostGIS**:
   - Setelah PostgreSQL terinstal, buka terminal PostgreSQL (`psql`) dan jalankan:
     ```sql
     CREATE EXTENSION postgis;
     ```
3. **Konfigurasi Database**:
   - Buat database baru:
     ```sql
     CREATE DATABASE sitscctv_location;
     ```
   - Tambahkan ekstensi PostGIS ke database:
     ```sql
     \c sitscctv_location
     CREATE EXTENSION postgis;
     ```
4. **Bagikan Konfigurasi**:
   - Pastikan file `.env` berisi informasi koneksi database:
     ```
     DB_HOST=localhost
     DB_PORT=25129
     DB_NAME=sitscctv_location
     DB_USER=postgres
     DB_PASSWORD=1234567
     ```

## Cara Menjalankan Project

1. Pastikan semua dependensi telah terinstal.
2. Jalankan migrasi database:
   ```bash
   npx sequelize-cli db:migrate
   ```
3. Jalankan server:
   ```bash
   node server
   ```
4. Jalankan client:
   ```bash
   npm start
   ```
5. Akses server melalui `http://localhost:5000/api/cctv`.
6. Akses client melalui `http://localhost:3000`

## Tambahan

- **Pengujian**:
  Jalankan perintah berikut untuk menjalankan pengujian:
  ```bash
  npm test
  ```
- **Linting**:
  Gunakan ESLint untuk memastikan kualitas kode:
  ```bash
  npm run lint
  ```
