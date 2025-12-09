# 🏭 Predictive Maintenance Copilot (Backend)

Backend API untuk sistem pemantauan mesin industri berbasis AI. Sistem ini menggunakan arsitektur Hybrid Microservices (Node.js + Python) yang dibungkus dengan Docker.

## 🚀 Teknologi

* **Core Backend:** Node.js (Hapi.js)
* **AI & Logic Service:** Python (FastAPI)
* **AI Model:** Groq (Llama 3) for Analysis & Chatbot
* **Database:** PostgreSQL
* **Infrastructure:** Docker & Docker Compose

---

## 🛠️ Cara Menjalankan (Quick Start)

Pastikan kamu sudah menginstall **Docker Desktop** dan statusnya "Engine Running".

1.  **Siapkan Environment Variable**
    Pastikan file `.env` sudah ada di root folder (atau minta ke pemilik repo) dengan isi API Key Groq.

2.  **Jalankan Server**
    Buka terminal di folder proyek ini, lalu ketik:
    ```bash
    docker compose up --build
    ```

3.  **Tunggu Loading**
    Tunggu sampai muncul log:
    * 🟢 `database system is ready to accept connections`
    * 🟢 `Uvicorn running on http://0.0.0.0:8000`
    * 🟢 `Backend Node.js (Clean Arch) running on http://0.0.0.0:3000`

    **Base URL API:** `http://localhost:3000`

---

## 🔑 Dokumentasi API (Endpoints)

**PENTING:** Semua request selain Auth membutuhkan Header:
`Authorization: Bearer <TOKEN_DARI_LOGIN>`

### 1. Authentication (User)
| Method | Endpoint | Body (JSON) | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | `{"username": "...", "password": "..."}` | **Wajib dijalankan pertama kali!** (Database baru kosong) |
| `POST` | `/auth/login` | `{"username": "...", "password": "..."}` | Mendapatkan Token JWT |
| `GET` | `/auth/me` | - | Mengambil data profile & avatar robot |
| `PUT` | `/auth/profile` | `{"full_name": "...", "email": "..."}` | Update profile user |

### 2. Mesin (Machines)
| Method | Endpoint | Body (JSON) | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/machines` | `{"name": "...", "type": "...", "location": "..."}` | Mendaftarkan mesin baru |
| `GET` | `/machines/{id}/history` | - | Melihat riwayat kerusakan & perbaikan mesin |

### 3. Prediksi & Maintenance (Core Features)
| Method | Endpoint | Body (JSON) | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/machines/{id}/predict` | `{"Air_temperature_K": 300, ...}` | **Cek Kesehatan Mesin.** Mengembalikan hasil analisis AI & `id` Prediksi. |
| `PATCH` | `/maintenance/{id}/done` | - | **Tombol "Mark as Done".** Mengubah status kerusakan dari `Open` menjadi `Resolved`. *(Gunakan ID Prediksi, bukan ID Mesin)* |

### 4. Dashboard & Chatbot
| Method | Endpoint | Body (JSON) | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/stats` | - | Data statistik untuk Grafik/Gauge Chart |
| `POST` | `/chatbot/query` | `{"message": "Mesin mana yang rusak?"}` | Tanya jawab dengan AI (Tahu history mesin) |

---

## 📝 Alur Penggunaan (User Flow)

Agar fitur berjalan lancar di Frontend, ikuti urutan ini:

1.  **Register & Login:** Buat akun, dapatkan Token.
2.  **Input Data Mesin:** Buat mesin baru, simpan `machine_id`.
3.  **Simulasi Kerusakan:**
    * Panggil API `/predict`.
    * Jika parameter sensor tinggi (misal `Tool_wear_min > 200`), mesin akan terdeteksi rusak (Critical).
    * Simpan `id` (ID Prediksi) dari respon JSON.
4.  **Perbaikan (Done):**
    * Klik tombol "Selesai Perbaikan" di Frontend.
    * Panggil API `/maintenance/{id_prediksi}/done`.
    * Status di history akan berubah jadi "Resolved".
5.  **Cek Chatbot:**
    * Tanya: "Bagaimana kondisi mesin saya?"
    * AI akan menjawab berdasarkan data history terakhir.

---

## ⚠️ Troubleshooting

**Q: Database error / Kolom tidak ditemukan?**
A: Struktur tabel mungkin berubah. Reset database dengan perintah:
```bash
docker compose down -v
docker compose up --build