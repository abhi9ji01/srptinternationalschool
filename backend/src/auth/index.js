import fp from "fastify-plugin";
import jwt from "@fastify/jwt";

/**
 * Auth plugin: registers @fastify/jwt and decorates the app with:
 *  - app.authenticate         → verifies the Bearer token, sets request.user
 *  - app.authorize(roles)     → returns a preHandler that enforces roles
 */
async function authPlugin(app) {
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "dev-secret-change-me",
    sign: { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
  });
  app.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });

  // authorize(['admin','teacher']) → preHandler
  app.decorate("authorize", (roles = []) => {
    return async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.code(401).send({ error: "Unauthorized" });
      }
      if (roles.length && !roles.includes(request.user.role)) {
        return reply.code(403).send({ error: "Forbidden: insufficient role" });
      }
    };
  });
}

export default fp(authPlugin);
