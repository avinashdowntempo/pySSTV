import { useState } from "react";
import styles from "./ModeLegend.module.css";

const MODE_INFO: Record<string, { width: number; height: number }> = {
  MartinM1: { width: 320, height: 256 },
  MartinM2: { width: 160, height: 256 },
  ScottieS1: { width: 320, height: 256 },
  ScottieS2: { width: 160, height: 256 },
  ScottieDX: { width: 320, height: 256 },
  Robot8BW: { width: 160, height: 120 },
  Robot24BW: { width: 320, height: 240 },
  Robot36: { width: 320, height: 240 },
  PasokonP3: { width: 640, height: 496 },
  PasokonP5: { width: 640, height: 496 },
  PasokonP7: { width: 640, height: 496 },
  PD90: { width: 320, height: 256 },
  PD120: { width: 640, height: 496 },
  PD160: { width: 512, height: 400 },
  PD180: { width: 640, height: 496 },
  PD240: { width: 640, height: 496 },
  PD290: { width: 800, height: 616 },
  WraaseSC2120: { width: 320, height: 256 },
  WraaseSC2180: { width: 320, height: 256 },
};

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
            <strong>{selectedMode}</strong> — {current.width} × {current.height}
            px
          </span>
        ) : (
          <span>Mode resolutions</span>
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
          </div>
          {Object.entries(MODE_INFO).map(([mode, { width, height }]) => (
            <div
              key={mode}
              className={`${styles.row} ${mode === selectedMode ? styles.active : ""}`}
            >
              <span className={styles.modeName}>{mode}</span>
              <span className={styles.resolution}>
                {width} × {height}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
