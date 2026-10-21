"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Circle, Download, Eye, FileText, LoaderCircle, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, PageTitle } from "@/components/ui/primitives";
import { dataApi, jsonBody } from "@/lib/client-api";

type ResumeRecord = { id: string; fileName: string; contentType: string; byteSize: number; fileStatus: "active"; uploadedAt: string };
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const formatBytes = (value: number) => value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / (1024 * 1024)).toFixed(1)} MB`;

export function ResumeManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [preview, setPreview] = useState<ResumeRecord | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const result = await dataApi<{ resumes: ResumeRecord[] }>("resumes");
    setResumes(result.resumes);
  }, []);

  useEffect(() => {
    let active = true;
    void dataApi<{ resumes: ResumeRecord[] }>("resumes").then((result) => { if (active) setResumes(result.resumes); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Resumes could not be loaded."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleFile(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) { toast.error("PDF files only", { description: "Choose a resume saved as a PDF." }); return; }
    if (file.size < 1 || file.size > MAX_PDF_BYTES) { toast.error("PDF must be 10 MB or smaller."); return; }
    setBusy(true); setError("");
    try {
      const pending = await dataApi<{ id: string; uploadUrl: string }>("resumes", { method: "POST", body: jsonBody({ fileName: file.name, contentType: "application/pdf", byteSize: file.size }) });
      const upload = await fetch(pending.uploadUrl, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file, cache: "no-store" });
      if (!upload.ok) throw new Error("The PDF could not be transferred to project storage.");
      const completed = await dataApi<{ resume: ResumeRecord }>(`resumes/${encodeURIComponent(pending.id)}/complete`, { method: "POST" });
      setResumes((current) => [completed.resume, ...current.filter((item) => item.id !== completed.resume.id)]);
      toast.success("Resume securely stored", { description: "The file is in project storage. VeriFit does not extract its text automatically; add evidence excerpts in the Evidence Library." });
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Resume upload failed."); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  function drop(event: DragEvent<HTMLButtonElement>) { event.preventDefault(); setDragging(false); void handleFile(event.dataTransfer.files[0]); }

  async function deleteResume(item: ResumeRecord) {
    if (confirmDelete !== item.id) { setConfirmDelete(item.id); return; }
    try {
      await dataApi(`resumes/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      setResumes((current) => current.filter((row) => row.id !== item.id));
      setConfirmDelete(null); setPreview(null);
      toast.success("Resume record removed", { description: "The database record and its derived evidence are hidden. Stored bytes are not physically deleted by the runtime storage API." });
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Resume could not be removed."); }
  }

  if (loading) return <><PageTitle eyebrow="Private PDF library" title="Resumes" description="Loading your stored resume records…" /><Card className="section-card"><p className="text-muted">Loading resumes…</p></Card></>;

  return <>
    <PageTitle eyebrow="Private PDF library" title="Resumes" description="Upload a real PDF to private project storage. File storage does not automatically extract or interpret resume text." />
    {error ? <Card className="section-card" style={{ marginBottom: 14 }}><p role="alert" className="text-muted">{error}</p><Button size="sm" variant="outline" onClick={() => void refresh().then(() => setError("")).catch((cause) => setError(cause instanceof Error ? cause.message : "Refresh failed."))}>Retry</Button></Card> : null}
    <Card className="section-card">
      <div className="card-heading"><div><h2>Resume files</h2><p>PDF only · Up to 10 MB · Owner-scoped signed upload and download</p></div>{resumes.length ? <span className="status-badge status-met"><Check size={13} /> {resumes.length} stored</span> : <span className="tag">No file</span>}</div>
      <button type="button" className="card" disabled={busy} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop} style={{ width: "100%", marginTop: 18, padding: "27px 20px", display: "grid", justifyItems: "center", textAlign: "center", borderStyle: "dashed", borderColor: dragging ? "var(--accent)" : "var(--border-strong)", background: dragging ? "var(--accent-soft)" : "var(--surface-soft)" }}>
        <span className="eligibility-icon" style={{ width: 40, height: 40, marginBottom: 11, background: "var(--surface)" }}>{busy ? <LoaderCircle size={18} /> : <Upload size={18} />}</span>
        <strong style={{ fontSize: 13 }}>{busy ? "Uploading and verifying PDF…" : "Drop your resume here"}</strong>
        <span className="text-muted" style={{ marginTop: 4, fontSize: 11 }}>or browse files · PDF only</span>
        <span className="helper-text" style={{ marginTop: 8 }}>Stored privately; no OCR or automatic resume extraction is implemented.</span>
      </button>
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" aria-label="Choose resume PDF" hidden onChange={(event) => void handleFile(event.target.files?.[0])} />
      {resumes.length ? <div className="data-card-list" style={{ marginTop: 17 }}>{resumes.map((item) => <div key={item.id} className="application-card card"><div className="job-card-top"><span className="eligibility-icon" style={{ background: "var(--surface-soft)" }}><FileText size={16} /></span><div style={{ minWidth: 0, flex: 1 }}><strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11 }}>{item.fileName}</strong><span className="helper-text">PDF · {formatBytes(item.byteSize)} · Stored {new Date(item.uploadedAt).toLocaleDateString()}</span></div><span className="status-badge status-met"><Check size={12} /> Stored</span></div><div className="job-card-actions" style={{ marginTop: 12 }}><button type="button" className="table-action" onClick={() => setPreview(item)}><Eye size={13} /> View</button><a className="table-action" href={`/api/data/resumes/${encodeURIComponent(item.id)}/download`}><Download size={13} /> Download</a><Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}><Upload size={12} /> Replace</Button><Button size="sm" variant="ghost" onClick={() => void deleteResume(item)}><Trash2 size={12} /> {confirmDelete === item.id ? "Confirm remove" : "Delete"}</Button>{confirmDelete === item.id ? <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button> : null}</div>{confirmDelete === item.id ? <p className="helper-text" style={{ marginTop: 7 }}>Removal soft-deletes the record and hides its linked evidence; the object bytes remain in storage.</p> : null}</div>)}</div> : <div className="data-empty" style={{ marginTop: 15 }}><FileText size={22} /><h2>No resume added yet</h2><p>Choose a PDF to store a private resume record. You can add verifiable excerpts to the Evidence Library separately.</p></div>}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}><span className="detail-label">Storage behavior</span><div style={{ display: "grid", gap: 7, marginTop: 9 }}><span className="helper-text"><Check size={12} style={{ verticalAlign: "middle", color: "var(--green)" }} /> Upload and downloads require your authenticated account.</span><span className="helper-text"><Circle size={12} style={{ verticalAlign: "middle", color: "var(--muted)" }} /> VeriFit does not run OCR, extract text, or claim evidence indexing.</span><span className="helper-text"><Circle size={12} style={{ verticalAlign: "middle", color: "var(--muted)" }} /> Delete hides database records and derived evidence; platform runtime storage does not support physical file deletion.</span></div></div>
    </Card>
    <Dialog.Root open={Boolean(preview)} onOpenChange={(open) => { if (!open) setPreview(null); }}><Dialog.Portal><Dialog.Overlay className="drawer-overlay" /><Dialog.Content className="drawer-content" style={{ display: "flex", flexDirection: "column" }} aria-describedby="resume-preview-description"><div className="drawer-header"><div><p className="eyebrow" style={{ marginBottom: 5 }}>Private resume</p><Dialog.Title style={{ fontSize: 15 }}>{preview?.fileName ?? "Resume preview"}</Dialog.Title><Dialog.Description id="resume-preview-description">Authenticated PDF streamed through the owner-checked server route.</Dialog.Description></div><Dialog.Close asChild><button type="button" className="icon-button" aria-label="Close resume preview"><X size={17} /></button></Dialog.Close></div>{preview ? <iframe title={`PDF preview: ${preview.fileName}`} src={`/api/data/resumes/${encodeURIComponent(preview.id)}/download?preview=1`} style={{ flex: 1, width: "100%", minHeight: 420, border: 0, background: "var(--surface)" }} /> : null}<div style={{ padding: 14, borderTop: "1px solid var(--border)" }}>{preview ? <a className="button button-outline button-sm" href={`/api/data/resumes/${encodeURIComponent(preview.id)}/download`}><Download size={13} /> Download</a> : null}</div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </>;
}
