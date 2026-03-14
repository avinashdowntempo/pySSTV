import type { ConversionJob } from "../../types";
import type { AudioPlayerState } from "../../hooks/useAudioPlayer";
import styles from "./BatchList.module.css";

interface Props {
  readonly jobs: ConversionJob[];
  readonly audioState: AudioPlayerState;
  readonly onPlay: (url: string) => void;
  readonly onRemove: (id: string) => void;
  readonly onClearCompleted: () => void;
}

function formatSize(blob?: Blob) {
  if (!blob) return "";
  const kb = blob.size / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
}

const statusLabel: Record<string, string> = {
  pending: "Pending",
  converting: "Converting…",
  done: "Transmit",
  error: "Error",
};

export default function BatchList({
  jobs,
  audioState,
  onPlay,
  onRemove,
  onClearCompleted,
}: Props) {
  if (jobs.length === 0) {
    return (
      <div className={styles.empty}>
        No conversions yet — upload some images above.
      </div>
    );
  }

  const hasCompleted = jobs.some(
    (j) => j.status === "done" || j.status === "error",
  );

  return (
    <section
      className={styles.list}
      aria-label="Conversion queue"
      aria-live="polite"
    >
      <div className={styles.header}>
        <h2>Conversions</h2>
        {hasCompleted && (
          <button className={styles.clearBtn} onClick={onClearCompleted}>
            Clear finished
          </button>
        )}
      </div>

      {jobs.map((job) => {
        const isActive =
          job.status === "done" && job.wavUrl === audioState.currentUrl;

        return (
          <div
            key={job.id}
            className={`${styles.jobRow} ${isActive ? styles.selected : ""} ${
              job.status === "done" ? styles.clickable : ""
            }`}
            role={job.status === "done" ? "button" : undefined}
            tabIndex={job.status === "done" ? 0 : undefined}
            onClick={() => {
              if (job.status === "done" && job.wavUrl) onPlay(job.wavUrl);
            }}
            onKeyDown={(e) => {
              if (
                (e.key === "Enter" || e.key === " ") &&
                job.status === "done" &&
                job.wavUrl
              ) {
                e.preventDefault();
                onPlay(job.wavUrl);
              }
            }}
          >
            <JobThumbnail file={job.file} />

            <div className={styles.jobInfo}>
              <div className={styles.fileName}>{job.file.name}</div>
              <div className={styles.meta}>
                {job.mode}
                {job.wavBlob ? ` · ${formatSize(job.wavBlob)}` : ""}
                {job.error ? ` · ${job.error}` : ""}
              </div>
            </div>

            <span
              className={`${styles.badge} ${styles[job.status]} ${isActive && audioState.isPlaying ? styles.transmitting : ""}`}
            >
              {job.status === "converting" && (
                <span className={styles.spinner}>⏳</span>
              )}
              {isActive && audioState.isPlaying
                ? "Transmitting…"
                : statusLabel[job.status]}
            </span>

            <div className={styles.actions}>
              {job.status === "done" && job.wavUrl && (
                <a
                  className={styles.iconBtn}
                  href={job.wavUrl}
                  download={job.file.name.replace(/\.[^.]+$/, ".wav")}
                  title="Download WAV"
                  onClick={(e) => e.stopPropagation()}
                >
                  ⬇
                </a>
              )}
              <button
                className={styles.iconBtn}
                title="Remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(job.id);
                }}
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}

/** Displays an object-URL thumbnail for the source image file */
function JobThumbnail({ file }: { readonly file: File }) {
  const url = URL.createObjectURL(file);
  return (
    <img
      className={styles.thumbnail}
      src={url}
      alt={file.name}
      onLoad={() => URL.revokeObjectURL(url)}
    />
  );
}
