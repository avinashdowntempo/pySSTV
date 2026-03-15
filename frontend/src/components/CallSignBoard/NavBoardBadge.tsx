import { useEffect, useState } from "react";
import type { BoardEntry } from "../../types";
import { fetchBoard } from "../../api/callsign";
import styles from "./NavBoardBadge.module.css";

export function NavBoardBadge() {
  const [entries, setEntries] = useState<BoardEntry[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    fetchBoard(50)
      .then((data) => setEntries(data.entries))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (entries.length <= 1) return;
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % entries.length);
    }, 2000);
    return () => clearInterval(id);
  }, [entries.length]);

  const current = entries[activeIdx];

  return (
    <button
      type="button"
      className={styles.badge}
      onClick={() => {
        document
          .getElementById("operator-board")
          ?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      <span className={styles.dot} />
      <span className={styles.label} key={activeIdx}>
        {current ? current.callsign : "📡 Board"}
      </span>
      {entries.length > 0 && (
        <span className={styles.count}>{entries.length}</span>
      )}
      <span className={styles.chevron}>▼</span>
    </button>
  );
}
