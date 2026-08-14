import { generatedPagePaths, type GeneratedPagePath } from "@/shared/navigation/pagePaths.generated";

const pagePathSet = new Set<string>(generatedPagePaths);

export type AppPagePath = GeneratedPagePath;
export const availablePagePaths = generatedPagePaths;

export const isRegisteredPagePath = (pathname: string): pathname is AppPagePath =>
  pagePathSet.has(pathname);
