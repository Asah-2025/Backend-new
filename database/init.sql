-- 1. Aktifkan Ekstensi UUID (WAJIB)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100),
    avatar_url TEXT,
    preferences JSONB DEFAULT '{"theme": "light"}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Machines
CREATE TABLE IF NOT EXISTS machines (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Predictions (Update: Tambah status maintenance)
CREATE TABLE IF NOT EXISTS predictions (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id VARCHAR REFERENCES machines(id) ON DELETE CASCADE,
    input_sensor_data JSONB,
    ml_failure_prob FLOAT,
    ml_predicted_hours FLOAT,
    copilot_analysis JSONB,
    copilot_severity VARCHAR(20),
    
    -- KOLOM BARU: Untuk melacak status perbaikan
    -- 'Open' = Masih rusak/butuh perhatian
    -- 'Resolved' = Sudah diperbaiki (Done)
    maintenance_status VARCHAR(20) DEFAULT 'Open',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Chat History
CREATE TABLE IF NOT EXISTS chat_history (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR,
    role VARCHAR(20),
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

