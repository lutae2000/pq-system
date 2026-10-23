"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClientCode, deleteClientCode, listClientCodes, updateClientCode, type ClientCodeRecord, type ClientCodeSearchParams, type ClientCodeUpsertRequest } from "@/modules/code/clients/api";
import { clientCodeQueryKeys } from "@/modules/code/clients/application/queryKeys";
import { referenceQueryKeys } from "@/modules/common/reference/queryKeys";

export function useClientCodeManagement({ canCreate, canDelete, canRead, canUpdate, enabled, onDeleted, onError, onSaved, params, revision }: {
  canCreate: boolean; canDelete: boolean; canRead: boolean; canUpdate: boolean; enabled: boolean;
  onDeleted: () => void; onError: (error: unknown) => void; onSaved: (record: ClientCodeRecord) => void;
  params: ClientCodeSearchParams; revision: number;
}) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: clientCodeQueryKeys.list(params, revision), queryFn: () => listClientCodes(params), enabled: canRead && enabled });
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: clientCodeQueryKeys.all });
    await client.invalidateQueries({ queryKey: referenceQueryKeys.clientsRoot });
  };
  const saveMutation = useMutation({
    mutationFn: ({ clientCode, request }: { clientCode: string; request: ClientCodeUpsertRequest }) => {
      if (clientCode) {
        if (!canUpdate) throw new Error("거래처 수정 권한이 없습니다.");
        return updateClientCode(clientCode, request);
      }
      if (!canCreate) throw new Error("거래처 등록 권한이 없습니다.");
      return createClientCode(request);
    },
    onSuccess: async (record) => { onSaved(record); await refresh(); }, onError,
  });
  const deleteMutation = useMutation({
    mutationFn: (clientCode: string) => { if (!canDelete) throw new Error("거래처 삭제 권한이 없습니다."); return deleteClientCode(clientCode); },
    onSuccess: async () => { onDeleted(); await refresh(); }, onError,
  });
  return { deleteMutation, query, saveMutation };
}
