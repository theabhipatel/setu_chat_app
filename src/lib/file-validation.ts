// Allowed MIME types for each upload context
const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
];

const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const CHAT_FILE_TYPES = [...IMAGE_TYPES, ...DOCUMENT_TYPES, ...VIDEO_TYPES];

// Size limits in bytes
const SIZE_LIMITS = {
  avatar: 1 * 1024 * 1024, // 1 MB
  chatFile: 5 * 1024 * 1024, // 5 MB
};

type UploadContext = "avatar" | "chatFile";

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a file before upload.
 * Returns { valid: true } or { valid: false, error: "..." }
 */
export function validateFile(
  file: File,
  context: UploadContext
): ValidationResult {
  // Size check
  const maxSize = SIZE_LIMITS[context];
  if (file.size > maxSize) {
    const limitMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File is too large. Maximum size is ${limitMB} MB`,
    };
  }

  // Type check
  const allowedTypes = context === "avatar" ? IMAGE_TYPES : CHAT_FILE_TYPES;

  if (!allowedTypes.includes(file.type)) {
    if (context === "avatar") {
      return {
        valid: false,
        error: "Only image files (JPEG, PNG, GIF, WebP) are allowed",
      };
    }
    return {
      valid: false,
      error:
        "This file type is not supported. Allowed: images, PDF, Word, Excel, PowerPoint, and videos (MP4, WebM)",
    };
  }

  return { valid: true };
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
