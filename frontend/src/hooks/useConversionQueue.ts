import { useCallback, useRef, useState } from "react";
import type { ConversionJob, ConvertOptions } from "../types";
import { convertImage } from "../api/sstv";

let nextId = 1;

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
      const blob = await convertImage(pending.file, {
        mode: pending.mode,
      } as ConvertOptions);
      const wavUrl = URL.createObjectURL(blob);

      syncRef(
        queueRef.current.map((j) =>
          j.id === pending.id
            ? { ...j, status: "done" as const, wavBlob: blob, wavUrl }
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
    (files: File[], mode: string) => {
      const newJobs: ConversionJob[] = files.map((file) => ({
        id: String(nextId++),
        file,
        mode,
        status: "pending" as const,
      }));
      const updated = [...queueRef.current, ...newJobs];
      syncRef(updated);
      // Kick off processing
      setTimeout(processNext, 0);
    },
    [processNext],
  );

  const removeJob = useCallback((id: string) => {
    const job = queueRef.current.find((j) => j.id === id);
    if (job?.wavUrl) URL.revokeObjectURL(job.wavUrl);
    syncRef(queueRef.current.filter((j) => j.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    queueRef.current.forEach((j) => {
      if (j.status === "done" && j.wavUrl) URL.revokeObjectURL(j.wavUrl);
    });
    syncRef(
      queueRef.current.filter(
        (j) => j.status !== "done" && j.status !== "error",
      ),
    );
  }, []);

  return { jobs, addJobs, removeJob, clearCompleted };
}
