"use client";

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Box, Button, Checkbox, CircularProgress, IconButton, LinearProgress, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";

import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import { fileUploadConfig } from "@/lib/config/fileUpload";
import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";
import {
  createFileAttachment,
  deleteFileAttachment,
  listFileAttachments,
  type FileAttachmentTarget,
} from "@/modules/common/files/api";

export type FileActionCardFileItem = {
  attachmentId?: number;
  contentType?: string;
  downloadUrl?: string;
  fileId?: string;
  fileName: string;
  size?: number;
};

type UploadedFileResponse = {
  contentType: string;
  downloadUrl: string;
  fileId: string;
  originalFilename: string;
  size: number;
};

export type FileActionCardFile = string | FileActionCardFileItem;

export type FileActionCardProps = {
  allowedExtensions?: readonly string[];
  attachmentTarget?: FileAttachmentTarget;
  blockedExtensions?: readonly string[];
  checked?: boolean;
  deleteDisabled?: boolean;
  description?: string;
  files?: FileActionCardFile[];
  maxFilenameLength?: number;
  maxSizeBytes?: number;
  onCheckedChange?: (checked: boolean) => void;
  onDeleteFile?: (fileName: string) => void;
  onFileClick?: (fileName: string, file?: FileActionCardFile) => void;
  onFilesSelected?: (files: File[]) => void;
  onUploadError?: (message: string) => void;
  onUpload?: () => void;
  onUploadComplete?: (file: FileActionCardFileItem) => void;
  title: ReactNode;
  multiple?: boolean;
  showPdfPrintButton?: boolean;
  uploadEndpoint?: string;
  uploadDisabled?: boolean;
  uploadLabel?: string;
};

const DEFAULT_UPLOAD_ENDPOINT = "/files";

export function FileActionCard({
  allowedExtensions = fileUploadConfig.allowedExtensions,
  attachmentTarget,
  blockedExtensions = fileUploadConfig.blockedExtensions,
  checked,
  deleteDisabled = false,
  description = "No attached files.",
  files = [],
  maxFilenameLength = fileUploadConfig.maxFilenameLength,
  maxSizeBytes = fileUploadConfig.maxSizeBytes,
  onCheckedChange,
  onDeleteFile,
  onFileClick,
  onFilesSelected,
  onUploadError,
  onUpload,
  onUploadComplete,
  title,
  multiple = false,
  showPdfPrintButton = false,
  uploadEndpoint = DEFAULT_UPLOAD_ENDPOINT,
  uploadDisabled = false,
  uploadLabel = "Upload",
}: FileActionCardProps) {
  const tabQueryEnabled = useTabQueryEnabled(Boolean(attachmentTarget?.ownerType && attachmentTarget?.ownerId));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const [localFiles, setLocalFiles] = useState<FileActionCardFile[]>(files);
  const [pendingDeleteFile, setPendingDeleteFile] = useState<FileActionCardFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const accept = allowedExtensions.length > 0 ? allowedExtensions.map((extension) => `.${normalizeExtension(extension)}`).join(",") : undefined;
  const attachmentQueryKey = attachmentTarget
    ? ["file-attachments", attachmentTarget.ownerType, String(attachmentTarget.ownerId)]
    : null;
  const attachmentsQuery = useQuery({
    queryKey: attachmentQueryKey ?? ["file-attachments", "disabled"],
    queryFn: () => listFileAttachments(attachmentTarget!),
    enabled: tabQueryEnabled,
  });

  useEffect(() => {
    if (attachmentTarget) {
      return;
    }
    const timeoutId = window.setTimeout(() => setLocalFiles(files), 0);
    return () => window.clearTimeout(timeoutId);
  }, [attachmentTarget, files]);

  useEffect(() => {
    if (!attachmentTarget || !attachmentsQuery.data) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setLocalFiles(
        attachmentsQuery.data
          .filter((attachment) => attachment.attachmentType === attachmentTarget.attachmentType)
          .map((attachment) => ({
            attachmentId: attachment.attachmentId,
            contentType: attachment.contentType ?? undefined,
            downloadUrl: attachment.downloadUrl,
            fileId: attachment.fileId,
            fileName: attachment.originalFilename,
            size: attachment.fileSize,
          })),
      );
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [attachmentTarget, attachmentsQuery.data]);

  const attachmentCreateMutation = useMutation({
    mutationFn: (file: FileActionCardFileItem) =>
      createFileAttachment({
        attachmentType: attachmentTarget?.attachmentType ?? "",
        contentType: file.contentType ?? null,
        downloadUrl: file.downloadUrl ?? (file.fileId ? `/api/files/${file.fileId}` : ""),
        fileId: file.fileId ?? "",
        fileSize: file.size ?? 0,
        originalFilename: file.fileName,
        ownerId: String(attachmentTarget?.ownerId ?? ""),
        ownerType: attachmentTarget?.ownerType ?? "",
      }),
    onSuccess: (attachment) => {
      const nextFile: FileActionCardFileItem = {
        attachmentId: attachment.attachmentId,
        contentType: attachment.contentType ?? undefined,
        downloadUrl: attachment.downloadUrl,
        fileId: attachment.fileId,
        fileName: attachment.originalFilename,
        size: attachment.fileSize,
      };
      setLocalFiles((current) => [nextFile, ...current]);
      if (attachmentQueryKey) {
        queryClient.invalidateQueries({ queryKey: attachmentQueryKey });
      }
      onUploadComplete?.(nextFile);
    },
  });

  const attachmentDeleteMutation = useMutation({
    mutationFn: (attachmentId: number) => deleteFileAttachment(attachmentId),
    onSuccess: (_data, attachmentId) => {
      setLocalFiles((current) =>
        current.filter((file) => typeof file === "string" || file.attachmentId !== attachmentId),
      );
      if (attachmentQueryKey) {
        queryClient.invalidateQueries({ queryKey: attachmentQueryKey });
      }
    },
  });

  const openFilePicker = () => {
    if (uploadDisabled || uploading) {
      return;
    }

    if (onUpload) {
      onUpload();
      return;
    }

    inputRef.current?.click();
  };

  const uploadFile = async (file: File) => {
    const validationError = validateSelectedFile(file, {
      allowedExtensions,
      blockedExtensions,
      maxFilenameLength,
      maxSizeBytes,
    });
    if (validationError) {
      throw new Error(validationError);
    }

    const formData = new FormData();
    formData.append("file", file);
    if (attachmentTarget) {
      formData.append("ownerType", attachmentTarget.ownerType);
      formData.append("ownerId", String(attachmentTarget.ownerId));
      formData.append("attachmentType", attachmentTarget.attachmentType);
    }

    const uploaded = await uploadFormData(resolveApiEndpoint(uploadEndpoint), formData);
    const nextFile: FileActionCardFileItem = {
      contentType: uploaded.contentType,
      downloadUrl: normalizeDownloadUrl(uploaded.downloadUrl),
      fileId: uploaded.fileId,
      fileName: uploaded.originalFilename,
      size: uploaded.size,
    };

    if (attachmentTarget) {
      await attachmentCreateMutation.mutateAsync(nextFile);
      return;
    }

    setLocalFiles((current) => [...current, nextFile]);
    onUploadComplete?.(nextFile);
  };

  const handleUploadChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    if (onFilesSelected) {
      const validationError = selectedFiles.map((file) =>
        validateSelectedFile(file, {
          allowedExtensions,
          blockedExtensions,
          maxFilenameLength,
          maxSizeBytes,
        }),
      ).find(Boolean);
      if (validationError) {
        setUploadError(validationError);
        onUploadError?.(validationError);
        return;
      }
      onFilesSelected(selectedFiles);
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      await Promise.all(selectedFiles.map((file) => uploadFile(file)));
    } catch (error) {
      const message = error instanceof Error ? error.message : "업로드에 실패했습니다.";
      setUploadError(message);
      onUploadError?.(message);
    } finally {
      setUploading(false);
    }
  };

  const resolveFileName = (file: FileActionCardFile) => (typeof file === "string" ? file : file.fileName);

  const resolveDownloadUrl = (file: FileActionCardFile) => {
    if (typeof file === "string") {
      return null;
    }

    if (file.downloadUrl) {
      return normalizeDownloadUrl(file.downloadUrl);
    }

    if (file.fileId) {
      return `/api/files/${file.fileId}`;
    }

    return null;
  };

  const isPdfFile = (file: FileActionCardFile) => {
    if (typeof file !== "string" && file.contentType?.toLowerCase().includes("pdf")) {
      return true;
    }
    return resolveFileName(file).toLowerCase().endsWith(".pdf");
  };

  const handleFileClick = async (file: FileActionCardFile) => {
    const fileName = resolveFileName(file);

    if (onFileClick) {
      onFileClick(fileName, file);
      return;
    }

    const downloadUrl = resolveDownloadUrl(file);
    if (!downloadUrl) {
      return;
    }

    if (isBrowserObjectUrl(downloadUrl)) {
      triggerDownload(downloadUrl, fileName);
      return;
    }

    try {
      await downloadFromUrl(downloadUrl, fileName);
    } catch (error) {
      const message = error instanceof Error ? error.message : "파일을 다운로드하지 못했습니다.";
      setUploadError(message);
      onUploadError?.(message);
    }
  };

  const triggerDownload = (downloadUrl: string, fileName: string) => {
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = fileName;
    anchor.rel = "noreferrer";
    anchor.target = "_self";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handlePrintPdfFile = async (file: FileActionCardFile) => {
    const downloadUrl = resolveDownloadUrl(file);
    if (!downloadUrl) {
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      const message = "브라우저 팝업 차단으로 PDF 인쇄창을 열지 못했습니다.";
      setUploadError(message);
      onUploadError?.(message);
      return;
    }

    let objectUrl = downloadUrl;
    let revokeObjectUrl = false;

    try {
      if (!isBrowserObjectUrl(downloadUrl)) {
        const { blob } = await fetchFileBlob(downloadUrl, "PDF 파일을 열지 못했습니다.");
        objectUrl = URL.createObjectURL(blob);
        revokeObjectUrl = true;
      }

      printWindow.location.href = objectUrl;
      const printPdf = () => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          // Some browser PDF viewers block scripted print. The PDF tab remains open for manual print.
        }
      };
      printWindow.addEventListener("load", printPdf, { once: true });
      window.setTimeout(printPdf, 800);

      if (revokeObjectUrl) {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      }
    } catch (error) {
      printWindow.close();
      const message = error instanceof Error ? error.message : "PDF 파일을 인쇄하지 못했습니다.";
      setUploadError(message);
      onUploadError?.(message);
    }
  };

  const requestDeleteFile = (file: FileActionCardFile) => {
    setPendingDeleteFile(file);
  };

  const closeDeleteDialog = () => {
    if (attachmentDeleteMutation.isPending) {
      return;
    }
    setPendingDeleteFile(null);
  };

  const confirmDeleteFile = async () => {
    if (!pendingDeleteFile) {
      return;
    }

    const file = pendingDeleteFile;
    const fileName = resolveFileName(file);
    if (attachmentTarget && typeof file !== "string" && file.attachmentId) {
      await attachmentDeleteMutation.mutateAsync(file.attachmentId);
      onDeleteFile?.(fileName);
      setPendingDeleteFile(null);
      return;
    }
    onDeleteFile?.(fileName);
    setPendingDeleteFile(null);
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        bgcolor: "background.paper",
        boxShadow: "none",
        p: 1.25,
      }}
    >
      <Stack spacing={1}>
        <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ alignItems: "center", display: "flex", gap: 0.5, minWidth: 0 }}>
            {typeof checked === "boolean" || onCheckedChange ? (
              <Checkbox
                checked={Boolean(checked)}
                onChange={(event) => onCheckedChange?.(event.target.checked)}
                size="small"
                sx={{ p: 0, color: "text.secondary", "&.Mui-checked": { color: "primary.main" } }}
              />
            ) : null}
            <Typography noWrap sx={{ color: "text.primary", fontSize: 13, fontWeight: 800 }}>
              {title}
            </Typography>
          </Box>

          <Button
            disabled={uploading || uploadDisabled || attachmentsQuery.isFetching || attachmentCreateMutation.isPending}
            onClick={openFilePicker}
            size="small"
            startIcon={uploading ? <CircularProgress color="inherit" size={14} /> : <UploadFileOutlinedIcon />}
            sx={{ minWidth: 92, px: 1.25 }}
            variant="outlined"
          >
            {uploading || attachmentCreateMutation.isPending ? "Uploading" : uploadLabel}
          </Button>
          <input accept={accept} ref={inputRef} hidden multiple={multiple} onChange={handleUploadChange} type="file" />
        </Box>

        {uploading || attachmentCreateMutation.isPending ? (
          <Box sx={{ display: "grid", gap: 0.5 }}>
            <LinearProgress />
            <Typography color="text.secondary" variant="caption">
              파일을 업로드하고 있습니다.
            </Typography>
          </Box>
        ) : null}

        <Box
          sx={{
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 1.25,
            bgcolor: "background.default",
            minHeight: 74,
            p: 1,
          }}
        >
          <Stack spacing={0.75}>
            {localFiles.length > 0 ? (
              localFiles.map((file) => {
                const fileName = resolveFileName(file);
                return (
                  <Box
                    key={typeof file === "string" ? file : file.fileId ?? file.fileName}
                    sx={{
                      alignItems: "center",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      bgcolor: "background.paper",
                      display: "flex",
                      gap: 1,
                      justifyContent: "space-between",
                      px: 1,
                      py: 0.5,
                    }}
                  >
                    <Button
                      onClick={() => void handleFileClick(file)}
                      size="small"
                      startIcon={<InsertDriveFileOutlinedIcon />}
                      sx={{
                        color: "text.primary",
                        justifyContent: "flex-start",
                        minWidth: 0,
                        px: 0.5,
                        textTransform: "none",
                        width: "100%",
                      }}
                      variant="text"
                    >
                      <Box sx={{ minWidth: 0, textAlign: "left", width: "100%" }}>
                        <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>
                          {fileName}
                        </Typography>
                        {typeof file !== "string" && typeof file.size === "number" ? (
                          <Typography noWrap sx={{ color: "text.secondary", fontSize: 11 }}>
                            {formatFileSize(file.size)}
                          </Typography>
                        ) : null}
                      </Box>
                    </Button>

                    <Box sx={{ alignItems: "center", display: "flex", gap: 0.25, flex: "0 0 auto" }}>
                      {showPdfPrintButton && isPdfFile(file) && resolveDownloadUrl(file) ? (
                        <IconButton
                          aria-label={`print ${fileName}`}
                          onClick={() => void handlePrintPdfFile(file)}
                          size="small"
                        >
                          <PrintOutlinedIcon fontSize="small" />
                        </IconButton>
                      ) : null}
                      {onDeleteFile || attachmentTarget ? (
                        <IconButton
                          aria-label={`delete ${fileName}`}
                          disabled={deleteDisabled || attachmentDeleteMutation.isPending}
                          onClick={() => requestDeleteFile(file)}
                          size="small"
                        >
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      ) : null}
                    </Box>
                  </Box>
                );
              })
            ) : (
              <Typography color="text.secondary" sx={{ py: 0.5 }} variant="body2">
                {description}
              </Typography>
            )}
          </Stack>

          {uploadError ? (
            <Typography color="error" sx={{ mt: 1 }} variant="caption">
              {uploadError}
            </Typography>
          ) : null}
        </Box>
      </Stack>
      <ConfirmDeleteDialog
        cancelLabel="취소"
        loading={attachmentDeleteMutation.isPending}
        message="삭제하면 복구할 수 없습니다. 계속하시겠습니까?"
        onClose={closeDeleteDialog}
        onConfirm={() => void confirmDeleteFile()}
        open={Boolean(pendingDeleteFile)}
        targetLabel={pendingDeleteFile ? resolveFileName(pendingDeleteFile) : undefined}
        title="파일 삭제 확인"
      />
    </Box>
  );
}

function normalizeDownloadUrl(value: string) {
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) {
    return value;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/api/")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `/api${value}`;
  }

  return `/api/${value}`;
}

function resolveApiEndpoint(uploadEndpoint: string) {
  if (/^[a-z][a-z\d+.-]*:/i.test(uploadEndpoint)) {
    return uploadEndpoint;
  }

  if (uploadEndpoint.startsWith("/api/")) {
    return uploadEndpoint.slice(4);
  }

  return uploadEndpoint.startsWith("/") ? uploadEndpoint : `/${uploadEndpoint}`;
}

async function uploadFormData(endpoint: string, formData: FormData): Promise<UploadedFileResponse> {
  return apiRequest(apiClient.post<UploadedFileResponse>(endpoint, formData), "파일 업로드에 실패했습니다.");
}

async function downloadFromUrl(downloadUrl: string, fileName: string) {
  const { blob, filename } = await fetchFileBlob(downloadUrl, "파일을 다운로드하지 못했습니다.");
  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename || fileName;
    anchor.rel = "noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function fetchFileBlob(downloadUrl: string, fallbackMessage: string) {
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(await readResponseError(response, fallbackMessage));
  }

  return {
    blob: await response.blob(),
    filename: filenameFromContentDisposition(response.headers.get("content-disposition")),
  };
}

async function readResponseError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    if (body && typeof body === "object") {
      const errorBody = body as { detail?: string; error?: string; message?: string; title?: string };
      return errorBody.message ?? errorBody.detail ?? errorBody.error ?? errorBody.title ?? fallback;
    }
  } catch {
    // Ignore non-JSON error responses.
  }
  return fallback;
}

function isBrowserObjectUrl(value: string) {
  return value.startsWith("blob:") || value.startsWith("data:");
}

function filenameFromContentDisposition(value: string | null) {
  if (!value) {
    return "";
  }

  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const filenameMatch = value.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] ?? "";
}

function validateSelectedFile(
  file: File,
  options: {
    allowedExtensions: readonly string[];
    blockedExtensions: readonly string[];
    maxFilenameLength: number;
    maxSizeBytes: number;
  },
) {
  const filename = sanitizeFilename(file.name);
  if (!filename) {
    return "파일명이 필요합니다.";
  }
  if (file.size <= 0) {
    return "빈 파일은 업로드할 수 없습니다.";
  }
  if (filename.length > options.maxFilenameLength) {
    return `파일명은 ${options.maxFilenameLength}자 이하로 선택해 주세요.`;
  }
  if (file.size > options.maxSizeBytes) {
    return `파일 크기는 ${formatFileSize(options.maxSizeBytes)} 이하만 업로드할 수 있습니다.`;
  }

  const blockedExtensions = new Set(options.blockedExtensions.map(normalizeExtension).filter(Boolean));
  const fileExtensions = getFileExtensions(filename);
  if (fileExtensions.some((extension) => blockedExtensions.has(extension))) {
    return "업로드가 제한된 파일 형식입니다.";
  }

  const allowedExtensions = new Set(options.allowedExtensions.map(normalizeExtension).filter(Boolean));
  const finalExtension = fileExtensions.at(-1) ?? "";
  if (allowedExtensions.size > 0 && !allowedExtensions.has(finalExtension)) {
    return "허용되지 않은 파일 형식입니다.";
  }

  return null;
}

function sanitizeFilename(filename: string) {
  const cleaned = filename.replaceAll("\\", "/").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  const lastSlash = cleaned.lastIndexOf("/");
  return lastSlash >= 0 ? cleaned.slice(lastSlash + 1) : cleaned;
}

function getFileExtensions(filename: string) {
  const parts = filename.split(".");
  if (parts.length <= 1) {
    return [];
  }
  return parts.slice(1).map(normalizeExtension).filter(Boolean);
}

function normalizeExtension(extension: string) {
  return extension.trim().replace(/^\.+/, "").toLowerCase();
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
