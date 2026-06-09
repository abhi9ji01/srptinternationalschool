"use client";
import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { Printer, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import IdCard from "./IdCard";
import { nodeToPdf } from "./pdf";
import { api } from "@/lib/api";

/** Modal that fetches a card and lets the admin pick style, print, or export PDF. */
export default function IdCardModal({ open, onOpenChange, type, id, name }) {
  const [card, setCard] = useState(null);
  const [style, setStyle] = useState("style1");
  const [loading, setLoading] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!open || !id) return;
    setLoading(true);
    api.get(`/id-cards/${type}/${id}`)
      .then(setCard)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [open, type, id]);

  const handlePrint = useReactToPrint({ content: () => cardRef.current, documentTitle: `${name || "id-card"}` });

  async function download() {
    if (!cardRef.current) return;
    try { await nodeToPdf(cardRef.current, `${(name || "id-card").replace(/\s+/g, "_")}.pdf`); }
    catch { toast.error("PDF export failed"); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>ID Card — {name}</DialogTitle></DialogHeader>
        <div className="flex items-center gap-2">
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="style1">Style 1 — Vertical</SelectItem>
              <SelectItem value="style2">Style 2 — Horizontal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-center rounded-md border bg-muted/30 p-4 overflow-auto">
          {loading ? <p className="text-sm text-muted-foreground py-8">Loading…</p> :
            card ? <IdCard ref={cardRef} card={card} style={style} /> :
            <p className="text-sm text-muted-foreground py-8">No data</p>}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handlePrint} disabled={!card}><Printer className="h-4 w-4" /> Print</Button>
          <Button className="flex-1" onClick={download} disabled={!card}><Download className="h-4 w-4" /> Download PDF</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
