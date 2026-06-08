"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

const ROLES = ["accountant", "librarian", "hr_manager", "hostel_warden", "transport_manager", "security_guard", "canteen_manager", "health_officer"];
const EMPTY = { name: "", email: "", phone: "", role: "hr_manager", department: "", designation: "", employee_id: "", basic_salary: "", joining_date: "" };

export default function HrStaffPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/hr/staff");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create(e) {
    e.preventDefault();
    try {
      await api.post("/hr/staff", form);
      toast.success("Staff added");
      setOpen(false); setForm(EMPTY); load();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    { key: "department", header: "Department" },
    { key: "designation", header: "Designation" },
    { key: "employee_id", header: "Emp ID" },
    { key: "basic_salary", header: "Basic Salary", render: (r) => formatCurrency(r.basic_salary) },
  ];

  return (
    <AppShell title="Staff" allow={["super_admin", "admin", "hr_manager"]}>
      <Card><CardContent className="pt-6">
        <DataTable
          columns={columns} data={rows} loading={loading} emptyTitle="No staff yet"
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Staff</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Staff</DialogTitle></DialogHeader>
                <form onSubmit={create} className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Employee ID</Label>
                    <Input value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Basic Salary</Label>
                    <Input type="number" value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Joining Date</Label>
                    <Input type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
                  </div>
                  <DialogFooter className="col-span-2"><Button type="submit">Create</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        />
      </CardContent></Card>
    </AppShell>
  );
}
