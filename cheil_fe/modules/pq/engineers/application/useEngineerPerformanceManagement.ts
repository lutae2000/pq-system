"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getEngineerProfile,
  listEngineerProfiles,
  saveEngineerCareerDetails,
} from "@/modules/pq/engineers/api";
import type { CareerDetailRecord, EngineerProfile } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import type { EngineerPerformanceFilters, EngineerPerformanceProfile, EngineerPerformanceRecord } from "@/modules/pq/engineers/domain/performanceModels";

const queryKeys = {
  all: ["pq", "engineer-performance-management"] as const,
  profiles: (filters: EngineerPerformanceFilters) => ["pq", "engineer-performance-management", "profiles", filters] as const,
  profile: (engineerId: string) => ["pq", "engineers", "profile", engineerId] as const,
};

const text = (value: string | number | null | undefined) => String(value ?? "").trim();

const toPerformanceRecord = (row: CareerDetailRecord, index: number): EngineerPerformanceRecord => ({
  actualParticipation: row.active,
  clientName: row.compName,
  contractEndDate: row.endDate,
  contractStartDate: row.startDate,
  duty: row.duty,
  id: text(row.recordId ?? row.id ?? row.seq ?? index + 1),
  memo: row.remark,
  ownContractAmount: "",
  participatingCompany: row.compName,
  participatingDepartment: row.deptName,
  participatingPosition: row.grade,
  participationPosition: row.jobClass,
  participationEndDate: row.endDate,
  participationField: row.jobPart,
  participationStartDate: row.startDate,
  participatingTitle: row.grade,
  performanceType: row.jobTag,
  projectName: row.jobName,
  reported: row.joinYn === "Y",
  round: String(row.seq || index + 1),
  status: row.active ? "진행" : "대기",
  supervisor: row.jobClass.includes("책임"),
  specialtyField: row.proPart,
  totalContractAmount: "",
  workField: row.jobPart,
  jointRate: "",
});

const toPerformanceProfile = (profile: EngineerProfile): EngineerPerformanceProfile => ({
  performances: profile.careerDetails.map(toPerformanceRecord),
  summary: {
    active: profile.summary.active,
    department: profile.summary.department,
    id: profile.summary.id,
    name: profile.summary.name,
    position: profile.summary.position,
    rrn: profile.summary.rrn,
    status: profile.summary.status,
    workField: profile.summary.workField,
  },
});

const toCareerDetailRecord = (row: EngineerPerformanceRecord, original?: CareerDetailRecord): CareerDetailRecord => ({
  active: row.actualParticipation,
  attachments: original?.attachments,
  compName: row.participatingCompany || row.clientName,
  deptName: row.participatingDepartment,
  duty: row.duty,
  engLevel: original?.engLevel ?? 0,
  endDate: row.contractEndDate || row.participationEndDate,
  grade: row.participatingPosition || row.participatingTitle,
  id: original?.id ?? row.id,
  jobClass: row.participationPosition,
  jobName: row.projectName,
  jobPart: row.participationField || row.workField,
  jobTag: row.performanceType,
  joinDay: original?.joinDay ?? 0,
  joinYn: row.reported ? "Y" : "N",
  method: original?.method ?? "",
  partDay: original?.partDay ?? 0,
  proPart: row.specialtyField,
  recordId: original?.recordId ?? (Number(row.id) || null),
  remark: row.memo,
  returnYn: original?.returnYn ?? "N",
  selectDay: original?.selectDay ?? 0,
  seq: Number(row.round) || original?.seq || 0,
  startDate: row.contractStartDate || row.participationStartDate,
});

type Params = {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  filters: EngineerPerformanceFilters;
  tabQueryEnabled: boolean;
  onProfilesSaved: (profiles: EngineerPerformanceProfile[]) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
};

export function useEngineerPerformanceManagement({ canCreate, canRead, canUpdate, filters, tabQueryEnabled, onProfilesSaved, showError, showSuccess }: Params) {
  const queryClient = useQueryClient();
  const profilesQuery = useQuery({
    queryKey: queryKeys.profiles(filters),
    queryFn: async () => {
      const profiles = await listEngineerProfiles({ keyword: filters.keyword.trim() || undefined });
      return profiles.map(toPerformanceProfile);
    },
    enabled: canRead && tabQueryEnabled,
  });

  const savePerformanceMutation = useMutation({
    mutationFn: async ({ engineerId, records }: { engineerId: string; records: EngineerPerformanceRecord[] }) => {
      if (!canCreate && !canUpdate) throw new Error("기술경력 저장 권한이 없습니다.");
      const profile = await getEngineerProfile(engineerId);
      const byId = new Map(profile.careerDetails.map((row) => [text(row.recordId ?? row.id ?? row.seq), row]));
      return saveEngineerCareerDetails(engineerId, records.map((row) => toCareerDetailRecord(row, byId.get(row.id))));
    },
    onSuccess: (saved) => {
      const nextProfile = toPerformanceProfile(saved);
      onProfilesSaved([nextProfile]);
      void queryClient.invalidateQueries({ queryKey: queryKeys.all });
      showSuccess("기술경력 실적을 저장했습니다.");
    },
    onError: (error) => showError(error instanceof Error ? error.message : "기술경력 실적을 저장하지 못했습니다."),
  });

  return { profilesQuery, savePerformanceMutation };
}
