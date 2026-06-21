import * as ImageManipulator from "expo-image-manipulator";

const TARGET_MAX_BYTES = 150 * 1024;
const INITIAL_WIDTH = 960;

export interface CompressedWebpImage {
  uri: string;
  width: number;
  height: number;
  sizeBytes: number;
}

async function estimateSizeBytes(uri: string): Promise<number> {
  const response = await fetch(uri);
  const buffer = await response.arrayBuffer();
  return buffer.byteLength;
}

export async function compressImageToWebp(
  sourceUri: string,
): Promise<CompressedWebpImage> {
  let width = INITIAL_WIDTH;
  let quality = 0.82;
  let result = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width } }],
    {
      compress: quality,
      format: ImageManipulator.SaveFormat.WEBP,
    },
  );

  let sizeBytes = await estimateSizeBytes(result.uri);

  while (sizeBytes > TARGET_MAX_BYTES && quality > 0.35) {
    quality -= 0.08;
    width = Math.max(480, Math.floor(width * 0.85));

    result = await ImageManipulator.manipulateAsync(
      sourceUri,
      [{ resize: { width } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.WEBP,
      },
    );

    sizeBytes = await estimateSizeBytes(result.uri);
  }

  if (sizeBytes > TARGET_MAX_BYTES) {
    throw new Error("Unable to compress image below 150KB. Try another photo.");
  }

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    sizeBytes,
  };
}
