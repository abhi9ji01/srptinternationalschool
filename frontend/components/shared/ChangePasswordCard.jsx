"use client";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Wand2, Eye, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

/** Strong 8-char password with at least one of each class. */
export function generatePassword() {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "@#$%&*!?"];
  const all = sets.join("");
  let out = sets.map((s) => s[Math.floor(Math.random() * s.length)]);
  while (out.length < 8) out.push(all[Math.floor(Math.random() * all.length)]);
  return out.sort(() => Math.random() - 0.5).join("");
}

/**
 * Reusable change-password block.
 * Props: userId (required), userName, card (wrap in a Card, default true).
 */
export default function ChangePasswordCard({ userId, userName, card = true }) {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [revealed, setRevealed] = useState("");
  const [copied, setCopied] = useState(false);

  async function save(e) {
    e.preventDefault();
    if (pwd.length < 6) return toast.error("Password must be at least 6 characters");
    if (pwd !== confirm) return toast.error("Passwords do not match");
    setSaving(true);
    try {
      await api.put(`/admin/users/${userId}/password`, { new_password: pwd });
      toast.success("Password Updated");
      setSaved(true); setPwd(""); setConfirm("");
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  }

  async function view() {
    try {
      const d = await api.get(`/admin/users/${userId}/password-temp`);
      setRevealed(d.password);
      setCopied(false);
      setViewOpen(true);
      setSaved(false); // it's one-time; the button disappears after the dialog
    } catch (e) { toast.error(e.message); }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(revealed);
      setCopied(true);
      toast.success("Copied to clipboard");
    } catch { toast.error("Copy failed — select and copy manually"); }
  }

  const body = (
    <div className="space-y-4">
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="text" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Enter new password" autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <Input type="text" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => { const p = generatePassword(); setPwd(p); setConfirm(p); }}>
            <Wand2 className="h-4 w-4" /> Generate Random
          </Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Password"}</Button>
          {saved && (
            <Button type="button" variant="secondary" onClick={view}>
              <Eye className="h-4 w-4" /> View &amp; Copy Password
            </Button>
          )}
        </div>
      </form>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password for {userName || "this user"}</DialogTitle>
            <DialogDescription>
              This password will only be shown once. Share it with the staff member now.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input readOnly value={revealed} className="font-mono text-base" />
            <Button type="button" variant="outline" onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setViewOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (!card) return body;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4 w-4" /> Change Password</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
