"use client";
import { useParams } from "next/navigation";
import TemplateEditor from "@/components/email/TemplateEditor";

export default function EditEmailTemplatePage() {
  const { id } = useParams();
  return <TemplateEditor templateId={id} />;
}
