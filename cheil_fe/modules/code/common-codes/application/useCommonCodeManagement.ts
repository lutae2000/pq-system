"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createCommonCode, deleteCommonCode, listCommonCodes, updateCommonCode, type CommonCodeRecord, type CommonCodeSearchParams, type CommonCodeUpsertRequest } from "@/modules/code/common-codes/api";
import { commonCodeManagementQueryKeys } from "@/modules/code/common-codes/application/queryKeys";

export function useCommonCodeManagement({ canCreate, canDelete, canRead, canUpdate, enabled, filters, onDeleted, onError, onSaved }: {
  canCreate: boolean; canDelete: boolean; canRead: boolean; canUpdate: boolean; enabled: boolean; filters: CommonCodeSearchParams;
  onDeleted: () => void; onError: (error: unknown) => void; onSaved: (record: CommonCodeRecord) => void;
}) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: commonCodeManagementQueryKeys.list(filters), queryFn: () => listCommonCodes(filters), enabled: canRead && enabled, staleTime: 0, gcTime: 0, refetchOnMount: "always" });
  const refresh = async () => { await client.invalidateQueries({ queryKey: ["common-codes"] }); await client.invalidateQueries({ queryKey: commonCodeManagementQueryKeys.all }); await client.invalidateQueries({ queryKey: ["references", "common-codes"] }); };
  const saveMutation = useMutation({
    mutationFn: ({ codeId, request }: { codeId: number | null; request: CommonCodeUpsertRequest }) => {
      if (codeId === null) { if (!canCreate) throw new Error("공통코드 등록 권한이 없습니다."); return createCommonCode(request); }
      if (!canUpdate) throw new Error("공통코드 수정 권한이 없습니다."); return updateCommonCode(codeId, request);
    },
    onSuccess: async (record) => { onSaved(record); await refresh(); }, onError,
  });
  const deleteMutation = useMutation({ mutationFn: (id: number) => { if (!canDelete) throw new Error("공통코드 삭제 권한이 없습니다."); return deleteCommonCode(id); }, onSuccess: async () => { onDeleted(); await refresh(); }, onError });
  return { deleteMutation, query, saveMutation };
}
