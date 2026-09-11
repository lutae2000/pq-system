"use client";

import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { Button } from "@mui/material";
import { useState } from "react";

import type { PerformanceCertificateGenerateRequest } from "./hwpxApi";
import { generatePerformanceCertificate, generatePerformanceCertificateBatch } from "./hwpxApi";

type Props = PerformanceCertificateGenerateRequest & {
  disabled?: boolean;
  engineerNames?: Record<string, string>;
  filenamePrefix?: string;
  label?: string;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
};

export function PerformanceCertificateGenerationButton({
  disabled,
  engineerNames,
  filenamePrefix,
  label,
  onError,
  onSuccess,
  ...request
}: Props) {
  const [generating, setGenerating] = useState(false);

  const handleClick = async () => {
    setGenerating(true);

    try {
      const engineerIds = request.engineerIds ?? [];
      const requests = engineerIds.length > 0
        ? engineerIds.map((engineerId) => ({
            ...request,
            engineerIds: [engineerId],
          }))
        : [request];
      const safePrefix = filenamePrefix?.trim().replace(/[\\/:*?"<>|]/g, "_");
      const baseFilename = request.includeParticipantList
        ? "실적증명서_참여자명단.hwpx"
        : "실적증명서.hwpx";

      if (engineerIds.length > 0) {
        const blob = await generatePerformanceCertificateBatch({ ...request, engineerNames });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = safePrefix ? `${safePrefix}_실적증명서.zip` : "실적증명서.zip";
        anchor.click();
        URL.revokeObjectURL(url);
      } else {
        for (const [index, generationRequest] of requests.entries()) {
          const blob = await generatePerformanceCertificate(generationRequest);
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          const engineerId = generationRequest.engineerIds?.[0];
          const engineerName = engineerId ? engineerNames?.[engineerId]?.trim() : "";
          const personPrefix = engineerName || (engineerIds.length > 1 ? engineerId : "");
          const filename = personPrefix ? `${personPrefix}_${baseFilename}` : baseFilename;
          anchor.download = safePrefix ? `${safePrefix}_${filename}` : filename;
          anchor.click();
          URL.revokeObjectURL(url);
          if (index < requests.length - 1) {
            await new Promise<void>((resolve) => window.setTimeout(resolve, 100));
          }
        }
      }
      onSuccess?.(
        engineerIds.length > 0
          ? "첨부파일이 있는 기술인별 실적증명서를 ZIP으로 다운로드했습니다."
          : `${requests.length}개의 실적증명서를 다운로드했습니다.`,
      );
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "실적증명서 생성에 실패했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      disabled={disabled || generating}
      onClick={() => void handleClick()}
      startIcon={<DownloadOutlinedIcon />}
      sx={{ minWidth: label ? 230 : 150, whiteSpace: "nowrap" }}
      variant="contained"
    >
      {generating ? "생성 중..." : label ?? "실적증명서"}
    </Button>
  );
}
