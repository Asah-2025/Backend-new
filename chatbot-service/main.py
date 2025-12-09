from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from groq import Groq
import os

# Import dari file lain (Refactoring)
from database import engine, SessionLocal, Base
from models import ChatHistory 

# --- KONFIGURASI AI ---
# Masukkan API Key Groq Anda
GROQ_API_KEY = os.getenv("GROQ_API_KEY") # <--- JANGAN LUPA ISI INI LAGI
client = Groq(api_key=GROQ_API_KEY)

# Buat tabel jika belum ada (otomatis)
Base.metadata.create_all(bind=engine)

app = FastAPI()

class ChatRequest(BaseModel):
    user_id: str
    message: str

def get_machine_context(db):
    try:
        # Query SQL: Ambil nama mesin, severity, status, dan tanggal
        # Kita urutkan dari yang paling baru
        sql = text("""
            SELECT m.name, p.copilot_severity, p.ml_failure_prob, p.maintenance_status, p.created_at
            FROM predictions p
            JOIN machines m ON p.machine_id = m.id
            ORDER BY p.created_at DESC
            LIMIT 10;
        """)
        results = db.execute(sql).fetchall()
        
        if not results:
            return "Data Pabrik: Belum ada data mesin atau prediksi sama sekali."
        
        # Susun "Contekan" (Context) untuk AI
        context_str = "Laporan Data Mesin Terkini (Real-time DB):\n"
        
        for row in results:
            # row[0]=Name, row[1]=Severity, row[2]=Prob, row[3]=Status, row[4]=Date
            machine_name = row[0]
            severity = row[1]
            status_db = row[3] # 'Open' atau 'Resolved'
            date = row[4]

            if status_db == 'Resolved':
                state_desc = "✅ SUDAH DIPERBAIKI (Maintenance Selesai/Done)"
            else:
                state_desc = "⚠️ SEDANG RUSAK (Butuh Perbaikan Segera)"

            context_str += f"- Mesin: {machine_name} | Kondisi: {severity} | Status: {state_desc} | Tgl: {date}\n"
            
        return context_str

    except Exception as e:
        print(f"🔥 Error mengambil context DB: {e}")
        return "Gagal mengambil data mesin."

@app.post("/chatbot/query")
def query_chatbot(req: ChatRequest):
    db = SessionLocal()
    try:
        machine_data = get_machine_context(db)
        
        system_prompt = f"""
        Kamu adalah 'Maintenance Copilot'. Jawab pertanyaan user berdasarkan data ini:
        {machine_data}
        Jika status 'High/Critical', beri peringatan.
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
        )

        ai_response = chat_completion.choices[0].message.content

        # Simpan ke DB
        uid = req.user_id if req.user_id else "anonymous"
        db.add(ChatHistory(user_id=uid, role="user", content=req.message))
        db.add(ChatHistory(user_id=uid, role="assistant", content=ai_response))
        db.commit()

        return {"response": ai_response}

    except Exception as e:
        print(f"🔥 ERROR: {e}")
        return {"response": "Maaf, server AI sedang sibuk."}
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)