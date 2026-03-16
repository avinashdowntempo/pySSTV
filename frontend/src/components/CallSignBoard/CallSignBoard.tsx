import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardEntry, CallSignInfo } from "../../types";
import {
  lookupCallSign,
  checkinCallSign,
  fetchBoard,
  seedBoard,
} from "../../api/callsign";
import { TickerView } from "./TickerView";
import { MarqueeView } from "./MarqueeView";
import { FlipBoardView } from "./FlipBoardView";
import styles from "./CallSignBoard.module.css";

type ViewMode = "list" | "ticker" | "marquee" | "flip";

const VIEW_LABELS: Record<ViewMode, string> = {
  list: "▤ List",
  ticker: "▼ Ticker",
  marquee: "◀ Marquee",
  flip: "⊞ Flip",
};

function getInitialViewMode(): ViewMode {
  const stored = localStorage.getItem("boardViewMode");
  if (stored && stored in VIEW_LABELS) return stored as ViewMode;
  return "list";
}

export function CallSignBoard() {
  const [entries, setEntries] = useState<BoardEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingInfo, setPendingInfo] = useState<CallSignInfo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const inputRef = useRef<HTMLInputElement>(null);

  const changeViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("boardViewMode", mode);
  }, []);

  // Load board on mount
  useEffect(() => {
    fetchBoard(50)
      .then((data) => setEntries(data.entries))
      .catch(() => {});
  }, []);

  const handleLookup = useCallback(async () => {
    const callsign = input.trim().toUpperCase();
    if (!callsign) return;

    setError("");
    setLoading(true);
    try {
      const info = await lookupCallSign(callsign);
      setPendingInfo(info);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }, [input]);

  const handleConfirm = useCallback(async () => {
    if (!pendingInfo) return;
    setLoading(true);
    try {
      await checkinCallSign(pendingInfo.callsign);
      setPendingInfo(null);
      setInput("");
      // Refresh board
      const data = await fetchBoard(50);
      setEntries(data.entries);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check-in failed");
      setPendingInfo(null);
    } finally {
      setLoading(false);
    }
  }, [pendingInfo]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleLookup();
    },
    [handleLookup],
  );

  return (
    <section className={styles.board} aria-label="Operator check-in board">
      {/* Header */}
      <div className={styles.boardHeader}>
        <span className={styles.boardTitle}>📡 Operator Board</span>
        <div className={styles.headerRight}>
          <div
            className={styles.viewToggle}
            role="tablist"
            aria-label="Board view mode"
          >
            {(Object.keys(VIEW_LABELS) as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={viewMode === mode}
                className={`${styles.viewBtn} ${viewMode === mode ? styles.viewBtnActive : ""}`}
                onClick={() => changeViewMode(mode)}
              >
                {VIEW_LABELS[mode]}
              </button>
            ))}
          </div>
          <span className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            Live
          </span>
        </div>
      </div>

      {/* Dynamic view */}
      {viewMode === "list" && (
        <>
          {/* Column headers */}
          <div className={styles.colHeaders} role="row">
            <span className={styles.colLabel}>Call Sign</span>
            <span className={styles.colLabel}>Operator</span>
            <span className={styles.colLabel}>Class</span>
            <span className={styles.colLabel}>Grid</span>
          </div>

          {/* Rows */}
          <div className={styles.rows} role="list">
            {entries.length === 0 ? (
              <div className={styles.empty}>
                No operators checked in yet — be the first!
              </div>
            ) : (
              entries.map((entry, i) => (
                <div
                  className={styles.row}
                  role="listitem"
                  key={`${entry.callsign}-${entry.checkedInAt}-${i}`}
                >
                  <span className={styles.callsign}>{entry.callsign}</span>
                  <span className={styles.name} title={entry.name}>
                    {entry.name}
                  </span>
                  <span className={styles.classBadge}>
                    {entry.operClass || "—"}
                  </span>
                  <span className={styles.grid}>{entry.gridsquare || "—"}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {viewMode === "ticker" && <TickerView entries={entries} />}
      {viewMode === "marquee" && <MarqueeView entries={entries} />}
      {viewMode === "flip" && <FlipBoardView entries={entries} />}

      {/* Check-in input */}
      <div className={styles.checkinRow}>
        <input
          ref={inputRef}
          type="text"
          className={styles.callInput}
          placeholder="Enter your call sign…"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          maxLength={10}
          aria-label="Call sign input"
        />
        <button
          type="button"
          className={styles.checkinBtn}
          onClick={handleLookup}
          disabled={loading || !input.trim()}
        >
          {loading ? "…" : "Check In"}
        </button>
        <button
          type="button"
          className={styles.seedBtn}
          onClick={async () => {
            await seedBoard();
            const data = await fetchBoard(50);
            setEntries(data.entries);
          }}
          title="Load dummy test data"
        >
          Seed
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}

      {/* Confirmation modal */}
      {pendingInfo && (
        <div
          className={styles.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPendingInfo(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm check-in"
        >
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Confirm Check-In</div>
            <div className={styles.infoGrid}>
              <span className={styles.infoLabel}>Call Sign</span>
              <span className={styles.infoValue}>{pendingInfo.callsign}</span>
              <span className={styles.infoLabel}>Name</span>
              <span className={styles.infoValue}>{pendingInfo.name}</span>
              <span className={styles.infoLabel}>Type</span>
              <span className={styles.infoValue}>{pendingInfo.type}</span>
              <span className={styles.infoLabel}>Class</span>
              <span className={styles.infoValue}>
                {pendingInfo.operClass || "—"}
              </span>
              <span className={styles.infoLabel}>Grid</span>
              <span className={styles.infoValue}>
                {pendingInfo.gridsquare || "—"}
              </span>
              {pendingInfo.trustee && (
                <>
                  <span className={styles.infoLabel}>Trustee</span>
                  <span className={styles.infoValue}>
                    {pendingInfo.trustee}
                  </span>
                </>
              )}
            </div>
            <p
              style={{
                textAlign: "center",
                fontSize: "1.15rem",
                color: "#64748b",
                marginBottom: "1rem",
                fontFamily: '"VT323", monospace',
                textShadow: "0 0 4px rgba(100, 116, 139, 0.3)",
              }}
            >
              Is this you?
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? "Checking in…" : "Yes, Check In"}
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setPendingInfo(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
