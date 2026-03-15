import { useEffect, useRef, useState } from "react";
import type { BoardEntry } from "../../types";
import styles from "./CallSignBoard.module.css";

interface TickerViewProps {
  readonly entries: readonly BoardEntry[];
}

export function TickerView({ entries }: TickerViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || entries.length === 0) return;

    let raf: number;
    const speed = 0.5; // px per frame

    const tick = () => {
      if (!paused && el.scrollHeight > el.clientHeight) {
        el.scrollTop += speed;
        // Loop: when we've scrolled past half the duplicated content, reset
        if (el.scrollTop >= el.scrollHeight / 2) {
          el.scrollTop = 0;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [entries, paused]);

  if (entries.length === 0) {
    return (
      <div className={styles.empty}>
        No operators checked in yet — be the first!
      </div>
    );
  }

  // Duplicate entries so scroll can loop seamlessly
  const doubled = [...entries, ...entries];

  return (
    <div
      ref={containerRef}
      className={styles.tickerContainer}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {doubled.map((entry, i) => (
        <div className={styles.tickerRow} key={`${entry.callsign}-${i}`}>
          <span className={styles.callsign}>{entry.callsign}</span>
          <span className={styles.name} title={entry.name}>
            {entry.name}
          </span>
          <span className={styles.classBadge}>{entry.operClass || "—"}</span>
          <span className={styles.grid}>{entry.gridsquare || "—"}</span>
        </div>
      ))}
    </div>
  );
}
