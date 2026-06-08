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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

const EMPTY = { hostel_id: "", room_number: "", capacity: "1", type: "single", monthly_fee: "", floor: "" };

export default function HostelRoomsPage() {
  const [rows, setRows] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("/hostel/rooms");
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    api.get("/hostel/hostels").then((d) => setHostels(Array.isArray(d) ? d : d.data || [])).catch(() => {});
  }, [load]);

  async function create(e) {
    e.preventDefault();
    if (!form.hostel_id) return toast.error("Select a hostel");
    try {
      await api.post("/hostel/rooms", {
        hostel_id: form.hostel_id,
        room_number: form.room_number,
        capacity: form.capacity,
        type: form.type,
        monthly_fee: form.monthly_fee,
        floor: form.floor,
      });
      toast.success("Room added");
      setOpen(false); setForm(EMPTY); load();
    } catch (e) { toast.error(e.message); }
  }

  const columns = [
    { key: "room_number", header: "Room" },
    { key: "hostel_name", header: "Hostel" },
    { key: "type", header: "Type" },
    { key: "capacity", header: "Capacity" },
    { key: "occupied", header: "Occupied" },
    { key: "monthly_fee", header: "Monthly Fee", render: (r) => formatCurrency(r.monthly_fee) },
    {
      key: "is_available", header: "Status",
      render: (r) => <Badge className={Number(r.is_available) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{Number(r.is_available) ? "Available" : "Full"}</Badge>,
    },
  ];

  return (
    <AppShell title="Hostel Rooms" allow={["super_admin", "admin", "hostel_warden"]}>
      <Card><CardContent className="pt-6">
        <DataTable
          columns={columns} data={rows} loading={loading} emptyTitle="No rooms yet"
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Room</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Room</DialogTitle></DialogHeader>
                <form onSubmit={create} className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 col-span-2">
                    <Label>Hostel</Label>
                    <Select value={form.hostel_id ? String(form.hostel_id) : ""} onValueChange={(v) => setForm({ ...form, hostel_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select hostel" /></SelectTrigger>
                      <SelectContent>
                        {hostels.map((h) => <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Room Number</Label>
                    <Input value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="double">Double</SelectItem>
                        <SelectItem value="triple">Triple</SelectItem>
                        <SelectItem value="dormitory">Dormitory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly Fee</Label>
                    <Input type="number" value={form.monthly_fee} onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Floor</Label>
                    <Input value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
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
