import { useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import type { ConversionJob, CropArea } from "../../types";
import type { AudioPlayerState } from "../../hooks/useAudioPlayer";
import { MODE_INFO } from "../../constants/modes";
import { cropImageFile } from "../../utils/cropImage";
import { downloadWav } from "../../api/sstv";
import { CropEditor } from "../CropEditor";
import styles from "./BatchList.module.css";

interface Props {
  readonly jobs: ConversionJob[];
  readonly audioState: AudioPlayerState;
  readonly onPlay: (url: string) => void;
  readonly onRemove: (id: string) => void;
  readonly onClearCompleted: () => void;
  readonly onRecrop: (
    id: string,
    croppedFile: File,
    cropData: CropArea,
  ) => void;
  readonly onResetCrop: (id: string) => void;
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return "";
  const kb = bytes / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
}

function DownloadButtons({ job }: { readonly job: ConversionJob }) {
  const [busy, setBusy] = useState(false);

  const handleWavDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const blob = await downloadWav(job.file, job.mode);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = job.file.name.replace(/\.[^.]+$/, ".wav");
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  const handleOggDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!job.audioUrl) return;
    const a = document.createElement("a");
    a.href = job.audioUrl;
    a.download = job.file.name.replace(/\.[^.]+$/, ".ogg");
    a.click();
  };

  return (
    <div className={styles.downloadGroup} onClick={(e) => e.stopPropagation()}>
      <button
        className={styles.dlBtn}
        onClick={handleWavDownload}
        disabled={busy}
        title="Download lossless WAV for radio transmission"
      >
        <span className={styles.dlFormat}>⬇ WAV</span>
        <span className={styles.dlSize}>
          {busy ? "…" : formatBytes(job.wavSize ?? 0)}
        </span>
      </button>
      <button
        className={styles.dlBtn}
        onClick={handleOggDownload}
        title="Download compressed OGG"
      >
        <span className={styles.dlFormat}>⬇ OGG</span>
        <span className={styles.dlSize}>
          {formatBytes(job.audioBlob?.size ?? 0)}
        </span>
      </button>
    </div>
  );
}

const statusLabel: Record<string, string> = {
  pending: "Pending",
  converting: "Converting…",
  done: "Transmit",
  error: "Error",
};

function DownloadAllZip({ jobs }: { readonly jobs: ConversionJob[] }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  const doneJobs = jobs.filter((j) => j.status === "done");

  const handleDownload = async () => {
    if (busy || doneJobs.length === 0) return;
    setBusy(true);
    const zip = new JSZip();

    for (let i = 0; i < doneJobs.length; i++) {
      const job = doneJobs[i];
      setProgress(`${i + 1}/${doneJobs.length}`);
      const wavBlob = await downloadWav(job.file, job.mode);
      const name = job.file.name.replace(/\.[^.]+$/, `_${job.mode}.wav`);
      zip.file(name, wavBlob);
    }

    setProgress("Zipping…");
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sstv-conversions.zip";
    a.click();
    URL.revokeObjectURL(url);
    setBusy(false);
    setProgress("");
  };

  if (doneJobs.length < 2) return null;

  return (
    <button
      className={styles.zipBtn}
      onClick={handleDownload}
      disabled={busy}
      title="Download all converted files as a ZIP (WAV)"
    >
      {busy ? `📦 ${progress}` : `📦 Download All (${doneJobs.length})`}
    </button>
  );
}

export default function BatchList({
  jobs,
  audioState,
  onPlay,
  onRemove,
  onClearCompleted,
  onRecrop,
  onResetCrop,
}: Props) {
  const [cropJobId, setCropJobId] = useState<string | null>(null);

  const cropJob = cropJobId
    ? (jobs.find((j) => j.id === cropJobId) ?? null)
    : null;

  // Stable object URL for the crop editor (original file)
  const cropImageUrl = useMemo(() => {
    if (!cropJob) return "";
    return URL.createObjectURL(cropJob.originalFile);
  }, [cropJob]);

  useEffect(() => {
    return () => {
      if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
    };
  }, [cropImageUrl]);

  const handleCropApply = async (area: CropArea) => {
    if (!cropJob) return;
    const croppedFile = await cropImageFile(cropJob.originalFile, area);
    onRecrop(cropJob.id, croppedFile, area);
    setCropJobId(null);
  };

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

  const cropAspect = cropJob
    ? (() => {
        const info = MODE_INFO[cropJob.mode];
        return info ? info.width / info.height : 4 / 3;
      })()
    : 4 / 3;
  const cropModeInfo = cropJob ? MODE_INFO[cropJob.mode] : undefined;

  return (
    <section
      className={styles.list}
      aria-label="Conversion queue"
      aria-live="polite"
    >
      <div className={styles.header}>
        <h2>Conversions</h2>
        <div className={styles.headerActions}>
          <DownloadAllZip jobs={jobs} />
          {hasCompleted && (
            <button className={styles.clearBtn} onClick={onClearCompleted}>
              Clear finished
            </button>
          )}
        </div>
      </div>

      {jobs.map((job) => {
        const isActive =
          job.status === "done" && job.audioUrl === audioState.currentUrl;
        const isCropped = !!job.cropData;

        return (
          <div
            key={job.id}
            className={`${styles.jobRow} ${isActive ? styles.selected : ""} ${
              job.status === "done" ? styles.clickable : ""
            }`}
            role={job.status === "done" ? "button" : undefined}
            tabIndex={job.status === "done" ? 0 : undefined}
            onClick={() => {
              if (job.status === "done" && job.audioUrl) onPlay(job.audioUrl);
            }}
            onKeyDown={(e) => {
              if (
                (e.key === "Enter" || e.key === " ") &&
                job.status === "done" &&
                job.audioUrl
              ) {
                e.preventDefault();
                onPlay(job.audioUrl);
              }
            }}
          >
            <JobThumbnail file={job.file} />

            <div className={styles.jobInfo}>
              <div className={styles.fileName}>{job.file.name}</div>
              <div className={styles.meta}>
                {job.mode}
                <span
                  className={`${styles.cropTag} ${isCropped ? styles.cropTagCropped : styles.cropTagFit}`}
                >
                  {isCropped ? "✂ CROP" : "⤢ FIT"}
                </span>
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
              {/* Crop / Reset buttons for done or error jobs */}
              {(job.status === "done" || job.status === "error") && (
                <div
                  className={styles.cropGroup}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className={styles.cropActionBtn}
                    title={isCropped ? "Re-crop image" : "Crop image"}
                    onClick={() => setCropJobId(job.id)}
                  >
                    ✂️
                  </button>
                  {isCropped && (
                    <button
                      className={styles.cropActionBtn}
                      title="Reset to fit (re-converts)"
                      onClick={() => onResetCrop(job.id)}
                    >
                      ↩
                    </button>
                  )}
                </div>
              )}
              {job.status === "done" && <DownloadButtons job={job} />}
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

      {/* Crop editor modal — only one at a time */}
      {cropJob && cropImageUrl && (
        <CropEditor
          imageUrl={cropImageUrl}
          aspect={cropAspect}
          modeName={cropJob.mode}
          modeWidth={cropModeInfo?.width ?? 320}
          modeHeight={cropModeInfo?.height ?? 256}
          initialCrop={cropJob.cropData}
          onApply={handleCropApply}
          onCancel={() => setCropJobId(null)}
        />
      )}
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
