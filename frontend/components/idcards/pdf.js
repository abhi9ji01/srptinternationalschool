/** Render a DOM node to a single-card PDF and download it. */
export async function nodeToPdf(node, filename = "id-card.pdf") {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(node, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
  const img = canvas.toDataURL("image/png");
  const pxToMm = (px) => (px * 25.4) / 96;
  const w = pxToMm(canvas.width / 3);
  const h = pxToMm(canvas.height / 3);
  const pdf = new jsPDF({ orientation: w > h ? "landscape" : "portrait", unit: "mm", format: [w, h] });
  pdf.addImage(img, "PNG", 0, 0, w, h);
  pdf.save(filename);
}

/** Render multiple nodes (one per page) into a single PDF. */
export async function nodesToPdf(nodes, filename = "id-cards.pdf") {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  let pdf = null;
  const pxToMm = (px) => (px * 25.4) / 96;
  for (const node of nodes) {
    if (!node) continue;
    const canvas = await html2canvas(node, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/png");
    const w = pxToMm(canvas.width / 3);
    const h = pxToMm(canvas.height / 3);
    if (!pdf) pdf = new jsPDF({ orientation: w > h ? "landscape" : "portrait", unit: "mm", format: [w, h] });
    else pdf.addPage([w, h], w > h ? "landscape" : "portrait");
    pdf.addImage(img, "PNG", 0, 0, w, h);
  }
  if (pdf) pdf.save(filename);
}
