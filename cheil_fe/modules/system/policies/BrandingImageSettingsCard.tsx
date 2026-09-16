"use client";

import AspectRatioOutlinedIcon from "@mui/icons-material/AspectRatioOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PreviewOutlinedIcon from "@mui/icons-material/PreviewOutlined";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type RefObject, type SyntheticEvent } from "react";

import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { ConfirmActionDialog } from "@/components/common/ConfirmActionDialog";
import {
  applyDefaultBrandingImage,
  BRANDING_QUERY_KEY,
  DEFAULT_BRANDING_SETTINGS,
  type BrandingAssetType,
  type BrandingSettings,
  uploadBrandingImage,
} from "@/modules/system/branding/api";
import { useBrandingSettings } from "@/modules/system/branding/useBrandingSettings";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif"];

type ImageDimensions = {
  height: number;
  width: number;
};

type PendingImage = ImageDimensions & {
  assetType: BrandingAssetType;
  file: File;
  previewUrl: string;
};

type BrandingImageSettingsCardProps = {
  canUpdate: boolean;
  onUploaded: () => Promise<void>;
};

const assetDetails: Record<BrandingAssetType, {
  description: string;
  label: string;
  recommendedResolution: string;
}> = {
  "login-background": {
    description: "로그인 화면 전체에 채워지는 배경 이미지",
    label: "로그인 배경",
    recommendedResolution: "1920 × 1080 px 이상 · 가로형",
  },
  "company-logo": {
    description: "로그인 후 왼쪽 메뉴 상단에 표시되는 로고",
    label: "회사 로고",
    recommendedResolution: "420 × 72 px 이상 · 투명 배경 권장",
  },
  favicon: {
    description: "브라우저 탭과 즐겨찾기에 표시되는 아이콘",
    label: "파비콘",
    recommendedResolution: "512 × 512 px 권장 · 정사각형",
  },
};

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export function BrandingImageSettingsCard({ canUpdate, onUploaded }: BrandingImageSettingsCardProps) {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useAppSnackbar();
  const { settings } = useBrandingSettings();
  const [dimensions, setDimensions] = useState<Partial<Record<BrandingAssetType, ImageDimensions>>>({});
  const [unavailableAssets, setUnavailableAssets] = useState<Partial<Record<BrandingAssetType, boolean>>>({});
  const [draggingAsset, setDraggingAsset] = useState<BrandingAssetType | null>(null);
  const [pending, setPending] = useState<PendingImage | null>(null);
  const [previewAsset, setPreviewAsset] = useState<BrandingAssetType | null>(null);
  const [resetAsset, setResetAsset] = useState<BrandingAssetType | null>(null);
  const [resetting, setResetting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef<Record<BrandingAssetType, number>>({
    "company-logo": 0,
    favicon: 0,
    "login-background": 0,
  });
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (pending?.previewUrl) {
        URL.revokeObjectURL(pending.previewUrl);
      }
    };
  }, [pending]);

  const currentUrl = (assetType: BrandingAssetType) =>
    assetType === "login-background"
      ? settings.loginBackgroundUrl
      : assetType === "favicon"
        ? settings.faviconUrl
        : settings.companyLogoUrl;

  const fallbackUrl = (assetType: BrandingAssetType) =>
    assetType === "login-background"
      ? DEFAULT_BRANDING_SETTINGS.loginBackgroundUrl
      : assetType === "favicon"
        ? DEFAULT_BRANDING_SETTINGS.faviconUrl
        : DEFAULT_BRANDING_SETTINGS.companyLogoUrl;

  const isDefaultImage = (assetType: BrandingAssetType) =>
    currentUrl(assetType) === fallbackUrl(assetType) || unavailableAssets[assetType] === true;

  const rememberDimensions = (assetType: BrandingAssetType, event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    setDimensions((current) => ({
      ...current,
      [assetType]: { height: image.naturalHeight, width: image.naturalWidth },
    }));
  };

  const selectImage = (assetType: BrandingAssetType, file?: File) => {
    if (!file) {
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      showError("PNG, JPG, JPEG, GIF 이미지만 선택할 수 있습니다.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setPending({ assetType, file, height: image.naturalHeight, previewUrl, width: image.naturalWidth });
      setPreviewAsset(assetType);
    };
    image.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      showError("이미지를 읽을 수 없습니다. 다른 파일을 선택해 주세요.");
    };
    image.src = previewUrl;
  };

  const handleFileChange = (assetType: BrandingAssetType, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    selectImage(assetType, file);
  };

  const handleDrop = (assetType: BrandingAssetType, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current[assetType] = 0;
    setDraggingAsset(null);
    if (!canUpdate || uploading) {
      return;
    }
    selectImage(assetType, event.dataTransfer.files?.[0]);
  };

  const closePreview = () => {
    if (uploading) {
      return;
    }
    setPreviewAsset(null);
    setPending(null);
  };

  const upload = async () => {
    if (!pending) {
      return;
    }
    setUploading(true);
    try {
      const updated = await uploadBrandingImage(pending.assetType, pending.file);
      setUnavailableAssets((current) => ({ ...current, [pending.assetType]: false }));
      queryClient.setQueryData<BrandingSettings>(BRANDING_QUERY_KEY, updated);
      await onUploaded().catch(() => undefined);
      showSuccess(`${assetDetails[pending.assetType].label}을 변경했습니다.`);
      setPreviewAsset(null);
      setPending(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : "브랜딩 이미지를 변경하지 못했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const applyDefault = async () => {
    if (!resetAsset) {
      return;
    }
    setResetting(true);
    try {
      const updated = await applyDefaultBrandingImage(resetAsset);
      setUnavailableAssets((current) => ({ ...current, [resetAsset]: false }));
      setDimensions((current) => {
        const next = { ...current };
        delete next[resetAsset];
        return next;
      });
      queryClient.setQueryData<BrandingSettings>(BRANDING_QUERY_KEY, updated);
      await onUploaded().catch(() => undefined);
      showSuccess(resetAsset === "favicon" ? "파비콘을 기본 상태로 되돌렸습니다." : `${assetDetails[resetAsset].label}에 기본 이미지를 적용했습니다.`);
      setResetAsset(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : "기본 이미지를 적용하지 못했습니다.");
    } finally {
      setResetting(false);
    }
  };

  const renderAssetCard = (assetType: BrandingAssetType, inputRef: RefObject<HTMLInputElement | null>) => {
    const detail = assetDetails[assetType];
    const imageDimensions = dimensions[assetType];
    const isBackground = assetType === "login-background";
    const isFavicon = assetType === "favicon";
    const isDragging = draggingAsset === assetType;
    const displayedUrl = unavailableAssets[assetType] ? fallbackUrl(assetType) : currentUrl(assetType);
    const hasDisplayedImage = Boolean(displayedUrl);

    return (
      <Paper
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepthRef.current[assetType] += 1;
          if (canUpdate && dragDepthRef.current[assetType] === 1) {
            setDraggingAsset(assetType);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepthRef.current[assetType] = Math.max(0, dragDepthRef.current[assetType] - 1);
          if (dragDepthRef.current[assetType] === 0) {
            setDraggingAsset((current) => (current === assetType ? null : current));
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => handleDrop(assetType, event)}
        sx={{
          border: "1px solid",
          borderColor: isDragging ? "primary.main" : "divider",
          borderRadius: 2,
          boxShadow: isDragging ? "0 0 0 3px rgba(37, 99, 235, 0.10)" : "0 6px 20px rgba(15, 23, 42, 0.05)",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          transition: "border-color 150ms ease, box-shadow 150ms ease",
        }}
        variant="outlined"
      >
        <Box
          sx={{
            alignItems: "center",
            bgcolor: isBackground ? "grey.100" : "#172033",
            display: "flex",
            height: 150,
            justifyContent: "center",
            overflow: "hidden",
            p: isBackground ? 0 : isFavicon ? 4 : 3,
            position: "relative",
          }}
        >
          {hasDisplayedImage ? (
            <Box
              alt={`${detail.label} 현재 이미지`}
              component="img"
              onError={(event: SyntheticEvent<HTMLImageElement>) => {
                if (currentUrl(assetType) !== fallbackUrl(assetType)) {
                  setUnavailableAssets((current) => ({ ...current, [assetType]: true }));
                  if (fallbackUrl(assetType)) {
                    event.currentTarget.src = fallbackUrl(assetType);
                  }
                }
              }}
              onLoad={(event: SyntheticEvent<HTMLImageElement>) => rememberDimensions(assetType, event)}
              src={displayedUrl}
              sx={{ height: "100%", objectFit: isBackground ? "cover" : "contain", width: "100%" }}
            />
          ) : (
            <Stack spacing={1} sx={{ alignItems: "center", color: "rgba(255,255,255,0.72)" }}>
              <ImageOutlinedIcon sx={{ fontSize: 42 }} />
              <Typography variant="body2">등록된 파비콘이 없습니다.</Typography>
            </Stack>
          )}
          <Chip
            icon={<CheckCircleRoundedIcon />}
            label={!hasDisplayedImage && isFavicon ? "등록된 이미지 없음" : isDefaultImage(assetType) ? "기본 이미지 적용 중" : "사용자 이미지 적용 중"}
            size="small"
            sx={{
              bgcolor: isDefaultImage(assetType) ? "rgba(255,255,255,0.94)" : "rgba(236,253,245,0.96)",
              border: "1px solid",
              borderColor: isDefaultImage(assetType) ? "rgba(100,116,139,0.28)" : "rgba(22,163,74,0.35)",
              color: isDefaultImage(assetType) ? "text.primary" : "success.dark",
              fontWeight: 750,
              left: 12,
              position: "absolute",
              top: 12,
              "& .MuiChip-icon": { color: isDefaultImage(assetType) ? "text.secondary" : "success.main" },
            }}
          />
          {isDragging ? (
            <Box
              sx={{
                alignItems: "center",
                bgcolor: "rgba(37, 99, 235, 0.88)",
                color: "white",
                display: "flex",
                flexDirection: "column",
                inset: 0,
                justifyContent: "center",
                pointerEvents: "none",
                position: "absolute",
              }}
            >
              <CloudUploadOutlinedIcon sx={{ fontSize: 36 }} />
              <Typography sx={{ fontWeight: 800, mt: 1 }} variant="body2">여기에 이미지를 놓으세요</Typography>
            </Box>
          ) : null}
        </Box>

        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
            <Box>
              <Typography sx={{ fontWeight: 850 }} variant="subtitle1">{detail.label}</Typography>
              <Typography color="text.secondary" variant="body2">{detail.description}</Typography>
            </Box>
            <ImageOutlinedIcon color="action" />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
            <Box sx={{ bgcolor: "grey.50", borderRadius: 1, flex: 1, px: 1.25, py: 1 }}>
              <Typography color="text.secondary" variant="caption">현재 해상도</Typography>
              <Typography sx={{ fontWeight: 750 }} variant="body2">
                {!hasDisplayedImage ? "등록된 이미지 없음" : imageDimensions ? `${imageDimensions.width} × ${imageDimensions.height} px` : "확인 중..."}
              </Typography>
            </Box>
            <Box sx={{ bgcolor: "grey.50", borderRadius: 1, flex: 1.4, px: 1.25, py: 1 }}>
              <Typography color="text.secondary" variant="caption">권장 해상도</Typography>
              <Typography sx={{ fontWeight: 750 }} variant="body2">{detail.recommendedResolution}</Typography>
            </Box>
          </Stack>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
            <Button onClick={() => setPreviewAsset(assetType)} startIcon={<PreviewOutlinedIcon />} variant="outlined">
              화면 미리보기
            </Button>
            <Button
              disabled={!canUpdate || uploading}
              onClick={() => inputRef.current?.click()}
              startIcon={<CloudUploadOutlinedIcon />}
              variant="contained"
            >
              이미지 교체
            </Button>
            <Button
              color="inherit"
              disabled={!canUpdate || uploading || resetting || isDefaultImage(assetType)}
              onClick={() => setResetAsset(assetType)}
              startIcon={<RestoreOutlinedIcon />}
              variant="text"
            >
              {isFavicon ? "기본값 적용" : "기본 이미지 적용"}
            </Button>
          </Box>
          <Typography color="text.secondary" sx={{ display: "block", mt: 1 }} variant="caption">
            버튼으로 선택하거나 이미지 파일을 카드 위에 끌어다 놓을 수 있습니다.
          </Typography>
          <input
            accept="image/png,image/jpeg,image/gif,.png,.jpg,.jpeg,.gif"
            hidden
            onChange={(event) => handleFileChange(assetType, event)}
            ref={inputRef}
            type="file"
          />
        </Box>
      </Paper>
    );
  };

  const previewUrl = previewAsset
    ? pending?.assetType === previewAsset
      ? pending.previewUrl
      : currentUrl(previewAsset)
    : "";

  return (
    <>
      <Card sx={{ borderRadius: 1, overflow: "hidden" }}>
        <Box
          sx={{
            alignItems: { xs: "flex-start", sm: "center" },
            background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(14,165,233,0.03))",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            justifyContent: "space-between",
            px: 2.5,
            py: 2,
          }}
        >
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <AspectRatioOutlinedIcon color="primary" />
              <Typography sx={{ fontWeight: 850 }} variant="h6">화면 브랜딩</Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
              현재 적용 이미지를 확인하고 필요할 때만 빠르게 교체할 수 있습니다.
            </Typography>
          </Box>
          <Chip label="PNG · JPG · GIF" size="small" variant="outlined" />
        </Box>
        <Divider />
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
            {renderAssetCard("login-background", backgroundInputRef)}
            {renderAssetCard("company-logo", logoInputRef)}
            {renderAssetCard("favicon", faviconInputRef)}
          </Stack>
        </CardContent>
      </Card>

      <Dialog fullWidth maxWidth="md" onClose={closePreview} open={Boolean(previewAsset)}>
        <DialogTitle>{previewAsset ? `${assetDetails[previewAsset].label} 미리보기` : "화면 미리보기"}</DialogTitle>
        <DialogContent dividers>
          {previewAsset === "login-background" ? (
            <Box
              sx={{
                aspectRatio: "16 / 9",
                backgroundImage: `linear-gradient(90deg, rgba(248,250,252,0.12), rgba(248,250,252,0.03)), url("${previewUrl}")`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                borderRadius: 2,
                boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.10)",
                minHeight: 320,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <Box component="img" src="/branding/logo_white_landscape.png" sx={{ left: 22, position: "absolute", top: 18, width: 145 }} />
              <Paper
                sx={{
                  left: "50%",
                  p: 3,
                  position: "absolute",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: { xs: "68%", sm: 300 },
                }}
              >
                <Box sx={{ bgcolor: "#eff6ff", borderRadius: "50%", height: 46, mx: "auto", width: 46 }} />
                <Typography align="center" sx={{ fontWeight: 850, mt: 1.5 }} variant="h6">로그인</Typography>
                <Box sx={{ bgcolor: "grey.100", borderRadius: 1, height: 30, mt: 2 }} />
                <Box sx={{ bgcolor: "grey.100", borderRadius: 1, height: 30, mt: 1 }} />
                <Box sx={{ bgcolor: "#1e293b", borderRadius: 1, height: 34, mt: 2 }} />
              </Paper>
            </Box>
          ) : null}

          {previewAsset === "company-logo" ? (
            <Box sx={{ bgcolor: "#f7f9fc", borderRadius: 2, display: "flex", height: 380, overflow: "hidden" }}>
              <Box sx={{ bgcolor: "white", borderRight: "1px solid", borderColor: "divider", p: 2, width: 260 }}>
                <Box sx={{ alignItems: "center", display: "flex", height: 58, justifyContent: "center", mb: 2 }}>
                  <Box component="img" src={previewUrl} sx={{ maxHeight: 42, maxWidth: 220, objectFit: "contain" }} />
                </Box>
                {["대시보드", "기준정보", "PQ 관리", "시스템 관리"].map((label, index) => (
                  <Box
                    key={label}
                    sx={{
                      bgcolor: index === 0 ? "primary.main" : "transparent",
                      borderRadius: 1,
                      color: index === 0 ? "white" : "text.primary",
                      mb: 1,
                      px: 2,
                      py: 1.25,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700 }} variant="body2">{label}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ flex: 1, p: 3 }}>
                <Box sx={{ bgcolor: "white", border: "1px solid", borderColor: "divider", borderRadius: 2, height: 100 }} />
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Box sx={{ bgcolor: "white", border: "1px solid", borderColor: "divider", borderRadius: 2, flex: 1, height: 190 }} />
                  <Box sx={{ bgcolor: "white", border: "1px solid", borderColor: "divider", borderRadius: 2, flex: 1, height: 190 }} />
                </Stack>
              </Box>
            </Box>
          ) : null}

          {previewAsset === "favicon" ? (
            <Box sx={{ alignItems: "center", bgcolor: "#f7f9fc", borderRadius: 2, display: "flex", flexDirection: "column", gap: 2, minHeight: 260, justifyContent: "center", p: 4 }}>
              <Box sx={{ alignItems: "center", bgcolor: "white", border: "1px solid", borderColor: "divider", borderRadius: 2, boxShadow: "0 4px 14px rgba(15,23,42,0.08)", display: "flex", gap: 1, px: 2, py: 1, width: { xs: "100%", sm: 320 } }}>
                {previewUrl ? (
                  <Box component="img" src={previewUrl} sx={{ height: 24, objectFit: "contain", width: 24 }} />
                ) : (
                  <Box sx={{ bgcolor: "grey.200", borderRadius: 0.5, height: 24, width: 24 }} />
                )}
                <Typography color="text.secondary" noWrap variant="body2">Cheil PQ</Typography>
              </Box>
              {previewUrl ? (
                <Box component="img" src={previewUrl} sx={{ height: 96, objectFit: "contain", width: 96 }} />
              ) : (
                <Stack spacing={1} sx={{ alignItems: "center", color: "text.secondary" }}>
                  <ImageOutlinedIcon sx={{ fontSize: 64 }} />
                  <Typography variant="body2">등록된 파비콘이 없습니다.</Typography>
                </Stack>
              )}
              <Typography color="text.secondary" variant="body2">
                {previewUrl ? "브라우저 탭에 표시되는 아이콘 미리보기" : "파비콘을 등록하면 브라우저 탭에 표시됩니다."}
              </Typography>
            </Box>
          ) : null}

          {pending && previewAsset === pending.assetType ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
              <Chip label={`${pending.width} × ${pending.height} px`} />
              <Chip label={formatFileSize(pending.file.size)} />
              <Chip color="primary" label={`선택 파일 · ${pending.file.name}`} variant="outlined" />
            </Stack>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }} variant="body2">
              실제 화면에 적용되는 비율과 배치를 간략하게 보여주는 미리보기입니다.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" disabled={uploading} onClick={closePreview} variant="outlined">
            {pending ? "취소" : "닫기"}
          </Button>
          {pending ? (
            <Button disabled={uploading} onClick={() => void upload()} startIcon={<CloudUploadOutlinedIcon />} variant="contained">
              {uploading ? "적용 중..." : "이 이미지로 적용"}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      <ConfirmActionDialog
        confirmLabel={resetAsset === "favicon" ? "기본값 적용" : "기본 이미지 적용"}
        loading={resetting}
        message={resetAsset === "favicon" ? "현재 등록된 파비콘을 제거하고 기본 상태로 되돌립니다. 계속하시겠습니까?" : "현재 사용 중인 이미지를 기본 이미지로 변경합니다. 계속하시겠습니까?"}
        onClose={() => setResetAsset(null)}
        onConfirm={() => void applyDefault()}
        open={Boolean(resetAsset)}
        targetLabel={resetAsset ? assetDetails[resetAsset].label : undefined}
        title={resetAsset === "favicon" ? "파비콘 기본값 적용" : "기본 이미지 적용"}
      />
    </>
  );
}
