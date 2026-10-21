import "server-only";

import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import { evidenceMatches, evidenceResumeSources, evidenceSources, resumes } from "@/db/schema";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

function runtimeApi() {
  const apiUrl = process.env.MANUS_API_URL;
  const apiKey = process.env.MANUS_API_KEY;
  if (!apiUrl || !apiKey) throw new Error("The project object-storage service is not configured.");
  return { apiUrl, apiKey };
}

async function presign(path: string, operation: "put" | "get") {
  const { apiUrl, apiKey } = runtimeApi();
  const url = new URL(`/v1/storage/presign/${operation}`, apiUrl);
  url.searchParams.set("path", path);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" });
  const result = await response.json().catch(() => ({})) as { url?: unknown; error?: unknown };
  if (!response.ok || typeof result.url !== "string") throw new Error(typeof result.error === "string" ? result.error : "Storage could not prepare this file transfer.");
  return result.url;
}

export async function listResumes(userId: string) {
  return db.select({ id: resumes.id, fileName: resumes.fileName, contentType: resumes.contentType, byteSize: resumes.byteSize, fileStatus: resumes.fileStatus, uploadedAt: resumes.uploadedAt })
    .from(resumes).where(and(eq(resumes.userId, userId), eq(resumes.fileStatus, "active"))).orderBy(desc(resumes.uploadedAt)).limit(50);
}

export async function beginResumeUpload(userId: string, input: { fileName: string; contentType: string; byteSize: number }) {
  if (input.contentType !== "application/pdf" || !input.fileName.toLowerCase().endsWith(".pdf")) throw new Error("Choose a PDF file.");
  if (!Number.isInteger(input.byteSize) || input.byteSize < 1 || input.byteSize > MAX_PDF_BYTES) throw new Error("PDF files must be 10 MB or smaller.");
  const id = randomUUID();
  const safeName = input.fileName.replace(/[\\/\u0000-\u001f\u007f]/g, "_").slice(-255) || "resume.pdf";
  const objectKey = `verifit/resumes/${userId}/${id}.pdf`;
  const uploadUrl = await presign(objectKey, "put");
  await db.insert(resumes).values({ id, userId, fileName: safeName, contentType: "application/pdf", byteSize: input.byteSize, objectKey, fileStatus: "pending" });
  return { id, uploadUrl };
}

async function verifyStoredPdf(downloadUrl: string, expectedBytes: number) {
  const response = await fetch(downloadUrl, { cache: "no-store" });
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error("The stored resume bytes could not be verified. Retry the PDF upload.");
  }
  const advertisedLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(advertisedLength) && advertisedLength > MAX_PDF_BYTES) {
    await response.body.cancel();
    throw new Error("PDF files must be 10 MB or smaller.");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_PDF_BYTES || totalBytes > expectedBytes) {
        await reader.cancel().catch(() => undefined);
        throw new Error(totalBytes > MAX_PDF_BYTES ? "PDF files must be 10 MB or smaller." : "The stored file size does not match the selected upload.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (totalBytes !== expectedBytes) throw new Error("The stored file size does not match the selected upload.");

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const header = new TextDecoder("ascii").decode(bytes.subarray(0, 5));
  const trailer = new TextDecoder("ascii").decode(bytes.subarray(Math.max(0, totalBytes - 2048)));
  if (!header.startsWith("%PDF-") || !trailer.includes("%%EOF")) {
    throw new Error("The uploaded file is not a valid PDF document.");
  }
}

export async function completeResumeUpload(userId: string, id: string) {
  const [row] = await db.select().from(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId), eq(resumes.fileStatus, "pending"))).limit(1);
  if (!row) return null;
  const downloadUrl = await presign(row.objectKey, "get");
  await verifyStoredPdf(downloadUrl, row.byteSize);
  await db.update(resumes).set({ fileStatus: "active" }).where(and(eq(resumes.id, id), eq(resumes.userId, userId), eq(resumes.fileStatus, "pending")));
  return { id: row.id, fileName: row.fileName, contentType: row.contentType, byteSize: row.byteSize, fileStatus: "active" as const, uploadedAt: row.uploadedAt };
}

export async function deleteResume(userId: string, id: string) {
  const [row] = await db.select({ id: resumes.id }).from(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId), or(eq(resumes.fileStatus, "active"), eq(resumes.fileStatus, "pending")))).limit(1);
  if (!row) return false;
  const linked = await db.select({ evidenceId: evidenceResumeSources.evidenceId }).from(evidenceResumeSources)
    .innerJoin(evidenceSources, eq(evidenceSources.id, evidenceResumeSources.evidenceId))
    .where(and(eq(evidenceResumeSources.resumeId, id), eq(evidenceSources.userId, userId), eq(evidenceSources.sourceStatus, "active")));
  const evidenceIds = linked.map((item) => item.evidenceId);
  await db.transaction(async (tx) => {
    await tx.update(resumes).set({ fileStatus: "deleted", deletedAt: new Date() }).where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
    if (evidenceIds.length) await tx.update(evidenceSources).set({ sourceStatus: "deleted" }).where(and(eq(evidenceSources.userId, userId), inArray(evidenceSources.id, evidenceIds)));
  });
  return true;
}

export async function getResumeDownloadUrl(userId: string, id: string) {
  const [row] = await db.select().from(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId), eq(resumes.fileStatus, "active"))).limit(1);
  if (!row) return null;
  return { url: await presign(row.objectKey, "get"), fileName: row.fileName };
}
