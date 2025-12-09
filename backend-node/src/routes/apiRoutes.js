const Joi = require("joi");
const authController = require("../controllers/authController");
const machineController = require("../controllers/machineController");
const statsController = require("../controllers/statsController");
const axios = require("axios");

const routes = [
  // --- AUTH ROUTES ---
  {
    method: "POST",
    path: "/auth/register",
    options: { auth: false },
    handler: authController.register,
  },
  {
    method: "POST",
    path: "/auth/login",
    options: { auth: false },
    handler: authController.login,
  },

  // --- MACHINE ROUTES ---
  {
    method: "POST",
    path: "/machines",
    handler: machineController.createMachine,
    options: {
      validate: {
        payload: Joi.object({
          name: Joi.string().required(),
          type: Joi.string().optional(),
          location: Joi.string().optional(),
        }),
      },
    },
  },
  {
    method: "POST",
    path: "/machines/{id}/predict",
    handler: machineController.predictMachine,
    options: {
      validate: { payload: Joi.object().unknown() },
    },
  },
  {
    method: "GET",
    path: "/machines/{id}/history",
    handler: machineController.getHistory,
  },

  {
    method: "PATCH",
    path: "/maintenance/{id}/done",
    handler: machineController.resolveMaintenance,
  },
  // ------------------------------------------------

  // --- FITUR PROFILE ---
  {
    method: "GET",
    path: "/auth/me",
    handler: authController.getProfile,
  },
  {
    method: "PUT",
    path: "/auth/profile",
    handler: authController.updateProfile,
    options: {
      validate: {
        payload: Joi.object({
          email: Joi.string().email().optional(),
          full_name: Joi.string().optional(),
          preferences: Joi.object().optional(), // JSON Settings
        }),
      },
    },
  },

  // --- FITUR VISUAL DASHBOARD ---
  {
    method: "GET",
    path: "/dashboard/stats",
    handler: statsController.getDashboardStats,
  },

  // --- CHATBOT PROXY ---
  {
    method: "POST",
    path: "/chatbot/query",
    handler: async (req, h) => {
      const userId = req.auth.credentials.id;
      const { message } = req.payload;
      try {
        const response = await axios.post(
          `${process.env.CHATBOT_SERVICE_URL}/chatbot/query`,
          { user_id: userId, message: message },
          {
            headers: {
              "Content-Type": "application/json",
              "Accept-Encoding": "identity",
            },
          }
        );
        return h.response(response.data).code(200);
      } catch (err) {
        console.error("Chatbot Proxy Error:", err.message);
        return h.response({ error: "Chatbot unavailable" }).code(503);
      }
    },
  },
];

module.exports = routes;