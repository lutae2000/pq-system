"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

type PageModule = { default: ComponentType };

declare global {
  interface ImportMeta {
    glob<T>(patterns: string[]): Record<string, () => Promise<T>>;
  }
}

const pages = import.meta.glob<PageModule>(["../../app/**/page.tsx", "!../../app/page.tsx"]);

const pagePaths = Object.entries(pages).map(([key, load]) => [
  key.slice("../../app".length, -"/page.tsx".length),
  load,
] as const);

export const pageRegistry: Record<string, ComponentType> = Object.fromEntries(
  pagePaths.map(([pathname, load]) => [
    pathname,
    dynamic(() => load().then((page) => page.default), { ssr: false }),
  ]),
);

const pagePathSet = new Set(Object.keys(pageRegistry));
const pagePreloaders = new Map(pagePaths);

export function isRegisteredPagePath(pathname: string) {
  return pagePathSet.has(pathname);
}

export function preloadRegisteredPage(pathname: string) {
  const preload = pagePreloaders.get(pathname);
  if (preload) {
    void preload().catch(() => undefined);
  }
}
