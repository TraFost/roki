import type { ScreenCapture } from '@roki/shared';

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.8;

export function processScreenCapture(capture: ScreenCapture): ScreenCapture {
  return capture;
}

export function resizeAndCompress(
  imageData: Uint8Array,
  width: number,
  height: number,
): { data: Uint8Array; width: number; height: number } {
  const maxDim = Math.max(width, height);
  if (maxDim <= MAX_DIMENSION) {
    return { data: imageData, width, height };
  }

  const scale = MAX_DIMENSION / maxDim;
  return {
    data: imageData,
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export function detectMimeType(data: Uint8Array): string {
  if (data.length >= 4) {
    const pngSig = [0x89, 0x50, 0x4e, 0x47];
    const jpegSig = [0xff, 0xd8, 0xff];
    const firstBytes = Array.from(data.slice(0, 4));

    if (firstBytes.slice(0, 4).every((b, i) => b === pngSig[i])) return 'image/png';
    if (firstBytes.slice(0, 3).every((b, i) => b === jpegSig[i])) return 'image/jpeg';
  }
  return 'application/octet-stream';
}
