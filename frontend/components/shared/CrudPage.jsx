"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import AppShell from "@/components/shared/AppShell";
import DataTable from "@/components/shared/DataTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

/**
 * Generic resource page: list + create + edit + delete, driven by config.
 *
 * Props:
 *  title, allow                 page title + roles allowed
 *  endpoint                     base path used by the defaults below
 *  listEndpoint                 GET list (defaults to `endpoint`)
 *  createEndpoint               POST create (defaults to `endpoint`)
 *  updateEndpoint(row)          PUT path (defaults to `${endpoint}/${row.id}`)
 *  deleteEndpoint(row)          DELETE path (defaults to `${endpoint}/${row.id}`)
 *  columns                      DataTable columns
 *  fields                       form fields: {name,label,type,required,options,optionsEndpoint,optionsValue,optionsLabel}
 *  canCreate, canEdit, canDelete  (booleans)
 *  defaultForm                  initial form values for create
 *  editFields                   override fields used for edit (defaults to `fields`)
 *  toolbar                      extra JSX in the toolbar
 *  rowActions(row, reload)      extra per-row JSX
 */
export default function CrudPage({
  title, allow, endpoint, listEndpoint, createEndpoint, updateEndpoint, deleteEndpoint,
  columns, fields = [], editFields, canCreate = true, canEdit = false, canDelete = true,
  defaultForm = {}, toolbar, rowActions,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [delRow, setDelRow] = useState(null);
  const [optionData, setOptionData] = useState({});

  const list = listEndpoint || endpoint;
  const efields = editFields || fields;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get(list);
      setRows(Array.isArray(d) ? d : d.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [list]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    // preload select option sources (union of create + edit fields)
    [...fields, ...(editFields || [])].filter((f) => f.optionsEndpoint).forEach((f) => {
      api.get(f.optionsEndpoint).then((d) => {
        const arr = Array.isArray(d) ? d : d.data || [];
        setOptionData((o) => ({ ...o, [f.name]: arr }));
      }).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create(e) {
    e.preventDefault();
    try {
      await api.post(createEndpoint || endpoint, form);
      toast.success("Created");
      setOpen(false); setForm(defaultForm); load();
    } catch (e) { toast.error(e.message); }
  }

  function openEdit(row) {
    // prefill edit form from the row using each field's name
    const f = {};
    efields.forEach((fld) => { if (row[fld.name] !== undefined && row[fld.name] !== null) f[fld.name] = row[fld.name]; });
    setEditForm(f);
    setEditRow(row);
  }

  async function update(e) {
    e.preventDefault();
    try {
      const path = updateEndpoint ? updateEndpoint(editRow) : `${endpoint}/${editRow.id}`;
      await api.put(path, editForm);
      toast.success("Updated");
      setEditRow(null); load();
    } catch (e) { toast.error(e.message); }
  }

  async function remove() {
    const path = deleteEndpoint ? deleteEndpoint(delRow) : `${endpoint}/${delRow.id}`;
    await api.del(path);
    toast.success("Deleted"); load();
  }

  const cols = [...columns];
  if (canEdit || canDelete || rowActions) {
    cols.push({
      key: "_actions", header: "", className: "text-right", render: (r) => (
        <div className="flex gap-1 justify-end">
          {rowActions && rowActions(r, load)}
          {canEdit && fields.length > 0 && (
            <Button size="icon" variant="ghost" onClick={() => openEdit(r)} title="Edit"><Pencil className="h-4 w-4" /></Button>
          )}
          {canDelete && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDelRow(r)}>Delete</Button>}
        </div>
      ),
    });
  }

  return (
    <AppShell title={title} allow={allow}>
      <Card><CardContent className="pt-6">
        <DataTable
          columns={cols} data={rows} loading={loading} emptyTitle={`No ${title.toLowerCase()} yet`}
          actions={
            <>
              {toolbar}
              {canCreate && fields.length > 0 && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add {title}</DialogTitle></DialogHeader>
                    <form onSubmit={create} className="grid grid-cols-2 gap-3">
                      {fields.map((f) => (
                        <FormField key={f.name} field={f} value={form[f.name]} options={f.options || optionData[f.name]}
                          onChange={(v) => setForm({ ...form, [f.name]: v })} />
                      ))}
                      <DialogFooter className="col-span-2"><Button type="submit">Create</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </>
          }
        />
      </CardContent></Card>

      {/* Edit dialog */}
      <Dialog open={!!editRow} onOpenChange={(v) => !v && setEditRow(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {title}</DialogTitle></DialogHeader>
          <form onSubmit={update} className="grid grid-cols-2 gap-3">
            {efields.map((f) => (
              <FormField key={f.name} field={f} value={editForm[f.name]} options={f.options || optionData[f.name]}
                onChange={(v) => setEditForm({ ...editForm, [f.name]: v })} />
            ))}
            <DialogFooter className="col-span-2"><Button type="submit">Save changes</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!delRow} onOpenChange={(v) => !v && setDelRow(null)} onConfirm={remove}
        title="Delete this record?" description="This action cannot be undone." />
    </AppShell>
  );
}

function FormField({ field, value, onChange, options }) {
  const { label, type = "text", required, full, optionsValue = "id", optionsLabel } = field;
  const span = full || type === "textarea" ? "col-span-2" : "";
  return (
    <div className={`space-y-2 ${span}`}>
      <Label>{label}</Label>
      {type === "textarea" ? (
        <Textarea value={value || ""} onChange={(e) => onChange(e.target.value)} required={required} />
      ) : type === "select" ? (
        <Select value={value !== undefined && value !== null && value !== "" ? String(value) : ""} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            {(options || []).map((o, i) => {
              const val = typeof o === "object" ? o[optionsValue] : o;
              const lab = typeof o === "object" ? (optionsLabel ? optionsLabel(o) : o.name || o.label) : o;
              return <SelectItem key={i} value={String(val)}>{lab}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      ) : (
        <Input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={required} />
      )}
    </div>
  );
}
