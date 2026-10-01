import { useQuery } from "@tanstack/react-query";

import {
  getNewTechnologyInvestment,
  listNewTechnologyInvestments,
  type NewTechnologyInvestmentSearchParams,
} from "@/modules/pq/new-technology-investments/api";
import { newTechnologyInvestmentQueryKeys } from "@/modules/pq/new-technology-investments/application/queryKeys";

export function useNewTechnologyInvestmentQueries({
  enabled,
  searchParams,
  selectedInvestmentId,
}: {
  enabled: boolean;
  searchParams: NewTechnologyInvestmentSearchParams;
  selectedInvestmentId: number;
}) {
  const investmentsQuery = useQuery({
    queryKey: newTechnologyInvestmentQueryKeys.list(searchParams),
    queryFn: () => listNewTechnologyInvestments(searchParams),
    enabled,
  });
  const detailQuery = useQuery({
    queryKey: newTechnologyInvestmentQueryKeys.detail(selectedInvestmentId),
    queryFn: () => getNewTechnologyInvestment(selectedInvestmentId),
    enabled: enabled && selectedInvestmentId > 0,
  });

  return { detailQuery, investmentsQuery };
}
