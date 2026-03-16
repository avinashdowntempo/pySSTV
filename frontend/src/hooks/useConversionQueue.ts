import { useCallback, useRef, useState } from "react";
import type { ConversionJob, ConvertOptions, CropArea } from "../types";
import { convertImage } from "../api/sstv";

let nextId = 1;

export interface AddJobEntry {
  file: File;
  originalFile: File;
  cropData?: CropArea;
}

export function useConversionQueue() {
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const processingRef = useRef(false);
  const queueRef = useRef<ConversionJob[]>([]);

  // Keep queueRef in sync
  const syncRef = (updated: ConversionJob[]) => {
    queueRef.current = updated;
    setJobs(updated);
  };

  const processNext = useCallback(async () => {
    if (processingRef.current) return;

    const pending = queueRef.current.find((j) => j.status === "pending");
    if (!pending) return;

    processingRef.current = true;

    // Mark as converting
    syncRef(
      queueRef.current.map((j) =>
        j.id === pending.id ? { ...j, status: "converting" as const } : j,
      ),
    );

    try {
      const { blob, wavSize } = await convertImage(pending.file, {
        mode: pending.mode,
        format: "ogg",
      } as ConvertOptions);
      const audioUrl = URL.createObjectURL(blob);

      syncRef(
        queueRef.current.map((j) =>
          j.id === pending.id
            ? {
                ...j,
                status: "done" as const,
                audioBlob: blob,
                audioUrl,
                wavSize,
              }
            : j,
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      syncRef(
        queueRef.current.map((j) =>
          j.id === pending.id
            ? { ...j, status: "error" as const, error: message }
            : j,
        ),
      );
    }

    processingRef.current = false;
    // Process remaining
    processNext();
  }, []);

  const addJobs = useCallback(
    (entries: AddJobEntry[], mode: string) => {
      const newJobs: ConversionJob[] = entries.map((entry) => ({
        id: String(nextId++),
        file: entry.file,
        originalFile: entry.originalFile,
        mode,
        cropData: entry.cropData,
        status: "pending" as const,
      }));
      const updated = [...queueRef.current, ...newJobs];
      syncRef(updated);
      // Kick off processing
      setTimeout(processNext, 0);
    },
    [processNext],
  );

  /** Re-queue a completed job with a new cropped file */
  const recropJob = useCallback(
    (id: string, croppedFile: File, cropData: CropArea) => {
      const existing = queueRef.current.find((j) => j.id === id);
      if (!existing) return;
      if (existing.audioUrl) URL.revokeObjectURL(existing.audioUrl);

      syncRef(
        queueRef.current.map((j) =>
          j.id === id
            ? {
                ...j,
                file: croppedFile,
                cropData,
                status: "pending" as const,
                audioBlob: undefined,
                audioUrl: undefined,
                wavSize: undefined,
                error: undefined,
              }
            : j,
        ),
      );
      setTimeout(processNext, 0);
    },
    [processNext],
  );

  /** Reset a job back to fit (original file, no crop) */
  const resetJobCrop = useCallback(
    (id: string) => {
      const existing = queueRef.current.find((j) => j.id === id);
      if (!existing) return;
      if (existing.audioUrl) URL.revokeObjectURL(existing.audioUrl);

      syncRef(
        queueRef.current.map((j) =>
          j.id === id
            ? {
                ...j,
                file: j.originalFile,
                cropData: undefined,
                status: "pending" as const,
                audioBlob: undefined,
                audioUrl: undefined,
                wavSize: undefined,
                error: undefined,
              }
            : j,
        ),
      );
      setTimeout(processNext, 0);
    },
    [processNext],
  );

  const removeJob = useCallback((id: string) => {
    const job = queueRef.current.find((j) => j.id === id);
    if (job?.audioUrl) URL.revokeObjectURL(job.audioUrl);
    syncRef(queueRef.current.filter((j) => j.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    queueRef.current.forEach((j) => {
      if (j.status === "done" && j.audioUrl) URL.revokeObjectURL(j.audioUrl);
    });
    syncRef(
      queueRef.current.filter(
        (j) => j.status !== "done" && j.status !== "error",
      ),
    );
  }, []);

  return { jobs, addJobs, removeJob, clearCompleted, recropJob, resetJobCrop };
}
