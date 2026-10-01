import {
  deleteEngineerCareer,
  deleteEngineerEducation,
  deleteEngineerLicense,
  deleteEngineerPrize,
  deleteEngineerSchool,
  getEngineerProfile,
  saveEngineerCareerDetails,
  saveEngineerCareers,
  saveEngineerEducations,
  saveEngineerLicenses,
  saveEngineerMaster,
  saveEngineerPrizes,
  saveEngineerSchools,
} from "@/modules/pq/engineers/api";
import { createCompanyPerformances } from "@/modules/pq/company-performance/api";

export function useEngineerPersonalInfoCommands() {
  return {
    createCompanyPerformances,
    deleteEngineerCareer,
    deleteEngineerEducation,
    deleteEngineerLicense,
    deleteEngineerPrize,
    deleteEngineerSchool,
    getEngineerProfile,
    saveEngineerCareerDetails,
    saveEngineerCareers,
    saveEngineerEducations,
    saveEngineerLicenses,
    saveEngineerMaster,
    saveEngineerPrizes,
    saveEngineerSchools,
  };
}
