"use client";

import { createContext, useContext, type ReactNode } from "react";

const TabActivityContext = createContext(true);

export function TabActivityProvider({ active, children }: { active: boolean; children: ReactNode }) {
  return <TabActivityContext.Provider value={active}>{children}</TabActivityContext.Provider>;
}

export function useTabActivity() {
  return useContext(TabActivityContext);
}

export function useTabQueryEnabled(enabled = true) {
  const active = useTabActivity();
  return active && enabled;
}
