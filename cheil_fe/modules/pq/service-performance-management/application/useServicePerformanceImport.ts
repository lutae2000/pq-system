import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTabQueryEnabled } from "@/components/layout/TabActivityContext";
import {
  listImportedServicePerformances,
  replaceImportedServicePerformances,
  type ServicePerformanceImportFilters,
  type ServicePerformanceImportRow,
} from "../api";
import type { ServicePerformanceWorkType } from "../domain/workType";
import { servicePerformanceQueryKeys } from "./queryKeys";

export function useServicePerformanceImport(
  page: number,
  size: number,
  filters: ServicePerformanceImportFilters,
  canRead: boolean,
  canCreate: boolean,
) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: servicePerformanceQueryKeys.imported(page, size, filters),
    queryFn: () => listImportedServicePerformances(page, size, filters),
    enabled: useTabQueryEnabled(canRead),
  });
  const replacement = useMutation({
    mutationFn: ({ workType, rows }: {
      workType: ServicePerformanceWorkType;
      rows: ServicePerformanceImportRow[];
    }) => {
      if (!canCreate) throw new Error("용역 수행성과 등록 권한이 없습니다.");
      return replaceImportedServicePerformances(workType, rows);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: servicePerformanceQueryKeys.all }),
  });
  return { query, replacement };
}
