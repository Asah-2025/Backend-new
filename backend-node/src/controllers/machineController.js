const pool = require("../config/db");
const {
  getMLPrediction,
  getCopilotAnalysis,
} = require("../services/predictionService");

const createMachine = async (req, h) => {
  const { name, type, location } = req.payload;
  const userId = req.auth.credentials.id;
  try {
    const res = await pool.query(
      "INSERT INTO machines (user_id, name, type, location) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, name, type, location]
    );
    return h.response(res.rows[0]).code(201);
  } catch (err) {
    console.error(err);
    return h.response({ error: "Database Error" }).code(500);
  }
};

const predictMachine = async (req, h) => {
  const { id } = req.params;
  const sensorData = req.payload;

  try {
    // Cek apakah mesin ada
    const machineCheck = await pool.query(
      "SELECT id FROM machines WHERE id = $1",
      [id]
    );
    if (machineCheck.rowCount === 0)
      return h.response({ error: "Machine not found" }).code(404);

    // 1. ML Pipeline
    const mlResult = await getMLPrediction(sensorData);
    // 2. Copilot Pipeline
    const copilot = await getCopilotAnalysis(id, sensorData, mlResult);

    // 3. Save to DB
    const saved = await pool.query(
      `INSERT INTO predictions 
            (machine_id, input_sensor_data, ml_failure_prob, ml_predicted_hours, copilot_severity, copilot_analysis)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        id,
        sensorData,
        mlResult.failure_probability,
        mlResult.predicted_time_to_failure_hours,
        copilot.severity,
        copilot,
      ]
    );

    return h
      .response({
        status: "success",
        data: {
          prediction: saved.rows[0],
          ui_card: copilot, // Data siap pakai untuk Frontend
        },
      })
      .code(200);
  } catch (err) {
    console.error(err);
    return h.response({ error: "Prediction pipeline failed" }).code(500);
  }
};

const getHistory = async (req, h) => {
  const { id } = req.params;
  const res = await pool.query(
    "SELECT * FROM predictions WHERE machine_id = $1 ORDER BY created_at DESC",
    [id]
  );
  return h.response(res.rows).code(200);
};

// FITUR BARU: Tandai maintenance selesai (Done button)
const resolveMaintenance = async (req, h) => {
  const { id } = req.params; // Ini ID prediksi, bukan ID mesin

  try {
    const res = await pool.query(
      "UPDATE predictions SET maintenance_status = 'Resolved' WHERE id = $1 RETURNING *",
      [id]
    );

    if (res.rows.length === 0) {
      return h.response({ error: "Prediction record not found" }).code(404);
    }

    return h
      .response({
        message: "Maintenance marked as DONE",
        data: res.rows[0],
      })
      .code(200);
  } catch (err) {
    console.error(err);
    return h.response({ error: "Failed to update status" }).code(500);
  }
};

module.exports = {
  createMachine,
  predictMachine,
  getHistory,
  resolveMaintenance,
};
