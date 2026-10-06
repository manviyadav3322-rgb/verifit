"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, CheckCheck, Circle, Download, Eye, FileText, LoaderCircle, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui/primitives";

const stages = ["Uploaded", "Extracting", "Evidence indexed", "Ready for assessment"];

export function ResumeManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("Manvi-Yadav-SDE-Intern.pdf");
  const [stage, setStage] = useState("Ready for assessment");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

  function handleFile(file?: File) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) { toast.error("PDF files only", { description: "Choose a resume saved as a PDF." }); return; }
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setConfirmDelete(false);
    setBusy(true);
    setStage("Uploaded");
    toast.success("Resume uploaded", { description: "The local demo is showing mock extraction progress." });
    window.setTimeout(() => setStage("Extracting"), 650);
    window.setTimeout(() => setStage("Evidence indexed"), 1450);
    window.setTimeout(() => { setStage("Ready for assessment"); setBusy(false); toast.success("Evidence indexed", { description: "Your resume is ready for the demo assessment." }); }, 2350);
  }

  function drop(event: DragEvent<HTMLButtonElement>) { event.preventDefault(); setDragging(false); handleFile(event.dataTransfer.files[0]); }
  function deleteResume() { setFileName(""); setStage(""); setPdfUrl(""); setConfirmDelete(false); toast.success("Resume removed from this demo view"); }
  const activeIndex = stages.indexOf(stage);

  return <>
    <Card className="section-card">
      <div className="card-heading"><div><h2>Resume file</h2><p>PDF only · Local demo state, no file is sent to a server</p></div>{fileName ? <span className="status-badge status-met"><Check size={13} /> Ready</span> : <span className="tag">No file</span>}</div>
      <button type="button" className="card" onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop} style={{ width: "100%", marginTop: 18, padding: "27px 20px", display: "grid", justifyItems: "center", textAlign: "center", borderStyle: "dashed", borderColor: dragging ? "var(--accent)" : "var(--border-strong)", background: dragging ? "var(--accent-soft)" : "var(--surface-soft)" }}>
        <span className="eligibility-icon" style={{ width: 40, height: 40, marginBottom: 11, background: "var(--surface)" }}><Upload size={18} /></span>
        <strong style={{ fontSize: 13 }}>Drop your resume here</strong>
        <span className="text-muted" style={{ marginTop: 4, fontSize: 11 }}>or browse files · PDF only</span>
        <span className="helper-text" style={{ marginTop: 8 }}>Files stay in this browser session; no backend upload is configured.</span>
      </button>
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" aria-label="Choose resume PDF" hidden onChange={(event) => handleFile(event.target.files?.[0])} />

      {fileName ? <div style={{ marginTop: 19, display: "flex", alignItems: "center", gap: 12, padding: 13, border: "1px solid var(--border)", borderRadius: 9 }}>
        <span className="eligibility-icon" style={{ background: "var(--surface-soft)" }}><FileText size={16} /></span>
        <div style={{ flex: 1, minWidth: 0 }}><strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11 }}>{fileName}</strong><span className="helper-text">PDF · {busy ? "Indexing demo evidence…" : "Uploaded · Evidence indexed"}</span></div>
        {busy ? <LoaderCircle size={15} className="text-muted" /> : <button type="button" className="table-action" onClick={() => setPreviewOpen(true)}><Eye size={13} style={{ verticalAlign: "middle" }} /> View</button>}
      </div> : <div style={{ padding: 16, marginTop: 18, border: "1px dashed var(--border-strong)", borderRadius: 8, color: "var(--muted)", textAlign: "center", fontSize: 11 }}>No resume added yet. Choose a PDF to begin the mock workflow.</div>}

      {fileName ? <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}><Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}><Upload size={12} /> Replace</Button><Button size="sm" variant="ghost" onClick={() => setConfirmDelete((value) => !value)}><Trash2 size={12} /> Delete</Button></div> : null}
      {confirmDelete ? <div role="group" aria-label="Confirm resume deletion" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12, padding: 11, borderRadius: 8, background: "var(--red-soft)", color: "var(--foreground)", fontSize: 11 }}><span>Remove this resume from the demo?</span><span style={{ display: "flex", gap: 6 }}><Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button><Button size="sm" variant="outline" onClick={deleteResume}><Trash2 size={12} /> Remove</Button></span></div> : null}

      <div style={{ marginTop: 23, paddingTop: 18, borderTop: "1px solid var(--border)" }}><span className="detail-label">Processing status</span><div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8, marginTop: 12 }}>
        {stages.map((item, index) => { const done = activeIndex >= index; const current = busy && item === stage; return <div key={item} style={{ display: "grid", gap: 7, alignContent: "start" }}><span style={{ display: "flex", alignItems: "center", gap: 5, color: done ? "var(--green)" : "var(--muted)" }}>{current ? <LoaderCircle size={13} /> : done ? <CheckCheck size={13} /> : <Circle size={13} />}<span className="helper-text" style={{ color: done ? "var(--green)" : "var(--muted)" }}>{done ? "Complete" : "Next"}</span></span><span style={{ fontSize: 10, color: done ? "var(--foreground)" : "var(--muted)" }}>{item}</span></div>; })}
      </div></div>
    </Card>

    <Dialog.Root open={previewOpen} onOpenChange={setPreviewOpen}>
      <Dialog.Portal><Dialog.Overlay className="drawer-overlay" /><Dialog.Content className="drawer-content" style={{ display: "flex", flexDirection: "column" }} aria-describedby="resume-preview-description">
        <div className="drawer-header"><div><p className="eyebrow" style={{ marginBottom: 5 }}>Resume preview</p><Dialog.Title style={{ fontSize: 15 }}>{fileName || "Resume"}</Dialog.Title><Dialog.Description id="resume-preview-description">{pdfUrl ? "Your selected local PDF." : "A sample resume record in the demo."}</Dialog.Description></div><Dialog.Close asChild><button type="button" className="icon-button" aria-label="Close resume preview"><X size={17} /></button></Dialog.Close></div>
        <div style={{ flex: 1, padding: 16, display: "grid", placeItems: "center", minHeight: 300 }}>{pdfUrl ? <iframe title="Selected resume PDF preview" src={pdfUrl} style={{ width: "100%", height: "100%", minHeight: 560, border: "1px solid var(--border)", borderRadius: 8 }} /> : <div style={{ textAlign: "center", maxWidth: 300 }}><FileText size={30} style={{ color: "var(--accent)", margin: "0 auto 12px" }} /><strong style={{ display: "block", fontSize: 13 }}>Sample resume record</strong><p className="text-muted" style={{ fontSize: 11, lineHeight: 1.6 }}>This starter record demonstrates the upload and evidence-indexing states. Choose a PDF above to preview your own file locally.</p></div>}</div>
        <div style={{ padding: 16, borderTop: "1px solid var(--border)" }}>{pdfUrl ? <a className="button button-outline button-sm" href={pdfUrl} target="_blank" rel="noreferrer"><Download size={13} /> Open PDF in new tab</a> : <Button variant="secondary" onClick={() => { setPreviewOpen(false); inputRef.current?.click(); }}><Upload size={13} /> Choose a PDF</Button>}</div>
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </>;
}
