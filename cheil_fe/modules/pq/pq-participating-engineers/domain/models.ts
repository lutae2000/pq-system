import type { EngineerStatus } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";

export type SelectedPqEngineer = {
  birthDate: string;
  department: string;
  engineerId: string;
  jobField: string;
  memo: string;
  name: string;
  priority: number;
  role: string;
  specialtyField: string;
  status: EngineerStatus;
  title: string;
};
