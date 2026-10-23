import { pageRegistry } from "@/shared/navigation/pageRegistry.generated";

const pagePathSet = new Set(Object.keys(pageRegistry));

export const isRegisteredPagePath = (pathname: string) => pagePathSet.has(pathname);
