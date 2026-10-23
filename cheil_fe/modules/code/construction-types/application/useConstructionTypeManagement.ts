"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createConstructionType, deleteConstructionType, listConstructionTypes, updateConstructionType, type ConstructionTypeRecord, type ConstructionTypeSearchParams, type ConstructionTypeUpsertRequest } from "@/modules/code/construction-types/api";
import { constructionTypeManagementQueryKeys } from "@/modules/code/construction-types/application/queryKeys";
import { referenceQueryKeys } from "@/modules/common/reference/queryKeys";

export function useConstructionTypeManagement({ canCreate, canDelete, canRead, canUpdate, enabled, filters, onDeleted, onError, onSaved }: {
  canCreate: boolean; canDelete: boolean; canRead: boolean; canUpdate: boolean; enabled: boolean; filters: ConstructionTypeSearchParams;
  onDeleted: () => void; onError: (error: unknown) => void; onSaved: (record: ConstructionTypeRecord) => void;
}) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: constructionTypeManagementQueryKeys.list(filters), queryFn: () => listConstructionTypes(filters), enabled: canRead && enabled });
  const refresh = async () => { await client.invalidateQueries({ queryKey: constructionTypeManagementQueryKeys.all }); await client.invalidateQueries({ queryKey: referenceQueryKeys.constructionTypesRoot }); };
  const saveMutation = useMutation({
    mutationFn: ({ codeId, request }: { codeId: number | null; request: ConstructionTypeUpsertRequest }) => {
      if (codeId === null) { if (!canCreate) throw new Error("공사종류 등록 권한이 없습니다."); return createConstructionType(request); }
      if (!canUpdate) throw new Error("공사종류 수정 권한이 없습니다."); return updateConstructionType(codeId, request);
    }, onSuccess: async (record) => { onSaved(record); await refresh(); }, onError,
  });
  const deleteMutation = useMutation({ mutationFn: (id: number) => { if (!canDelete) throw new Error("공사종류 삭제 권한이 없습니다."); return deleteConstructionType(id); }, onSuccess: async () => { onDeleted(); await refresh(); }, onError });
  return { deleteMutation, query, saveMutation };
}
