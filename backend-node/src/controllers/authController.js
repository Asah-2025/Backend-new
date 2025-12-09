const bcrypt = require("bcrypt");
const pool = require("../config/db");
const Jwt = require("@hapi/jwt");

const register = async (req, h) => {
  const { username, password } = req.payload;
  const hash = await bcrypt.hash(password, 10);

  // --- FITUR VISUAL: Avatar Otomatis ---
  // Membuat avatar robot lucu unik berdasarkan username
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

  try {
    const res = await pool.query(
      "INSERT INTO users (username, password_hash, avatar_url) VALUES ($1, $2, $3) RETURNING id, username, avatar_url",
      [username, hash, avatarUrl]
    );
    return h.response(res.rows[0]).code(201);
  } catch (e) {
    console.error(e);
    return h.response({ error: "Username already exists" }).code(400);
  }
};

const login = async (req, h) => {
  const { username, password } = req.payload;
  const res = await pool.query("SELECT * FROM users WHERE username = $1", [
    username,
  ]);

  if (res.rows.length === 0)
    return h.response({ error: "Invalid credentials" }).code(401);

  const user = res.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) return h.response({ error: "Invalid credentials" }).code(401);

  const token = Jwt.token.generate(
    { id: user.id, username: user.username },
    { key: process.env.JWT_SECRET, algorithm: "HS256" },
    { ttlSec: 14400 } 
  );

  return h
    .response({ token, user: { id: user.id, username: user.username } })
    .code(200);
};

// FITUR BARU: Ambil Data Profile User yang sedang login
const getProfile = async (req, h) => {
  const userId = req.auth.credentials.id;
  try {
    const res = await pool.query(
      "SELECT id, username, email, full_name, avatar_url, preferences FROM users WHERE id = $1",
      [userId]
    );
    if (res.rows.length === 0)
      return h.response({ error: "User not found" }).code(404);
    return h.response(res.rows[0]).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ error: "Database error" }).code(500);
  }
};

// FITUR BARU: Update Profile & Settings
const updateProfile = async (req, h) => {
  const userId = req.auth.credentials.id;
  const { email, full_name, preferences } = req.payload;

  try {
    const res = await pool.query(
      `UPDATE users SET 
                email = COALESCE($1, email), 
                full_name = COALESCE($2, full_name),
                preferences = COALESCE($3, preferences)
            WHERE id = $4 RETURNING id, username, email, full_name, preferences`,
      [email, full_name, preferences, userId]
    );
    return h
      .response({ message: "Profile updated", user: res.rows[0] })
      .code(200);
  } catch (err) {
    console.error(err);
    return h.response({ error: "Update failed" }).code(500);
  }
};

// Jangan lupa komanya!
module.exports = { register, login, getProfile, updateProfile };
