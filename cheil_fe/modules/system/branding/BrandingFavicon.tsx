"use client";

import { useEffect } from "react";

import { useBrandingSettings } from "./useBrandingSettings";

export function BrandingFavicon() {
  const { settings } = useBrandingSettings();

  useEffect(() => {
    const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

    if (!settings.faviconUrl) {
      existing?.remove();
      return;
    }

    const link = existing ?? document.createElement("link");
    link.rel = "icon";
    link.href = settings.faviconUrl;
    link.type = settings.faviconUrl.endsWith(".svg") ? "image/svg+xml" : "image/png";
    if (!existing) {
      document.head.appendChild(link);
    }
  }, [settings.faviconUrl]);

  return null;
}
