import { useCallback, useEffect, useRef, useState } from "react";
import { fetchModes } from "../../api/sstv";
import styles from "./UploadForm.module.css";

interface Props {
  onSubmit: (files: File[], mode: string) => void;
}

const ACCEPTED =
  "image/jpeg,image/png,image/gif,image/bmp,image/tiff,image/webp";

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

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) =>
      f.type.startsWith("image/"),
    );
    setFiles((prev) => [...prev, ...valid]);
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
        onClick={() => inputRef.current?.click()}
      >
        <div className={styles.dropIcon}>📷</div>
        <p className={styles.dropText}>
          Drag & drop images here or <strong>browse</strong>
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
        <span className={styles.fileCount}>
          {files.length} file{files.length !== 1 ? "s" : ""} selected
        </span>
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
    </div>
  );
}
