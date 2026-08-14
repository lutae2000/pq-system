import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type LayoutTab = {
  closable: boolean;
  href: string;
  label: string;
};

type LayoutStore = {
  isSidebarOpen: boolean;
  tabs: LayoutTab[];
  closeAllTabs: () => void;
  closeSidebar: () => void;
  closeTab: (href: string) => void;
  openTab: (tab: LayoutTab) => void;
  openSidebar: () => void;
  resetTabs: () => void;
  toggleSidebar: () => void;
};

const dashboardTab: LayoutTab = {
  closable: false,
  href: "/dashboard",
  label: "Dashboard",
};

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      tabs: [dashboardTab],
      closeAllTabs: () => set({ tabs: [dashboardTab] }),
      closeSidebar: () => set({ isSidebarOpen: false }),
      closeTab: (href) =>
        set((state) => {
          if (href === dashboardTab.href) {
            return state;
          }

          const nextTabs = state.tabs.filter((tab) => tab.href !== href);
          return {
            tabs: nextTabs.length > 0 ? nextTabs : [dashboardTab],
          };
        }),
      openTab: (tab) =>
        set((state) => {
          const existing = state.tabs.find((item) => item.href === tab.href);
          if (existing) {
            if (existing.label === tab.label && existing.closable === tab.closable) {
              return state;
            }

            return {
              tabs: state.tabs.map((item) => (item.href === tab.href ? { ...item, ...tab } : item)),
            };
          }

          if (tab.href === dashboardTab.href) {
            return {
              tabs: [dashboardTab, ...state.tabs.filter((item) => item.href !== dashboardTab.href)],
            };
          }

          return {
            tabs: [...state.tabs, tab],
          };
        }),
      openSidebar: () => set({ isSidebarOpen: true }),
      resetTabs: () => set({ tabs: [dashboardTab] }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    }),
    {
      name: "layout-store",
      skipHydration: true,
      partialize: (state) => ({
        isSidebarOpen: state.isSidebarOpen,
        tabs: state.tabs,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
