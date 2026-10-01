export type EngineerPerformanceRecord = {
  actualParticipation: boolean;
  clientName: string;
  contractEndDate: string;
  contractStartDate: string;
  duty: string;
  id: string;
  memo: string;
  ownContractAmount: string;
  participatingCompany: string;
  participatingDepartment: string;
  participatingPosition: string;
  participationPosition: string;
  participationEndDate: string;
  participationField: string;
  participationStartDate: string;
  participatingTitle: string;
  performanceType: string;
  projectName: string;
  reported: boolean;
  round: string;
  status: string;
  supervisor: boolean;
  specialtyField: string;
  totalContractAmount: string;
  workField: string;
  jointRate: string;
};

export type EngineerPerformanceSummary = {
  active: boolean;
  department: string;
  id: string;
  name: string;
  position: string;
  rrn: string;
  status: string;
  workField: string;
};

export type EngineerPerformanceProfile = {
  performances: EngineerPerformanceRecord[];
  summary: EngineerPerformanceSummary;
};

export type EngineerPerformanceFilters = {
  keyword: string;
  status: string;
};
