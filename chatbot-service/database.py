import os  # <--- INI YANG KURANG TADI!
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Ambil Config dari Docker ENV
DB_HOST = os.getenv("DB_HOST", "postgres_db") 
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "mrg09876")
DB_NAME = os.getenv("DB_NAME", "maintenance_db")

print(f"🔄 DEBUG PYTHON: Mencoba connect ke {DB_USER}@{DB_HOST}...")

DB_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:5432/{DB_NAME}"

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def wait_for_db():
    retries = 5
    while retries > 0:
        try:
            with engine.connect() as connection:
                print("✅ DEBUG PYTHON: Koneksi Database SUKSES!")
                return
        except Exception as e:
            print(f"⏳ Database belum siap, mencoba lagi dalam 5 detik... ({retries} sisa)")
            print(f"   Error: {e}")
            time.sleep(5)
            retries -= 1
    print("❌ Gagal connect ke Database setelah 5 kali percobaan.")

wait_for_db()