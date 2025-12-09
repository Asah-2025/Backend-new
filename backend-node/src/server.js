"use strict";
const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt");
const dotenv = require("dotenv");
const routes = require("./routes/apiRoutes"); // <-- Import routes yang baru dibuat

dotenv.config();

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: process.env.HOST || "localhost",
    routes: {
      cors: { origin: ["*"] },
      validate: {
        failAction: async (request, h, err) => {
          throw err;
        },
      },
    },
  });

  // Registrasi Plugin JWT
  await server.register(Jwt);

  // Setup Strategi Auth
  server.auth.strategy("jwt_strategy", "jwt", {
    keys: process.env.JWT_SECRET,
    verify: { aud: false, iss: false, sub: false, nbf: true },
    validate: (artifacts, request, h) => {
      return {
        isValid: true,
        credentials: { id: artifacts.decoded.payload.id },
      };
    },
  });

  server.auth.default("jwt_strategy");

  // === LOAD ROUTES DARI FOLDER ROUTES ===
  server.route(routes);
  // ======================================

  await server.start();
  console.log("✅ Backend Node.js (Clean Arch) running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
