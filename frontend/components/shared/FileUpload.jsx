"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL, getToken } from "@/lib/api";

/** Client-side size limits (MB) per folder — mirrors the backend FOLDERS map. */
const MAX_MB = {
  "student-photos": 2, "teacher-photos": 2, "staff-photos": 2, "school-logo": 1,
  documents: 10, assignments: 20, announcements: 10, canteen: 2, "id-cards": 5, "report-cards": 5,
};

/**
 * Upload a single file to Cloudinary via POST /api/upload?folder=...
 * Props:
 *   folder       backend folder key (required)
 *   value        current URL (string) to preview
 *   onChange     (url, { public_id, format, size }) => void  — null url means removed
 *   accept       input accept attr (default image/*)
 *   label        helper text
 *   variant      "avatar" (square preview) | "logo" (wide) | "file"
 */
export default function FileUpload({
  folder, value, onChange, accept = "image/*", label, variant = "avatar",
}) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(-1); // -1 idle, 0..100 uploading
  const uploading = progress >= 0;

  function pick() {
    if (!uploading) inputRef.current?.click();
  }

  function validate(file) {
    const limit = MAX_MB[folder] || 5;
    if (file.size > limit * 1024 * 1024) {
      toast.error(`File too large. Max ${limit}MB for ${folder}.`);
      return false;
    }
    if (accept === "image/*" && !file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return false;
    }
    return true;
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file || !validate(file)) return;

    const form = new FormData();
    form.append("file", file);

    // XHR so we get a real upload progress bar.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/upload?folder=${encodeURIComponent(folder)}`);
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    setProgress(0);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => {
      setProgress(-1);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          onChange?.(data.url, data);
          toast.success("Uploaded");
        } else {
          toast.error(data.error || "Upload failed");
        }
      } catch {
        toast.error("Upload failed");
      }
    };
    xhr.onerror = () => { setProgress(-1); toast.error("Upload failed"); };
    xhr.send(form);
  }

  const isImage = accept.startsWith("image");
  const box =
    variant === "logo" ? "h-24 w-40" : variant === "file" ? "h-20 w-20" : "h-28 w-28";

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="flex items-center gap-4">
        <div className={`relative ${box} rounded-md border bg-muted/40 flex items-center justify-center overflow-hidden`}>
          {value && isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="preview" className="h-full w-full object-contain" />
          ) : value ? (
            <a href={value} target="_blank" rel="noreferrer" className="text-xs text-primary underline px-1 text-center break-all">View file</a>
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-1">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs">{progress}%</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" size="sm" onClick={pick} disabled={uploading}>
            <Upload className="h-4 w-4" /> {value ? "Replace" : "Upload"}
          </Button>
          {value && !uploading && (
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange?.(null, null)}>
              <X className="h-4 w-4" /> Remove
            </Button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
    </div>
  );
}
