const root = ["new-employment-rates"] as const;

export const newEmploymentRateQueryKeys = {
  all: root,
  monthlyStatuses: (baseYearMonth: string) => [...root, "monthly-statuses", baseYearMonth] as const,
  monthlyStatusPivot: (baseYearMonth: string) => [...root, "monthly-status-pivot", baseYearMonth] as const,
  previousYearSamePeriodPivot: (baseYearMonth: string) => [...root, "previous-year-same-period-pivot", baseYearMonth] as const,
  employees: (params: Record<string, unknown>) => [...root, "employees", params] as const,
  employee: (employeeId: number) => [...root, "employee", employeeId || "none"] as const,
} as const;
