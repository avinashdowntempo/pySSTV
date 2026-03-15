import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardEntry } from "../../types";
import styles from "./CallSignBoard.module.css";

interface FlipBoardViewProps {
  readonly entries: readonly BoardEntry[];
}

const PAGE_SIZE = 8;
const FLIP_INTERVAL = 5000; // 5 seconds per page

export function FlipBoardView({ entries }: FlipBoardViewProps) {
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const [page, setPage] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const goToPage = useCallback(
    (p: number) => {
      if (p === page) return;
      setFlipping(true);
      setTimeout(() => {
        setPage(p);
        setFlipping(false);
      }, 300);
    },
    [page],
  );

  // Auto-advance
  useEffect(() => {
    if (totalPages <= 1) return;
    const advancePage = () => {
      setFlipping(true);
      setTimeout(() => {
        setPage((prev) => (prev + 1) % totalPages);
        setFlipping(false);
      }, 300);
    };
    timerRef.current = setInterval(advancePage, FLIP_INTERVAL);

    return () => clearInterval(timerRef.current);
  }, [totalPages]);

  // Clamp page when entries shrink
  const safePage = page >= totalPages ? 0 : page;

  if (entries.length === 0) {
    return (
      <div className={styles.empty}>
        No operators checked in yet — be the first!
      </div>
    );
  }

  const start = safePage * PAGE_SIZE;
  const pageEntries = entries.slice(start, start + PAGE_SIZE);

  return (
    <div className={styles.flipContainer}>
      {/* Column headers */}
      <div className={styles.colHeaders}>
        <span className={styles.colLabel}>Call Sign</span>
        <span className={styles.colLabel}>Operator</span>
        <span className={styles.colLabel}>Class</span>
        <span className={styles.colLabel}>Grid</span>
      </div>

      {/* Flipping rows */}
      <div
        className={`${styles.flipPage} ${flipping ? styles.flipOut : styles.flipIn}`}
      >
        {pageEntries.map((entry, i) => (
          <div className={styles.row} key={`${entry.callsign}-${start + i}`}>
            <span className={styles.callsign}>{entry.callsign}</span>
            <span className={styles.name} title={entry.name}>
              {entry.name}
            </span>
            <span className={styles.classBadge}>{entry.operClass || "—"}</span>
            <span className={styles.grid}>{entry.gridsquare || "—"}</span>
          </div>
        ))}
      </div>

      {/* Page dots */}
      {totalPages > 1 && (
        <div className={styles.flipDots}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              type="button"
              key={i}
              className={`${styles.flipDot} ${i === safePage ? styles.flipDotActive : ""}`}
              onClick={() => goToPage(i)}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
