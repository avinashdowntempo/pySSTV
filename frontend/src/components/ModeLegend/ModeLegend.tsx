import { useState } from "react";
import { MODE_INFO } from "../../constants/modes";
import styles from "./ModeLegend.module.css";

interface Props {
  readonly selectedMode: string;
}

export default function ModeLegend({ selectedMode }: Props) {
  const [open, setOpen] = useState(false);
  const current = MODE_INFO[selectedMode];

  return (
    <div className={styles.legend}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.icon}>ℹ️</span>
        {current ? (
          <span>
            Recommended upload: {current.width} × {current.height} px
          </span>
        ) : (
          <span>View recommended resolutions</span>
        )}
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className={styles.table}>
          <div className={`${styles.row} ${styles.headerRow}`}>
            <span>Mode</span>
            <span>Resolution</span>
            <span>Aspect Ratio</span>
          </div>
          {Object.entries(MODE_INFO).map(([mode, { width, height }]) => {
            const gcd = (a: number, b: number): number =>
              b ? gcd(b, a % b) : a;
            const d = gcd(width, height);
            return (
              <div
                key={mode}
                className={`${styles.row} ${mode === selectedMode ? styles.active : ""}`}
              >
                <span className={styles.modeName}>{mode}</span>
                <span className={styles.resolution}>
                  {width} × {height}
                </span>
                <span className={styles.aspectRatio}>
                  {width / d}:{height / d}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
