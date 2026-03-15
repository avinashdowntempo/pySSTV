import type { CallSignInfo, BoardEntry } from "../types";

const BASE = "/api";

export async function lookupCallSign(callsign: string): Promise<CallSignInfo> {
  const res = await fetch(
    `${BASE}/callsign/lookup?callsign=${encodeURIComponent(callsign)}`,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Lookup failed" }));
    throw new Error(err.error || "Lookup failed");
  }
  return res.json();
}

export async function checkinCallSign(callsign: string): Promise<CallSignInfo> {
  const res = await fetch(`${BASE}/callsign/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callsign }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Check-in failed" }));
    throw new Error(err.error || "Check-in failed");
  }
  return res.json();
}

export async function fetchBoard(
  limit = 50,
): Promise<{ entries: BoardEntry[] }> {
  const res = await fetch(`${BASE}/callsign/board?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch board");
  return res.json();
}

export async function seedBoard(): Promise<{ inserted: number }> {
  const res = await fetch(`${BASE}/callsign/seed`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to seed board");
  return res.json();
}
