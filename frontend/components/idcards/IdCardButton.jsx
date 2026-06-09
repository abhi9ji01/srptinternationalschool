"use client";
import { useState } from "react";
import { IdCard as IdCardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import IdCardModal from "./IdCardModal";

/** Drop-in "Generate ID Card" button for student/teacher profile pages. */
export default function IdCardButton({ type, id, name, variant = "outline" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <IdCardIcon className="h-4 w-4" /> Generate ID Card
      </Button>
      <IdCardModal open={open} onOpenChange={setOpen} type={type} id={id} name={name} />
    </>
  );
}
