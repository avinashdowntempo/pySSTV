import { useEffect, useRef, useState } from "react";
import type { BoardEntry } from "../../types";
import styles from "./CallSignBoard.module.css";

interface MarqueeViewProps {
  readonly entries: readonly BoardEntry[];
}

export function MarqueeView({ entries }: MarqueeViewProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // Calculate animation duration based on content width
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // ~6s per 1000px of content, minimum 15s
    const width = track.scrollWidth / 2;
    const duration = Math.max(15, (width / 1000) * 6);
    track.style.animationDuration = `${duration}s`;
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className={styles.empty}>
        No operators checked in yet — be the first!
      </div>
    );
  }

  // Duplicate for seamless loop
  const doubled = [...entries, ...entries];

  return (
    <div
      className={styles.marqueeContainer}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className={`${styles.marqueeTrack} ${paused ? styles.marqueePaused : ""}`}
      >
        {doubled.map((entry, i) => (
          <span className={styles.marqueeItem} key={`${entry.callsign}-${i}`}>
            <span className={styles.callsign}>{entry.callsign}</span>
            <span className={styles.marqueeOp}>{entry.name}</span>
            <span className={styles.classBadge}>{entry.operClass || "—"}</span>
            <span className={styles.marqueeSep}>•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
