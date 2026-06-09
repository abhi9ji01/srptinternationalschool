import { FOLDERS, folderConfig, mimeAllowed, uploadBuffer } from "../lib/upload.js";
import { cloudinaryEnabled } from "../lib/cloudinary.js";

/**
 * Generic file upload endpoint backed by Cloudinary.
 *   POST /api/upload?folder=student-photos   (multipart/form-data, field "file")
 *   → { url, public_id, format, size }
 */
export default async function uploadRoutes(app) {
  app.post("/upload", { preHandler: app.authenticate }, async (req, reply) => {
    const folder = req.query.folder;
    const cfg = folderConfig(folder);
    if (!cfg) {
      return reply.code(400).send({ error: `Unknown or missing upload folder. Allowed: ${Object.keys(FOLDERS).join(", ")}` });
    }
    if (!cloudinaryEnabled()) {
      return reply.code(503).send({ error: "File storage is not configured. Set CLOUDINARY_* env variables." });
    }

    let part;
    try {
      part = await req.file({ limits: { fileSize: cfg.maxMB * 1024 * 1024 } });
    } catch {
      return reply.code(400).send({ error: "Invalid upload request" });
    }
    if (!part) return reply.code(400).send({ error: "No file provided (use field name 'file')" });

    if (!mimeAllowed(folder, part.mimetype)) {
      return reply.code(415).send({ error: `File type ${part.mimetype} not allowed for ${folder}` });
    }

    let buffer;
    try {
      buffer = await part.toBuffer();
    } catch {
      return reply.code(413).send({ error: `File exceeds the ${cfg.maxMB}MB limit for ${folder}` });
    }
    if (part.file.truncated || buffer.length > cfg.maxMB * 1024 * 1024) {
      return reply.code(413).send({ error: `File exceeds the ${cfg.maxMB}MB limit for ${folder}` });
    }

    try {
      const result = await uploadBuffer(buffer, folder, { filename: part.filename });
      return reply.code(201).send(result);
    } catch (e) {
      req.log.error(e);
      return reply.code(502).send({ error: "Upload to storage failed" });
    }
  });
}
