import type { CropArea } from "../types";

/**
 * Crop an image file to the specified area using a canvas.
 * Returns a new File with the cropped content (JPEG for photos).
 */
export async function cropImageFile(file: File, crop: CropArea): Promise<File> {
  const imageBitmap = await createImageBitmap(file);

  const canvas = new OffscreenCanvas(crop.width, crop.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.drawImage(
    imageBitmap,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  imageBitmap.close();

  const blob = await canvas.convertToBlob({
    type: "image/jpeg",
    quality: 0.95,
  });
  return new File([blob], file.name, { type: "image/jpeg" });
}
