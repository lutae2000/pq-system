import { apiClient } from "@/lib/http/apiClient";
import { apiRequest } from "@/lib/http/apiRequest";

export type BrandingAssetType = "company-logo" | "favicon" | "login-background";

export type BrandingSettings = {
  companyLogoUrl: string;
  faviconUrl: string;
  loginBackgroundUrl: string;
};

export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  companyLogoUrl: "/branding/logo_white_landscape.png",
  faviconUrl: "",
  loginBackgroundUrl: "/login/login-light-hero-balanced-v2.png",
};

export const BRANDING_QUERY_KEY = ["public-branding"] as const;

export function normalizeBrandingUrl(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }
  return value.startsWith("/files/") ? `/api${value}` : value;
}

const normalizeFaviconUrl = (value: string | null | undefined) =>
  value === "NONE" || value === "/branding/cheil-ci.svg"
    ? DEFAULT_BRANDING_SETTINGS.faviconUrl
    : normalizeBrandingUrl(value, DEFAULT_BRANDING_SETTINGS.faviconUrl);

export async function getBrandingSettings(): Promise<BrandingSettings> {
  const settings = await apiRequest(
    apiClient.get<BrandingSettings>("/public/branding"),
    "브랜딩 설정을 불러오지 못했습니다.",
  );
  return {
    companyLogoUrl: normalizeBrandingUrl(settings.companyLogoUrl, DEFAULT_BRANDING_SETTINGS.companyLogoUrl),
    faviconUrl: normalizeFaviconUrl(settings.faviconUrl),
    loginBackgroundUrl: normalizeBrandingUrl(settings.loginBackgroundUrl, DEFAULT_BRANDING_SETTINGS.loginBackgroundUrl),
  };
}

export async function uploadBrandingImage(assetType: BrandingAssetType, file: File): Promise<BrandingSettings> {
  const formData = new FormData();
  formData.append("file", file);
  const settings = await apiRequest(
    apiClient.patch<BrandingSettings>(`/system/policies/branding/${assetType}`, formData),
    "브랜딩 이미지를 변경하지 못했습니다.",
  );
  return {
    companyLogoUrl: normalizeBrandingUrl(settings.companyLogoUrl, DEFAULT_BRANDING_SETTINGS.companyLogoUrl),
    faviconUrl: normalizeFaviconUrl(settings.faviconUrl),
    loginBackgroundUrl: normalizeBrandingUrl(settings.loginBackgroundUrl, DEFAULT_BRANDING_SETTINGS.loginBackgroundUrl),
  };
}

export async function applyDefaultBrandingImage(assetType: BrandingAssetType): Promise<BrandingSettings> {
  const settings = await apiRequest(
    apiClient.patch<BrandingSettings>(`/system/policies/branding/${assetType}/default`),
    "기본 이미지를 적용하지 못했습니다.",
  );
  return {
    companyLogoUrl: normalizeBrandingUrl(settings.companyLogoUrl, DEFAULT_BRANDING_SETTINGS.companyLogoUrl),
    faviconUrl: normalizeFaviconUrl(settings.faviconUrl),
    loginBackgroundUrl: normalizeBrandingUrl(settings.loginBackgroundUrl, DEFAULT_BRANDING_SETTINGS.loginBackgroundUrl),
  };
}
