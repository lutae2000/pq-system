"use client";

import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { Button, CircularProgress } from "@mui/material";
import { useState } from "react";

import type { PerformanceCertificateGenerateRequest } from "./hwpxApi";
import { generatePerformanceCertificate, generatePerformanceCertificateBatch } from "./hwpxApi";

type Props = PerformanceCertificateGenerateRequest & {
  disabled?: boolean;
  engineerNames?: Record<string, string>;
  filenamePrefix?: string;
  label?: string;
  onGeneratingChange?: (generating: boolean) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  onWarning?: (message: string) => void;
};

export function PerformanceCertificateGenerationButton({
  disabled,
  engineerNames,
  filenamePrefix,
  label,
  onGeneratingChange,
  onError,
  onSuccess,
  onWarning,
  ...request
}: Props) {
  const [generating, setGenerating] = useState(false);

  const handleClick = async () => {
    setGenerating(true);
    onGeneratingChange?.(true);

    try {
      const isBatch = Boolean(request.engineerIds?.length);
      const { blob, documentCount, failedAttachmentCount } = isBatch
        ? await generatePerformanceCertificateBatch({ ...request, engineerNames })
        : await generatePerformanceCertificate(request);
      const safePrefix = filenamePrefix?.trim().replace(/[\\/:*?"<>|]/g, "_");
      const basename = !isBatch && request.includeParticipantList ? "실적증명서_참여자명단" : "실적증명서";
      const extension = isBatch || blob.type === "application/zip" ? "zip" : "hwpx";
      const filename = `${basename}.${extension}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = safePrefix ? `${safePrefix}_${filename}` : filename;
      anchor.click();
      URL.revokeObjectURL(url);

      if (failedAttachmentCount > 0) {
        const resultMessage = documentCount === 0
          ? "생성할 수 있는 실적증명서가 없어 오류 목록을 다운로드했습니다."
          : `첨부파일 ${failedAttachmentCount}건을 제외하고 실적증명서를 다운로드했습니다.`;
        (onWarning ?? onSuccess)?.(`${resultMessage} ZIP 안의 첨부파일_변환_오류.txt를 확인해 주세요.`);
        return;
      }
      onSuccess?.(
        isBatch
          ? "첨부파일이 있는 기술인별 실적증명서를 ZIP으로 다운로드했습니다."
          : "실적증명서를 다운로드했습니다.",
      );
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "실적증명서 생성에 실패했습니다.");
    } finally {
      setGenerating(false);
      onGeneratingChange?.(false);
    }
  };

  return (
    <Button
      disabled={disabled || generating}
      onClick={() => void handleClick()}
      startIcon={generating ? <CircularProgress color="inherit" size={18} /> : <DownloadOutlinedIcon />}
      sx={{ minWidth: label ? 230 : 150, whiteSpace: "nowrap" }}
      variant="contained"
    >
      {generating ? "생성 중..." : label ?? "실적증명서"}
    </Button>
  );
}
