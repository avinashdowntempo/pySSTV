import styles from "./DemoSection.module.css";

const DEMOS = [
  { id: "1", label: "Sample 1" },
  { id: "2", label: "Sample 2" },
  { id: "3", label: "Sample 3" },
  { id: "4", label: "Sample 4" },
  { id: "5", label: "Sample 5" },
] as const;

interface Props {
  readonly currentUrl: string | null;
  readonly isPlaying: boolean;
  readonly onPlay: (url: string) => void;
}

export default function DemoSection({ currentUrl, isPlaying, onPlay }: Props) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Try a sample</h2>
      <p className={styles.subtitle}>
        Pre-converted with <strong>MartinM1</strong> mode — tap play to listen.
      </p>

      <div className={styles.grid}>
        {DEMOS.map(({ id, label }) => {
          const audioUrl = `/demo_audio/${id}.mp3`;
          const thumbUrl = `/demo_thumbs/${id}.webp`;
          const active = currentUrl === audioUrl;

          return (
            <div
              key={id}
              className={`${styles.card} ${active ? styles.active : ""}`}
            >
              <div className={styles.imageWrap}>
                <img
                  src={thumbUrl}
                  alt={label}
                  className={styles.thumb}
                  loading="lazy"
                />
                <button
                  className={styles.playOverlay}
                  onClick={() => onPlay(audioUrl)}
                  aria-label={`Play ${label}`}
                >
                  <span className={styles.playIcon}>
                    {active && isPlaying ? "⏸" : "▶"}
                  </span>
                </button>
              </div>
              <div className={styles.cardInfo}>
                <span className={styles.cardLabel}>{label}</span>
                <span className={styles.cardMode}>MartinM1 · 320×256</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
