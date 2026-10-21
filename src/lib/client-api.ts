export async function dataApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && typeof window !== "undefined") headers.set("X-VeriFit-Origin", window.location.origin);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`/api/data/${path.replace(/^\/+/, "")}`, { ...init, method, headers, cache: "no-store" });
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const result = await response.json() as T & { error?: string };
    if (!response.ok) throw new Error(result.error ?? `Request failed (${response.status}).`);
    return result;
  }
  if (!response.ok) throw new Error(`Request failed (${response.status}).`);
  return await response.text() as T;
}

export function jsonBody(value: unknown) {
  return JSON.stringify(value);
}
