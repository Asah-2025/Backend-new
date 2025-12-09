# Gunakan Python versi ringan
FROM python:3.10-slim

# Install library sistem untuk PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev gcc

# Buat folder kerja
WORKDIR /app

# Copy requirements.txt
COPY requirements.txt .

# Install dependency Python
RUN pip install --no-cache-dir -r requirements.txt

# Copy seluruh sisa kode
COPY . .

# Buka port 8000
EXPOSE 8000

# Perintah menjalankan server
CMD ["python", "main.py"]