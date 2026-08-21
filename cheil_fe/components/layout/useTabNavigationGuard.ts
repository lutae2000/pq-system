"use client";

import { useCallback } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";

import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";
import { useLayoutStore } from "@/store/layoutStore";

export const MAX_OPEN_TABS = 10;

const TAB_LIMIT_WARNING = "열린 탭은 최대 10개입니다. 불필요한 탭을 닫아주세요.";

export function useTabNavigationGuard() {
  const router = useRouter();
  const tabs = useLayoutStore((state) => state.tabs);
  const { showWarning } = useAppSnackbar();

  const canOpenTab = useCallback(
    (href: string) => {
      const isAlreadyOpen = tabs.some((tab) => tab.href === href);

      if (!isAlreadyOpen && tabs.length >= MAX_OPEN_TABS) {
        showWarning(TAB_LIMIT_WARNING);
        return false;
      }

      return true;
    },
    [showWarning, tabs],
  );

  const guardTabNavigation = useCallback(
    (href: string, event?: ReactMouseEvent<HTMLElement>) => {
      if (canOpenTab(href)) {
        return true;
      }

      event?.preventDefault();
      event?.stopPropagation();
      return false;
    },
    [canOpenTab],
  );

  const navigateIfAllowed = useCallback(
    (href: string) => {
      if (!canOpenTab(href)) {
        return false;
      }

      router.push(href);
      return true;
    },
    [canOpenTab, router],
  );

  return {
    canOpenTab,
    guardTabNavigation,
    isAtTabLimit: tabs.length >= MAX_OPEN_TABS,
    navigateIfAllowed,
  };
}
