import { adminStorage } from "./admin";

export async function uploadFileToStorage(
  buffer: Buffer,
  destinationPath: string,
  contentType: string = "application/octet-stream"
): Promise<string> {
  try {
    const bucket = adminStorage.bucket();
    const file = bucket.file(destinationPath);

    await file.save(buffer, {
      metadata: { contentType },
      public: true,
    });

    return `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
  } catch (error) {
    console.error("[Firebase Storage] Upload error:", error);
    throw error;
  }
}
