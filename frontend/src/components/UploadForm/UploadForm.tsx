import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchModes } from "../../api/sstv";
import { ModeLegend } from "../ModeLegend";
import styles from "./UploadForm.module.css";

interface Props {
  onSubmit: (files: File[], mode: string) => void;
}

const ACCEPTED =
  "image/jpeg,image/png,image/gif,image/bmp,image/tiff,image/webp";
const MAX_FILES = 10;

export default function UploadForm({ onSubmit }: Props) {
  const [modes, setModes] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState("MartinM1");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
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
    () => files.map((f) => URL.createObjectURL(f)),
    [files],
  );
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) =>
      f.type.startsWith("image/"),
    );
    setFiles((prev) => {
      const remaining = MAX_FILES - prev.length;
      if (remaining <= 0) return prev;
      return [...prev, ...valid.slice(0, remaining)];
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleSubmit = () => {
    if (files.length === 0) return;
    onSubmit(files, selectedMode);
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const atLimit = files.length >= MAX_FILES;

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
      <div
        className={styles.dropZone}
        onClick={() => !atLimit && inputRef.current?.click()}
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
      </div>

      {files.length > 0 && (
        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <span className={styles.fileCount}>
              {files.length} / {MAX_FILES} image{files.length !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={() => {
                setFiles([]);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Clear all
            </button>
          </div>
          <div className={styles.thumbGrid}>
            {files.map((file, i) => (
              <div
                key={`${file.name}-${file.size}-${i}`}
                className={styles.thumbCard}
              >
                <img
                  src={previews[i]}
                  alt={file.name}
                  className={styles.thumbImg}
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeFile(i)}
                  aria-label={`Remove ${file.name}`}
                >
                  ✕
                </button>
                <span className={styles.thumbName} title={file.name}>
                  {file.name}
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
          onChange={(e) => setSelectedMode(e.target.value)}
        >
          {modes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <button
          className={styles.convertBtn}
          disabled={files.length === 0}
          onClick={handleSubmit}
        >
          Convert {files.length > 1 ? `(${files.length})` : ""}
        </button>
      </div>

      <ModeLegend selectedMode={selectedMode} />
    </div>
  );
}
