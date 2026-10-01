"use client";

import { useQuery } from "@tanstack/react-query";

import { getClientCode, listClientCodes } from "@/modules/code/clients/api";
import { getShinindoManagement, listShinindoManagements, type ShinindoManagementSearchParams } from "@/modules/pq/shinindo-management/api";
import { shinindoManagementQueryKeys } from "@/modules/pq/shinindo-management/application/queryKeys";

export function useShinindoManagementQueries({
  enabled,
  searchParams,
  selectedId,
}: {
  enabled: boolean;
  searchParams: ShinindoManagementSearchParams;
  selectedId: number;
}) {
  const managementsQuery = useQuery({
    queryKey: shinindoManagementQueryKeys.list(searchParams),
    queryFn: () => listShinindoManagements(searchParams),
    enabled,
  });
  const detailQuery = useQuery({
    queryKey: shinindoManagementQueryKeys.detail(selectedId),
    queryFn: () => getShinindoManagement(selectedId),
    enabled: enabled && selectedId > 0,
  });

  return { detailQuery, managementsQuery };
}

export function useShinindoClientOptions({
  enabled,
  keyword,
  value,
}: {
  enabled: boolean;
  keyword: string;
  value: string;
}) {
  const selectedClientQuery = useQuery({
    queryKey: shinindoManagementQueryKeys.client(value),
    queryFn: () => getClientCode(value),
    enabled: enabled && Boolean(value),
    staleTime: 5 * 60 * 1000,
  });
  const clientsQuery = useQuery({
    queryKey: shinindoManagementQueryKeys.clientOptions(keyword || value),
    queryFn: () =>
      listClientCodes({
        businessName: keyword || value,
        companyType: "",
        orderClass: "",
        page: 0,
        size: 50,
      }),
    enabled: enabled && Boolean(keyword || value),
    staleTime: 60 * 1000,
  });
  const mappedOptions = (clientsQuery.data?.content ?? []).map((client) => ({
    label: client.orderNameLong?.trim() ? `${client.orderName} (${client.orderNameLong})` : client.orderName,
    value: client.clientCode,
  }));
  const selectedClient = selectedClientQuery.data
    ? {
        label: selectedClientQuery.data.orderNameLong?.trim()
          ? `${selectedClientQuery.data.orderName} (${selectedClientQuery.data.orderNameLong})`
          : selectedClientQuery.data.orderName,
        value: selectedClientQuery.data.clientCode,
      }
    : null;
  const uniqueOptions = new Map<string, { label: string; value: string }>();
  [selectedClient, ...mappedOptions].forEach((option) => {
    if (option && !uniqueOptions.has(option.value)) {
      uniqueOptions.set(option.value, option);
    }
  });

  return {
    isLoading: clientsQuery.isLoading || selectedClientQuery.isLoading,
    options: [...uniqueOptions.values()],
  };
}
