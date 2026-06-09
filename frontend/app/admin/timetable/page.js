"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

/** "09:00:00" -> "9:00 AM"; tolerates "09:00" and null. */
function fmtTime(t) {
  if (!t) return "";
  const [h, m] = String(t).split(":");
  const hour = Number(h);
  if (Number.isNaN(hour)) return "";
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m ?? "00"} ${ampm}`;
}
function timeRange(p) {
  const s = fmtTime(p?.start_time), e = fmtTime(p?.end_time);
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

export default function TimetablePage() {
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState("");
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    api.get("/sections-detailed").then((d) => setSections(Array.isArray(d) ? d : d.data || [])).catch(() => {});
    api.get("/subjects-detailed").then((d) => setSubjects(Array.isArray(d) ? d : d.data || [])).catch(() => {});
    api.get("/teachers").then((d) => setTeachers(Array.isArray(d) ? d : d.data || [])).catch(() => {});
  }, []);

  async function loadTimetable(id) {
    if (!id) return;
    setLoading(true);
    try {
      const d = await api.get(`/timetable?section_id=${id}`);
      setPeriods(Array.isArray(d) ? d : d.data || []);
    } catch (e) {
      toast.error(e.message);
    }
    setLoading(false);
  }

  function onSectionChange(v) {
    setSectionId(v);
    loadTimetable(v);
  }

  function cellFor(periodNumber, day) {
    return periods.find((p) => Number(p.period_number) === periodNumber && p.day_of_week === day);
  }

  async function addPeriod(e) {
    e.preventDefault();
    try {
      await api.post("/timetable", { ...form, section_id: sectionId });
      toast.success("Period added");
      setOpen(false);
      setForm({});
      loadTimetable(sectionId);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function deletePeriod(id) {
    try {
      await api.del(`/timetable/${id}`);
      toast.success("Period deleted");
      loadTimetable(sectionId);
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <AppShell title="Timetable" allow={["super_admin", "admin"]}>
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={sectionId} onValueChange={onSectionChange}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.class_name} {s.section_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {sectionId && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4" /> Add Period</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Period</DialogTitle></DialogHeader>
                  <form onSubmit={addPeriod} className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select value={form.subject_id ? String(form.subject_id) : ""} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {subjects.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.name}{s.class_name ? ` (${s.class_name})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Teacher</Label>
                      <Select value={form.teacher_id ? String(form.teacher_id) : ""} onValueChange={(v) => setForm({ ...form, teacher_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {teachers.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Day</Label>
                      <Select value={form.day_of_week || ""} onValueChange={(v) => setForm({ ...form, day_of_week: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Period Number</Label>
                      <Input type="number" value={form.period_number || ""} onChange={(e) => setForm({ ...form, period_number: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input type="time" value={form.start_time || ""} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input type="time" value={form.end_time || ""} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                    </div>
                    <DialogFooter className="col-span-2">
                      <Button type="submit">Add</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {sectionId && (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border p-2 text-left w-20">Period</th>
                    {DAYS.map((d) => <th key={d} className="border p-2 text-left">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((pn) => {
                    // A period number usually maps to a fixed time — show the first one found in the row.
                    const rowTime = timeRange(periods.find((p) => Number(p.period_number) === pn && (p.start_time || p.end_time)));
                    return (
                    <tr key={pn}>
                      <td className="border p-2 font-medium align-top">
                        <div>{pn}</div>
                        {rowTime && <div className="text-[11px] font-normal text-muted-foreground whitespace-nowrap">{rowTime}</div>}
                      </td>
                      {DAYS.map((day) => {
                        const cell = cellFor(pn, day);
                        return (
                          <td key={day} className="border p-2 align-top">
                            {cell ? (
                              <div className="group flex items-start justify-between gap-1">
                                <div>
                                  <div className="font-medium">{cell.subject_name || "—"}</div>
                                  <div className="text-xs text-muted-foreground">{cell.teacher_name || ""}</div>
                                  {timeRange(cell) && <div className="text-[11px] text-primary/80">{timeRange(cell)}</div>}
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                                  onClick={() => deletePeriod(cell.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              {loading && <p className="p-3 text-sm text-muted-foreground">Loading...</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
