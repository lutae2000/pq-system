"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listNoticesAdmin } from "@/modules/system/notices/api";
import { noticeQueryKeys } from "@/modules/system/notices/application/queryKeys";

export function useNoticeQueries({ enabled }: { enabled: boolean }) {
  const noticesQuery = useQuery({
    queryKey: noticeQueryKeys.list(),
    queryFn: listNoticesAdmin,
    enabled,
    placeholderData: keepPreviousData,
  });

  return { noticesQuery };
}
