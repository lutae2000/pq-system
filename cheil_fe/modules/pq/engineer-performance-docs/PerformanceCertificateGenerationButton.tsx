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

export function PerformanceCertificateGenerationButton({ disabled, engineerNames, filenamePrefix, label, onError, onSuccess, ...request }: Props) {
  const [generating, setGenerating] = useState(false);
  const handleClick = async () => {
    setGenerating(true);
    try {
      const engineerIds = request.engineerIds ?? [];
      const requests = engineerIds.length > 0
        ? engineerIds.map((engineerId) => ({ ...request, engineerIds: [engineerId] }))
        : [request];
      const safePrefix = filenamePrefix?.trim().replace(/[\\/:*?"<>|]/g, "_");
      const baseFilename = request.includeParticipantList
        ? "\uC2E4\uC801\uC99D\uBA85\uC11C_\uCC38\uC5EC\uC790\uBA85\uB2E8.hwpx"
        : "\uC2E4\uC801\uC99D\uBA85\uC11C.hwpx";

      if (engineerIds.length > 0) {
        const blob = await generatePerformanceCertificateBatch({ ...request, engineerNames });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = safePrefix ? `${safePrefix}_\uC2E4\uC801\uC99D\uBA85\uC11C.zip` : "\uC2E4\uC801\uC99D\uBA85\uC11C.zip";
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
      onSuccess?.(engineerIds.length > 0
        ? "\uCCA8\uBD80\uD30C\uC77C\uC774 \uC788\uB294 \uAE30\uC220\uC778\uBCC4 \uC2E4\uC801\uC99D\uBA85\uC11C\uB97C ZIP\uC73C\uB85C \uB2E4\uC6B4\uB85C\uB4DC\uD588\uC2B5\uB2C8\uB2E4."
        : `${requests.length}\uAC1C\uC758 \uC2E4\uC801\uC99D\uBA85\uC11C\uB97C \uB2E4\uC6B4\uB85C\uB4DC\uD588\uC2B5\uB2C8\uB2E4.`);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "\uC2E4\uC801\uC99D\uBA85\uC11C \uC0DD\uC131\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    } finally {
      setGenerating(false);
    }
  };
  return <Button disabled={disabled || generating} onClick={() => void handleClick()} startIcon={<DownloadOutlinedIcon />} sx={{ minWidth: label ? 230 : 150, whiteSpace: "nowrap" }} variant="contained">{generating ? "\uC0DD\uC131 \uC911..." : label ?? "\uC2E4\uC801\uC99D\uBA85\uC11C \uC0DD\uC131"}</Button>;
}
