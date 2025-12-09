# Gunakan Node.js versi ringan
FROM node:18-alpine

# Buat folder kerja di dalam container
WORKDIR /app

# Copy file package.json dulu
COPY package*.json ./

# Install dependency
RUN npm install

# Copy seluruh sisa kode
COPY . .

# Buka port 3000
EXPOSE 3000

# Perintah menjalankan server
CMD ["npm", "start"]