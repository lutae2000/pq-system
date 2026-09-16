"use client";

import { useQuery } from "@tanstack/react-query";

import { BRANDING_QUERY_KEY, DEFAULT_BRANDING_SETTINGS, getBrandingSettings } from "./api";

export function useBrandingSettings() {
  const query = useQuery({
    queryKey: BRANDING_QUERY_KEY,
    queryFn: getBrandingSettings,
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    settings: query.data ?? DEFAULT_BRANDING_SETTINGS,
  };
}
