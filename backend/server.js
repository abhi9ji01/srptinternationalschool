import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import rateLimit from "@fastify/rate-limit";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import authPlugin from "./src/auth/index.js";
import registerRoutes from "./src/routes/index.js";
import { getPool } from "./src/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = Fastify({
  logger: { transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" } },
  bodyLimit: (Number(process.env.MAX_FILE_SIZE_MB || 5) + 5) * 1024 * 1024,
});

await app.register(cors, {
  origin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(","),
  credentials: true,
});
await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });
await app.register(multipart, {
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE_MB || 5) * 1024 * 1024 },
});
await app.register(fastifyStatic, { root: UPLOAD_DIR, prefix: "/uploads/" });

await app.register(authPlugin);

// Make upload dir available to routes
app.decorate("uploadDir", UPLOAD_DIR);

// Global error handler — never leak SQL internals to clients.
app.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  if (error.validation) return reply.code(400).send({ error: "Validation error", details: error.validation });
  if (String(error.code || "").startsWith("ER_")) {
    return reply.code(500).send({ error: "Database error. Please try again later." });
  }
  const status = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
  reply.code(status).send({ error: status === 500 ? "Internal server error" : error.message });
});

app.get("/health", async () => ({ status: "ok", time: new Date().toISOString() }));

await app.register(registerRoutes, { prefix: "/api" });

const port = Number(process.env.PORT || 5000);

try {
  // Verify DB connectivity early (non-fatal warning if down)
  try {
    await getPool().query("SELECT 1");
    app.log.info("Database connection OK");
  } catch (e) {
    app.log.warn("Database not reachable yet: " + e.message);
  }
  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`API listening on http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
