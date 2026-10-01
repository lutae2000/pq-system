import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  getNewEmploymentEmployee,
  listNewEmploymentEmployees,
  listNewEmploymentMonthlyStatuses,
  listNewEmploymentMonthlyStatusPivot,
  listNewEmploymentPreviousYearSamePeriodMonthlyStatusPivot,
  type NewEmploymentEmployeeSearchParams,
} from "@/modules/pq/new-employment-rates/api";
import { newEmploymentRateQueryKeys } from "@/modules/pq/new-employment-rates/application/queryKeys";

export function useNewEmploymentRateQueries({
  employeeParams,
  selectedEmployeeId,
  baseYearMonth,
  enabled,
}: {
  employeeParams: NewEmploymentEmployeeSearchParams;
  selectedEmployeeId: number;
  baseYearMonth: string;
  enabled: boolean;
}) {
  const monthlyStatusPivotQuery = useQuery({
    queryKey: newEmploymentRateQueryKeys.monthlyStatusPivot(baseYearMonth),
    queryFn: () => listNewEmploymentMonthlyStatusPivot(baseYearMonth),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const previousYearSamePeriodMonthlyStatusPivotQuery = useQuery({
    queryKey: newEmploymentRateQueryKeys.previousYearSamePeriodPivot(baseYearMonth),
    queryFn: () => listNewEmploymentPreviousYearSamePeriodMonthlyStatusPivot(baseYearMonth),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const monthlyStatusesQuery = useQuery({
    queryKey: newEmploymentRateQueryKeys.monthlyStatuses(baseYearMonth),
    queryFn: () => listNewEmploymentMonthlyStatuses(baseYearMonth),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const employeesQuery = useQuery({
    queryKey: newEmploymentRateQueryKeys.employees(employeeParams),
    queryFn: () => listNewEmploymentEmployees(employeeParams),
    enabled,
  });
  const detailQuery = useQuery({
    queryKey: newEmploymentRateQueryKeys.employee(selectedEmployeeId),
    queryFn: () => getNewEmploymentEmployee(selectedEmployeeId),
    enabled: enabled && selectedEmployeeId > 0,
  });

  return { detailQuery, employeesQuery, monthlyStatusPivotQuery, monthlyStatusesQuery, previousYearSamePeriodMonthlyStatusPivotQuery };
}
