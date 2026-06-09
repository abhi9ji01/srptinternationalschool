import cloudinary, { cloudinaryEnabled } from "./cloudinary.js";

/**
 * Per-folder upload policy. `resource_type` maps to Cloudinary:
 *   image → optimised images, raw → pdf/binary, auto → anything.
 */
export const FOLDERS = {
  "student-photos": { resource_type: "image", maxMB: 2, mimes: ["image/"] },
  "teacher-photos": { resource_type: "image", maxMB: 2, mimes: ["image/"] },
  "staff-photos": { resource_type: "image", maxMB: 2, mimes: ["image/"] },
  "school-logo": { resource_type: "image", maxMB: 1, mimes: ["image/"] },
  documents: { resource_type: "raw", maxMB: 10, mimes: ["application/pdf"] },
  assignments: { resource_type: "auto", maxMB: 20, mimes: ["application/pdf", "image/"] },
  announcements: { resource_type: "auto", maxMB: 10, mimes: [] }, // any
  canteen: { resource_type: "image", maxMB: 2, mimes: ["image/"] },
  "shop-products": { resource_type: "image", maxMB: 2, mimes: ["image/"] },
  "id-cards": { resource_type: "image", maxMB: 5, mimes: ["image/"] },
  "report-cards": { resource_type: "raw", maxMB: 5, mimes: ["application/pdf"] },
};

export function folderConfig(folder) {
  return FOLDERS[folder] || null;
}

/** Validate a mimetype against a folder's allow-list ([] = anything). */
export function mimeAllowed(folder, mimetype = "") {
  const cfg = folderConfig(folder);
  if (!cfg) return false;
  if (!cfg.mimes.length) return true;
  return cfg.mimes.some((m) => mimetype.startsWith(m));
}

/**
 * Upload a Buffer to Cloudinary inside the given folder.
 * Returns { url, public_id, format, size, resource_type }.
 */
export function uploadBuffer(buffer, folder, { filename } = {}) {
  const cfg = folderConfig(folder) || { resource_type: "auto" };
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `school/${folder}`,
        resource_type: cfg.resource_type,
        use_filename: Boolean(filename),
        filename_override: filename,
        unique_filename: true,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format || null,
          size: result.bytes || null,
          resource_type: result.resource_type,
        });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Delete an asset from Cloudinary. No-op when Cloudinary is disabled or the
 * id is empty. Never throws — file cleanup must not break a delete flow.
 * Pass resource_type when known (defaults to "image").
 */
export async function deleteFromCloudinary(publicId, resourceType = "image") {
  if (!publicId || !cloudinaryEnabled()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (e) {
    console.error("[cloudinary] delete failed:", e.message);
  }
}
