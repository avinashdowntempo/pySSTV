/** Status of a single conversion job */
export type JobStatus = "pending" | "converting" | "done" | "error";

/** A single image-to-WAV conversion job */
export interface ConversionJob {
  id: string;
  file: File;
  mode: string;
  status: JobStatus;
  progress?: number;
  wavBlob?: Blob;
  wavUrl?: string;
  error?: string;
}

/** Options sent alongside the image upload */
export interface ConvertOptions {
  mode: string;
  sampleRate?: number;
  bits?: number;
  resize?: boolean;
  vox?: boolean;
  fskid?: string;
}
