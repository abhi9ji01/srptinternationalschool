"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";

const SCHOOL_FIELDS = [
  { name: "name", label: "Name" },
  { name: "address", label: "Address" },
  { name: "phone", label: "Phone" },
  { name: "email", label: "Email", type: "email" },
  { name: "website", label: "Website" },
  { name: "principal_name", label: "Principal Name" },
  { name: "affiliation_board", label: "Affiliation Board" },
  { name: "established_year", label: "Established Year", type: "number" },
];

export default function SettingsPage() {
  const [form, setForm] = useState({});
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await api.get("/settings");
        setForm(d.school || {});
        setGrades(d.grades || []);
      } catch (e) {
        toast.error(e.message);
      }
      setLoading(false);
    })();
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      SCHOOL_FIELDS.forEach((f) => { payload[f.name] = form[f.name] ?? ""; });
      await api.put("/settings", payload);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e.message);
    }
    setSaving(false);
  }

  return (
    <AppShell title="Settings" allow={["super_admin", "admin"]}>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">School Information</h2>
            <form onSubmit={save} className="grid grid-cols-2 gap-4">
              {SCHOOL_FIELDS.map((f) => (
                <div key={f.name} className="space-y-2">
                  <Label>{f.label}</Label>
                  <Input
                    type={f.type || "text"}
                    value={form[f.name] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    disabled={loading}
                  />
                </div>
              ))}
              <div className="col-span-2">
                <Button type="submit" disabled={saving || loading}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Grade Configuration</h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead>Min %</TableHead>
                    <TableHead>Max %</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No grades configured
                      </TableCell>
                    </TableRow>
                  ) : (
                    grades.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell>{g.grade_name}</TableCell>
                        <TableCell>{g.min_percentage}</TableCell>
                        <TableCell>{g.max_percentage}</TableCell>
                        <TableCell>{g.remark || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
