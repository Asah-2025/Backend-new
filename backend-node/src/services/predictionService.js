const axios = require("axios");
const Groq = require("groq-sdk"); // Import Groq
require("dotenv").config();

// Inisialisasi Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 1. Panggil ML Endpoint (Kode yang sudah FIX tadi)
const getMLPrediction = async (sensorData) => {
  try {
    const response = await axios.post(
      "https://reihann321-predictive-maintenance-api.hf.space/predict",
      sensorData
    );

    // Mapping Data ML
    const mlData = response.data.prediction;
    if (!mlData) throw new Error("Format response ML tidak sesuai");

    return {
      failure_probability: mlData.anomaly_confidence,
      predicted_time_to_failure_hours: mlData.estimated_time_to_failure,
      status_label: mlData.status_label,
    };
  } catch (error) {
    console.error("ML Service Error:", error.message);
    // Fallback jika ML mati
    return { failure_probability: 0.5, predicted_time_to_failure_hours: 100 };
  }
};

// 2. Panggil LLM (GROQ - Llama 3)
const getCopilotAnalysis = async (machineId, sensorData, mlResult) => {
  // Tentukan Severity dasar
  let severity = "Low";
  const prob = mlResult.failure_probability;
  if (prob > 0.8) severity = "Critical";
  else if (prob >= 0.6) severity = "High";
  else if (prob >= 0.3) severity = "Medium";

  // Data Default (Jaga-jaga jika Groq error)
  const fallbackResponse = {
    title: `Maintenance Alert: ${severity}`,
    summary: "Analisa otomatis tidak tersedia (Mode Offline).",
    severity: severity,
    recommended_actions: ["Cek manual mesin", "Periksa koneksi sensor"],
    likely_causes: ["Tidak diketahui"],
    spare_parts: ["-"],
    eta_to_failure_hours: mlResult.predicted_time_to_failure_hours,
    confidence_score: prob,
  };

  // Cek API Key
  if (!process.env.GROQ_API_KEY) {
    console.log("⚠️ No Groq Key found. Using Fallback.");
    return fallbackResponse;
  }

  const prompt = `
    Context: Industrial Machine Maintenance.
    Machine ID: ${machineId}
    Sensor Data: ${JSON.stringify(sensorData)}
    ML Prediction: ${JSON.stringify(mlResult)}
    Calculated Severity: ${severity}
    
    Task: Act as a Senior Maintenance Engineer. Analyze the sensor data and prediction.
    Provide specific technical advice.
    
    Output JSON Format ONLY:
    {
      "title": "Short descriptive title (e.g., 'Overheating Detected')",
      "summary": "2 sentences summary of the issue",
      "severity": "${severity}",
      "recommended_actions": ["Specific action 1", "Specific action 2"],
      "likely_causes": ["Technical cause 1", "Technical cause 2"],
      "spare_parts": ["Part name 1", "Part name 2"],
      "eta_to_failure_hours": ${mlResult.predicted_time_to_failure_hours || 0},
      "confidence_score": ${prob}
    }
    `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a JSON factory. You only output valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile", // Model Cepat & Gratis
      temperature: 0.5,
      response_format: { type: "json_object" }, // Memaksa output JSON murni
    });

    const aiContent = completion.choices[0]?.message?.content;
    return JSON.parse(aiContent);
  } catch (error) {
    console.error("🔥 GROQ AI Error:", error.message);
    return fallbackResponse;
  }
};

module.exports = { getMLPrediction, getCopilotAnalysis };
