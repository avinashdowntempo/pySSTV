import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import type { CropArea } from "../../types";
import styles from "./CropEditor.module.css";

interface Props {
  readonly imageUrl: string;
  readonly aspect: number;
  readonly modeName: string;
  readonly modeWidth: number;
  readonly modeHeight: number;
  readonly initialCrop?: CropArea;
  readonly onApply: (croppedArea: CropArea) => void;
  readonly onCancel: () => void;
}

export default function CropEditor({
  imageUrl,
  aspect,
  modeName,
  modeWidth,
  modeHeight,
  initialCrop,
  onApply,
  onCancel,
}: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleApply = () => {
    if (!croppedAreaPixels) return;
    onApply({
      x: croppedAreaPixels.x,
      y: croppedAreaPixels.y,
      width: croppedAreaPixels.width,
      height: croppedAreaPixels.height,
    });
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Crop Image</h3>
          <span className={styles.modeInfo}>
            {modeName} — {modeWidth}×{modeHeight}
          </span>
        </div>

        <div className={styles.cropContainer}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            initialCroppedAreaPixels={
              initialCrop
                ? {
                    x: initialCrop.x,
                    y: initialCrop.y,
                    width: initialCrop.width,
                    height: initialCrop.height,
                  }
                : undefined
            }
          />
        </div>

        <div className={styles.controls}>
          <label className={styles.zoomLabel}>
            <span>Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className={styles.zoomSlider}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.applyBtn}
            onClick={handleApply}
          >
            ✂️ Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
