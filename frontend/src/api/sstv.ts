import type { ConvertOptions } from "../types";

const BASE = "/api";

export interface ConvertResult {
  blob: Blob;
  wavSize: number;
}

export async function fetchModes(): Promise<string[]> {
  const res = await fetch(`${BASE}/modes`);
  if (!res.ok) throw new Error("Failed to fetch modes");
  const data = await res.json();
  return data.modes as string[];
}

export async function convertImage(
  file: File,
  options: ConvertOptions,
): Promise<ConvertResult> {
  const form = new FormData();
  form.append("image", file);
  form.append("mode", options.mode);
  if (options.sampleRate)
    form.append("sample_rate", String(options.sampleRate));
  if (options.bits) form.append("bits", String(options.bits));
  form.append("resize", options.resize !== false ? "true" : "false");
  form.append("vox", options.vox ? "true" : "false");
  if (options.fskid) form.append("fskid", options.fskid);
  if (options.format) form.append("format", options.format);

  const res = await fetch(`${BASE}/convert`, { method: "POST", body: form });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Conversion failed" }));
    throw new Error(err.error || "Conversion failed");
  }

  const blob = await res.blob();
  const wavSize = Number(res.headers.get("X-WAV-Size")) || 0;
  return { blob, wavSize };
}

export async function downloadWav(file: File, mode: string): Promise<Blob> {
  const form = new FormData();
  form.append("image", file);
  form.append("mode", mode);
  form.append("format", "wav");

  const res = await fetch(`${BASE}/convert`, { method: "POST", body: form });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Download failed" }));
    throw new Error(err.error || "Download failed");
  }

  return res.blob();
}
