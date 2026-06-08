"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

const EMPTY = { name: "", phone: "", purpose: "", whom_to_meet: "", id_proof_type: "", vehicle_number: "" };

export default function VisitorCheckinPage() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [last, setLast] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!form.name) return toast.error("Name is required");
    setSubmitting(true);
    try {
      const res = await api.post("/visitors", form);
      toast.success(`Pass: ${res.pass_number}`);
      setLast({ id: res.id, pass_number: res.pass_number });
      setForm(EMPTY);
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AppShell title="Visitor Check-in" allow={["super_admin", "admin", "security_guard"]}>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="text-base">Register Visitor</CardTitle></CardHeader>
        <CardContent>
          {last && (
            <div className="mb-4 rounded-md border bg-muted/40 p-3 text-sm flex items-center justify-between">
              <span>Issued pass <span className="font-semibold">{last.pass_number}</span></span>
              <Link href={`/visitor/pass/${last.id}`} className="text-primary underline">Print Pass</Link>
            </div>
          )}
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={set("name")} required />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={set("phone")} />
            </div>
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Input value={form.purpose} onChange={set("purpose")} />
            </div>
            <div className="space-y-2">
              <Label>Whom to Meet</Label>
              <Input value={form.whom_to_meet} onChange={set("whom_to_meet")} />
            </div>
            <div className="space-y-2">
              <Label>ID Proof Type</Label>
              <Input value={form.id_proof_type} onChange={set("id_proof_type")} />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Number</Label>
              <Input value={form.vehicle_number} onChange={set("vehicle_number")} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting}>{submitting ? "Checking in..." : "Check In"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
