import type { ConvertOptions } from "../types";

const BASE = "/api";

export async function fetchModes(): Promise<string[]> {
  const res = await fetch(`${BASE}/modes`);
  if (!res.ok) throw new Error("Failed to fetch modes");
  const data = await res.json();
  return data.modes as string[];
}

export async function convertImage(
  file: File,
  options: ConvertOptions,
): Promise<Blob> {
  const form = new FormData();
  form.append("image", file);
  form.append("mode", options.mode);
  if (options.sampleRate)
    form.append("sample_rate", String(options.sampleRate));
  if (options.bits) form.append("bits", String(options.bits));
  form.append("resize", options.resize !== false ? "true" : "false");
  form.append("vox", options.vox ? "true" : "false");
  if (options.fskid) form.append("fskid", options.fskid);

  const res = await fetch(`${BASE}/convert`, { method: "POST", body: form });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Conversion failed" }));
    throw new Error(err.error || "Conversion failed");
  }

  return res.blob();
}
