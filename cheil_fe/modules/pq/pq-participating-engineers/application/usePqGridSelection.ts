"use client";

import { useCallback, useMemo, useState } from "react";

export type PqGridSelectionEvent = {
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
};

type UsePqGridSelectionParams = {
  rowIds: string[];
};

export function usePqGridSelection({ rowIds }: UsePqGridSelectionParams) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(null);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedIdSet.has(id));
  const someSelected = rowIds.some((id) => selectedIdSet.has(id));

  const handleSelection = useCallback(
    (id: string, event?: PqGridSelectionEvent, source: "row" | "checkbox" = "row") => {
      const isModifierClick = Boolean(event?.ctrlKey || event?.metaKey);
      const isRangeClick = Boolean(event?.shiftKey);

      setSelectedIds((current) => {
        if (!isModifierClick && !isRangeClick) {
          setSelectionAnchorId(id);
          if (source === "checkbox") {
            return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
          }
          return [id];
        }

        if (isRangeClick) {
          const anchorId = selectionAnchorId ?? current[current.length - 1] ?? id;
          const anchorIndex = rowIds.indexOf(anchorId);
          const targetIndex = rowIds.indexOf(id);

          if (anchorIndex < 0 || targetIndex < 0) {
            setSelectionAnchorId(id);
            return Array.from(new Set([...current, id]));
          }

          const [start, end] = anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
          setSelectionAnchorId(anchorId);
          return Array.from(new Set([...current, ...rowIds.slice(start, end + 1)]));
        }

        setSelectionAnchorId(id);
        return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      });
    },
    [rowIds, selectionAnchorId],
  );

  const toggleAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? rowIds : []);
      setSelectionAnchorId(null);
    },
    [rowIds],
  );

  const clear = useCallback(() => {
    setSelectedIds([]);
    setSelectionAnchorId(null);
  }, []);

  return {
    allSelected,
    clear,
    handleSelection,
    selectedIdSet,
    selectedIds,
    selectionAnchorId,
    setSelectedIds,
    setSelectionAnchorId,
    someSelected,
    toggleAll,
  };
}
