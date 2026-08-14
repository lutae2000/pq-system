"use client";

import { Card, type CardProps, type SxProps, type Theme } from "@mui/material";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";

import { ResizeHandle } from "@/components/common/ResizeHandle";

export type ResizableCardEdge = "left" | "right" | "bottom";

type ResizableCardProps = Omit<CardProps, "children"> & {
  children: ReactNode;
  height?: number;
  maxHeight?: number;
  maxWidth?: number;
  minHeight?: number;
  minWidth?: number;
  onHeightChange?: (nextHeight: number) => void;
  onWidthChange?: (nextWidth: number) => void;
  resizeEdges?: ResizableCardEdge[];
  width?: number;
  handleSx?: SxProps<Theme>;
};

const DEFAULT_WIDTH_STEP = 20;
const DEFAULT_HEIGHT_STEP = 10;

function clampSize(nextSize: number, minSize?: number, maxSize?: number) {
  let size = Math.round(nextSize);
  if (typeof minSize === "number") {
    size = Math.max(size, minSize);
  }
  if (typeof maxSize === "number") {
    size = Math.min(size, maxSize);
  }
  return size;
}

function createResizeKeyHandler(
  edge: ResizableCardEdge,
  onWidthChange?: (nextWidth: number) => void,
  onHeightChange?: (nextHeight: number) => void,
  width?: number,
  height?: number,
  minWidth?: number,
  maxWidth?: number,
  minHeight?: number,
  maxHeight?: number,
) {
  return (event: KeyboardEvent<HTMLDivElement>) => {
    const widthStep = event.shiftKey ? DEFAULT_WIDTH_STEP * 2 : DEFAULT_WIDTH_STEP;
    const heightStep = event.shiftKey ? DEFAULT_HEIGHT_STEP * 2 : DEFAULT_HEIGHT_STEP;

    if (edge === "bottom") {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        onHeightChange?.(clampSize((height ?? 0) + heightStep, minHeight, maxHeight));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        onHeightChange?.(clampSize((height ?? 0) - heightStep, minHeight, maxHeight));
      }
      return;
    }

    if (edge === "left") {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onWidthChange?.(clampSize((width ?? 0) + widthStep, minWidth, maxWidth));
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onWidthChange?.(clampSize((width ?? 0) - widthStep, minWidth, maxWidth));
      }
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      onWidthChange?.(clampSize((width ?? 0) + widthStep, minWidth, maxWidth));
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onWidthChange?.(clampSize((width ?? 0) - widthStep, minWidth, maxWidth));
    }
  };
}

function createResizePointerHandler(
  edge: ResizableCardEdge,
  onWidthChange?: (nextWidth: number) => void,
  onHeightChange?: (nextHeight: number) => void,
  width?: number,
  height?: number,
  minWidth?: number,
  maxWidth?: number,
  minHeight?: number,
  maxHeight?: number,
) {
  return (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = width ?? 0;
    const startHeight = height ?? 0;

    const abortController = new AbortController();
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = edge === "bottom" ? "ns-resize" : "col-resize";
    document.body.style.userSelect = "none";

    const stopResize = () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      abortController.abort();
    };

    window.addEventListener(
      "pointermove",
      (moveEvent) => {
        if (edge === "bottom") {
          const deltaY = moveEvent.clientY - startY;
          onHeightChange?.(clampSize(startHeight + deltaY, minHeight, maxHeight));
          return;
        }

        const deltaX = moveEvent.clientX - startX;
        const nextWidth = edge === "left" ? startWidth - deltaX : startWidth + deltaX;
        onWidthChange?.(clampSize(nextWidth, minWidth, maxWidth));
      },
      { signal: abortController.signal },
    );
    window.addEventListener("pointerup", stopResize, { once: true, signal: abortController.signal });
    window.addEventListener("pointercancel", stopResize, { once: true, signal: abortController.signal });
  };
}

export function ResizableCard({
  children,
  height,
  handleSx,
  maxHeight,
  maxWidth,
  minHeight,
  minWidth,
  onHeightChange,
  onWidthChange,
  resizeEdges = ["right"],
  sx,
  width,
  ...cardProps
}: ResizableCardProps) {
  return (
    <Card
      {...cardProps}
      sx={[
        {
          minHeight: 0,
          minWidth: 0,
          position: "relative",
          width,
          height,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}

      {resizeEdges.includes("left") ? (
        <ResizeHandle
          ariaLabel="Resize card width"
          orientation="vertical"
          onKeyDown={createResizeKeyHandler(
            "left",
            onWidthChange,
            onHeightChange,
            width,
            height,
            minWidth,
            maxWidth,
            minHeight,
            maxHeight,
          )}
          onPointerDown={createResizePointerHandler(
            "left",
            onWidthChange,
            onHeightChange,
            width,
            height,
            minWidth,
            maxWidth,
            minHeight,
            maxHeight,
          )}
          sx={[{ display: { xs: "none", lg: "flex" }, left: -14, right: "auto" }, ...(Array.isArray(handleSx) ? handleSx : handleSx ? [handleSx] : [])]}
        />
      ) : null}

      {resizeEdges.includes("right") ? (
        <ResizeHandle
          ariaLabel="Resize card width"
          orientation="vertical"
          onKeyDown={createResizeKeyHandler(
            "right",
            onWidthChange,
            onHeightChange,
            width,
            height,
            minWidth,
            maxWidth,
            minHeight,
            maxHeight,
          )}
          onPointerDown={createResizePointerHandler(
            "right",
            onWidthChange,
            onHeightChange,
            width,
            height,
            minWidth,
            maxWidth,
            minHeight,
            maxHeight,
          )}
          sx={[{ display: { xs: "none", lg: "flex" } }, ...(Array.isArray(handleSx) ? handleSx : handleSx ? [handleSx] : [])]}
        />
      ) : null}

      {resizeEdges.includes("bottom") ? (
        <ResizeHandle
          ariaLabel="Resize card height"
          orientation="horizontal"
          onKeyDown={createResizeKeyHandler(
            "bottom",
            onWidthChange,
            onHeightChange,
            width,
            height,
            minWidth,
            maxWidth,
            minHeight,
            maxHeight,
          )}
          onPointerDown={createResizePointerHandler(
            "bottom",
            onWidthChange,
            onHeightChange,
            width,
            height,
            minWidth,
            maxWidth,
            minHeight,
            maxHeight,
          )}
          sx={[{ display: { xs: "none", lg: "flex" } }, ...(Array.isArray(handleSx) ? handleSx : handleSx ? [handleSx] : [])]}
        />
      ) : null}
    </Card>
  );
}
