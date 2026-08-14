const parseCsv = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parsePositiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
};

export const fileUploadConfig = {
  allowedExtensions: parseCsv(process.env.NEXT_PUBLIC_FILE_UPLOAD_ALLOWED_EXTENSIONS),
  blockedExtensions: parseCsv(process.env.NEXT_PUBLIC_FILE_UPLOAD_BLOCKED_EXTENSIONS),
  maxFilenameLength: parsePositiveInteger(process.env.NEXT_PUBLIC_FILE_UPLOAD_MAX_FILENAME_LENGTH, 255),
  maxSizeBytes: parsePositiveInteger(process.env.NEXT_PUBLIC_FILE_UPLOAD_MAX_SIZE_BYTES, 20 * 1024 * 1024),
} as const;
