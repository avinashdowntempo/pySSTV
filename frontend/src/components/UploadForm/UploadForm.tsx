import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchModes } from "../../api/sstv";
import { MODE_INFO } from "../../constants/modes";
import { cropImageFile } from "../../utils/cropImage";
import type { CropArea } from "../../types";
import { CropEditor } from "../CropEditor";
import { ModeLegend } from "../ModeLegend";
import styles from "./UploadForm.module.css";

interface FileEntry {
  file: File;
  cropData?: CropArea;
}

interface Props {
  readonly onSubmit: (
    entries: { file: File; originalFile: File; cropData?: CropArea }[],
    mode: string,
  ) => void;
}

const ACCEPTED =
  "image/jpeg,image/png,image/gif,image/bmp,image/tiff,image/webp";
const MAX_FILES = 10;

export default function UploadForm({ onSubmit }: Props) {
  const [modes, setModes] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState("MartinM1");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchModes()
      .then((m) => {
        setModes(m);
        if (m.length && !m.includes(selectedMode)) setSelectedMode(m[0]);
      })
      .catch(() => setModes(["MartinM1", "ScottieS1", "Robot36"]));
  }, []);

  // Create stable object URLs for thumbnails, revoke on cleanup
  const previews = useMemo(
    () => entries.map((e) => URL.createObjectURL(e.file)),
    [entries],
  );
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) =>
      f.type.startsWith("image/"),
    );
    setEntries((prev) => {
      const remaining = MAX_FILES - prev.length;
      if (remaining <= 0) return prev;
      return [...prev, ...valid.slice(0, remaining).map((file) => ({ file }))];
    });
  }, []);

  const removeFile = useCallback(
    (index: number) => {
      if (cropIndex === index) setCropIndex(null);
      setEntries((prev) => prev.filter((_, i) => i !== index));
    },
    [cropIndex],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  // Reset crop data when mode changes (aspect ratio changes)
  const handleModeChange = useCallback((mode: string) => {
    setSelectedMode(mode);
    setCropIndex(null);
    setEntries((prev) => prev.map((e) => ({ file: e.file })));
  }, []);

  const handleCropApply = useCallback(
    (croppedArea: CropArea) => {
      if (cropIndex === null) return;
      setEntries((prev) =>
        prev.map((e, i) =>
          i === cropIndex ? { ...e, cropData: croppedArea } : e,
        ),
      );
      setCropIndex(null);
    },
    [cropIndex],
  );

  const handleResetCrop = useCallback((index: number) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { file: e.file } : e)),
    );
  }, []);

  const handleSubmit = async () => {
    if (entries.length === 0 || submitting) return;
    setSubmitting(true);

    try {
      const processed = await Promise.all(
        entries.map(async (entry) => {
          if (entry.cropData) {
            const croppedFile = await cropImageFile(entry.file, entry.cropData);
            return {
              file: croppedFile,
              originalFile: entry.file,
              cropData: entry.cropData,
            };
          }
          return { file: entry.file, originalFile: entry.file };
        }),
      );

      onSubmit(processed, selectedMode);
      setEntries([]);
      setCropIndex(null);
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setSubmitting(false);
    }
  };

  const atLimit = entries.length >= MAX_FILES;
  const modeInfo = MODE_INFO[selectedMode];
  const aspect = modeInfo ? modeInfo.width / modeInfo.height : 4 / 3;

  return (
    <div
      className={`${styles.uploadForm} ${dragOver ? styles.dragOver : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <button
        type="button"
        className={styles.dropZone}
        onClick={() => !atLimit && inputRef.current?.click()}
        aria-label={
          atLimit
            ? `Maximum ${MAX_FILES} images reached`
            : "Drop images here or click to browse"
        }
      >
        <div className={styles.dropIcon}>📷</div>
        <p className={styles.dropText}>
          {atLimit ? (
            <span>Maximum {MAX_FILES} images reached</span>
          ) : (
            <>
              Drag & drop images here or <strong>browse</strong>
            </>
          )}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className={styles.hiddenInput}
          onChange={(e) => addFiles(e.target.files)}
        />
      </button>

      {entries.length > 0 && (
        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <span className={styles.fileCount}>
              {entries.length} / {MAX_FILES} image
              {entries.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={() => {
                setEntries([]);
                setCropIndex(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Clear all
            </button>
          </div>
          <div className={styles.thumbGrid}>
            {entries.map((entry, i) => (
              <div
                key={`${entry.file.name}-${entry.file.size}-${i}`}
                className={styles.thumbCard}
              >
                <img
                  src={previews[i]}
                  alt={entry.file.name}
                  className={styles.thumbImg}
                />

                {/* FIT / CROPPED badge */}
                <span
                  className={`${styles.cropBadge} ${entry.cropData ? styles.cropBadgeCropped : styles.cropBadgeFit}`}
                >
                  {entry.cropData ? "✂ CROP" : "⤢ FIT"}
                </span>

                {/* Crop / Reset buttons */}
                <div className={styles.cropActions}>
                  <button
                    type="button"
                    className={styles.cropBtn}
                    onClick={() => setCropIndex(i)}
                    title="Crop to mode aspect ratio"
                  >
                    ✂️
                  </button>
                  {entry.cropData && (
                    <button
                      type="button"
                      className={styles.resetCropBtn}
                      onClick={() => handleResetCrop(i)}
                      title="Reset to fit mode"
                    >
                      ↩
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeFile(i)}
                  aria-label={`Remove ${entry.file.name}`}
                >
                  ✕
                </button>
                <span className={styles.thumbName} title={entry.file.name}>
                  {entry.file.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.controls}>
        <select
          className={styles.modeSelect}
          value={selectedMode}
          onChange={(e) => handleModeChange(e.target.value)}
          aria-label="SSTV mode"
        >
          {modes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <button
          className={styles.convertBtn}
          disabled={entries.length === 0 || submitting}
          onClick={handleSubmit}
        >
          {submitting
            ? "Processing…"
            : `Convert ${entries.length > 1 ? `(${entries.length})` : ""}`}
        </button>
      </div>

      <ModeLegend selectedMode={selectedMode} />

      {/* Crop editor modal — only one open at a time */}
      {cropIndex !== null && entries[cropIndex] && (
        <CropEditor
          imageUrl={previews[cropIndex]}
          aspect={aspect}
          modeName={selectedMode}
          modeWidth={modeInfo?.width ?? 320}
          modeHeight={modeInfo?.height ?? 256}
          initialCrop={entries[cropIndex].cropData}
          onApply={handleCropApply}
          onCancel={() => setCropIndex(null)}
        />
      )}
    </div>
  );
}
