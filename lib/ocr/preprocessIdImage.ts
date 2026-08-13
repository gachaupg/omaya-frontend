/** Prepare ID photos for tesseract — crop text area, upscale, boost contrast. */
export async function preprocessIdImageForOcr(file: File): Promise<Blob[]> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const variants: Blob[] = [];

    variants.push(await renderProcessedImage(image, { cropTextRegion: false, threshold: false }));
    variants.push(await renderProcessedImage(image, { cropTextRegion: true, threshold: false }));
    variants.push(await renderProcessedImage(image, { cropTextRegion: true, threshold: true }));
    variants.push(await renderProcessedImage(image, { cropTextRegion: false, threshold: true }));

    return variants;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

type RenderOptions = {
  /** Crop to the text panel (skip photo on left, logo margin on right). */
  cropTextRegion: boolean;
  threshold: boolean;
};

async function renderProcessedImage(
  image: HTMLImageElement,
  options: RenderOptions
): Promise<Blob> {
  const isLandscape = image.width >= image.height * 1.05;
  const cropX =
    options.cropTextRegion && isLandscape ? image.width * 0.22 : 0;
  const cropY = 0;
  const cropW =
    options.cropTextRegion && isLandscape
      ? image.width * 0.68
      : image.width;
  const cropH = image.height;

  const scale = Math.max(2, Math.min(3, 2600 / Math.max(cropW, cropH)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cropW * scale);
  canvas.height = Math.round(cropH * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

    gray = (gray - 128) * 1.35 + 128;
    gray = Math.max(0, Math.min(255, gray));

    if (options.threshold) {
      gray = gray < 145 ? 0 : 255;
    }

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode image"))),
      "image/png"
    );
  });
}
