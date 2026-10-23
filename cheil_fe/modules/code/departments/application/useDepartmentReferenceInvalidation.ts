"use client";

import { useQueryClient } from "@tanstack/react-query";

import { referenceQueryKeys } from "@/modules/common/reference/queryKeys";

export function useDepartmentReferenceInvalidation() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: referenceQueryKeys.departmentsRoot });
}
