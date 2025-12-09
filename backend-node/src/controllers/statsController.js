const pool = require("../config/db");

const getDashboardStats = async (req, h) => {
  const userId = req.auth.credentials.id;

  try {
    // 1. Hitung Total Mesin
    const machineCount = await pool.query(
      "SELECT COUNT(*) FROM machines WHERE user_id = $1",
      [userId]
    );

    // 2. Hitung Total Prediksi Bahaya (High/Critical)
    // Kita join tabel predictions dengan machines untuk filter by user_id
    const riskCount = await pool.query(
      `
            SELECT COUNT(*) FROM predictions p
            JOIN machines m ON p.machine_id = m.id
            WHERE m.user_id = $1 AND p.copilot_severity IN ('High', 'Critical')
        `,
      [userId]
    );

    const totalMachines = parseInt(machineCount.rows[0].count);
    const totalRisks = parseInt(riskCount.rows[0].count);

    // 3. Hitung Health Score (Mulai dari 100, kurang 20 poin tiap ada mesin rusak)
    let healthScore = 100;
    if (totalMachines > 0) {
      // Rumus: Jika semua mesin rusak, score 0. Jika setengah rusak, score 50.
      const penalty = (totalRisks / totalMachines) * 100;
      healthScore = Math.max(0, 100 - penalty);
    } else {
      healthScore = 0; // Belum ada mesin
    }

    return h
      .response({
        total_machines: totalMachines,
        active_alerts: totalRisks,
        factory_health_score: Math.round(healthScore),
        status:
          healthScore > 80
            ? "Excellent"
            : healthScore > 50
            ? "Good"
            : "Critical",
      })
      .code(200);
  } catch (err) {
    console.error(err);
    return h.response({ error: "Stats error" }).code(500);
  }
};

module.exports = { getDashboardStats };
