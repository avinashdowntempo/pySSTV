/** Status of a single conversion job */
export type JobStatus = "pending" | "converting" | "done" | "error";

/** Pixel-based crop area (from react-easy-crop) */
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A single image-to-WAV conversion job */
export interface ConversionJob {
  id: string;
  file: File;
  originalFile: File;
  mode: string;
  status: JobStatus;
  cropData?: CropArea;
  progress?: number;
  audioBlob?: Blob;
  audioUrl?: string;
  wavSize?: number;
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
  format?: "wav" | "ogg";
}

/** Result from a callsign ULS lookup */
export interface CallSignInfo {
  callsign: string;
  name: string;
  type: string;
  operClass: string;
  gridsquare: string;
  trustee: string;
}

/** A single check-in entry on the board */
export interface BoardEntry {
  callsign: string;
  name: string;
  operClass: string;
  gridsquare: string;
  checkedInAt: number;
}
