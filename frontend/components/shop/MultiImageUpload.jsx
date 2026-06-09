"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, X, Loader2, Star, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL, getToken } from "@/lib/api";

/**
 * Multi-image uploader for shop products (max 5, Cloudinary folder shop-products).
 * value:    array of { url, public_id }
 * onChange: (nextArray) => void   — first image is the thumbnail.
 */
export default function MultiImageUpload({ value = [], onChange, max = 5 }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(0);

  function pick() {
    if (value.length >= max) return toast.error(`Maximum ${max} images`);
    inputRef.current?.click();
  }

  function uploadOne(file) {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) { toast.error("Images only"); return resolve(null); }
      if (file.size > 2 * 1024 * 1024) { toast.error(`${file.name} exceeds 2MB`); return resolve(null); }
      const form = new FormData();
      form.append("file", file);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/upload?folder=shop-products`);
      const token = getToken();
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.onload = () => {
        try {
          const d = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve({ url: d.url, public_id: d.public_id });
          else { toast.error(d.error || "Upload failed"); resolve(null); }
        } catch { toast.error("Upload failed"); resolve(null); }
      };
      xhr.onerror = () => { toast.error("Upload failed"); resolve(null); };
      xhr.send(form);
    });
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const room = max - value.length;
    const slice = files.slice(0, room);
    if (files.length > room) toast.error(`Only ${room} more image(s) allowed`);
    setUploading((u) => u + slice.length);
    const results = [];
    for (const f of slice) { const r = await uploadOne(f); if (r) results.push(r); setUploading((u) => u - 1); }
    if (results.length) onChange([...value, ...results]);
  }

  function remove(i) { onChange(value.filter((_, idx) => idx !== i)); }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {value.map((img, i) => (
          <div key={img.public_id || img.url} className="relative h-24 w-24 overflow-hidden rounded-md border bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-primary px-1 text-[9px] font-medium text-primary-foreground">
                <Star className="h-2.5 w-2.5" /> Thumb
              </span>
            )}
            <button type="button" onClick={() => remove(i)} className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black">
              <X className="h-3 w-3" />
            </button>
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/40 px-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-white disabled:opacity-30"><ArrowLeft className="h-3 w-3" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="text-white disabled:opacity-30"><ArrowRight className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
        {uploading > 0 && (
          <div className="flex h-24 w-24 items-center justify-center rounded-md border bg-muted/30">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {value.length < max && (
          <button type="button" onClick={pick} className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground hover:bg-accent">
            <Upload className="h-5 w-5" />
            <span className="text-[10px]">Add image</span>
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">First image is the thumbnail. Up to {max} images, 2MB each. Use arrows to reorder.</p>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
    </div>
  );
}
