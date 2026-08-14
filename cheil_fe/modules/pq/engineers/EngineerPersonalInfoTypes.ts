export type EngineerStatus = "재직" | "휴직" | "퇴직";
export type AssessmentMethod = "자체평정" | "서면평정" | "현장평정";
export type DetailTab = "career" | "certificate" | "education" | "award" | "training" | "performance";

export type EngineerSummary = {
  active: boolean;
  assessmentDate: string;
  assessmentMethod: AssessmentMethod;
  department: string;
  id: string;
  isNew?: boolean;
  name: string;
  position: string;
  rrn: string;
  status: EngineerStatus;
  workField: string;
  specialtyField: string;
};

export type EngineerDetail = {
  address: string;
  age: number;
  birthDate: string;
  certificationCount: string;
  educationException: boolean;
  educationGrade: string;
  educationLevel: string;
  hometown: string;
  jobField: string;
  participationDays: number;
  retired: boolean;
  designScore: string;
  qualificationGrade: string;
  supervisionScore: string;
  supervisionEducation: string;
  supervisionQualification: string;
  specialtyField: string;
  technicalField: string;
  title: string;
};

export type AttachmentItem = {
  id: string;
  lastModified: number;
  name: string;
  size: number;
  type: string;
  url: string;
};

export type CareerRecord = {
  company: string;
  days: number;
  department: string;
  endDate: string;
  id: string;
  jobDuty: string;
  month: number;
  position: string;
  startDate: string;
  year: number;
  attachments?: AttachmentItem[];
};

export type CertificateRecord = {
  active: boolean;
  certificateName: string;
  id: string;
  issueDate: string;
  licenseNo: string;
  attachments?: AttachmentItem[];
};

export type EducationRecord = {
  degree: string;
  endDate: string;
  id: string;
  major: string;
  schoolName: string;
  startDate: string;
  validMajorYn: string;
  active: boolean;
  attachments?: AttachmentItem[];
};

export type AwardRecord = {
  active: boolean;
  agency: string;
  category: string;
  basis: string;
  businessName: string;
  id: string;
  issueDate: string;
  kind: string;
  remark: string;
  attachments?: AttachmentItem[];
};

export type TrainingRecord = {
  active: boolean;
  endDate: string;
  hours: number;
  id: string;
  institution: string;
  startDate: string;
  trainingName: string;
  attachments?: AttachmentItem[];
};

export type CareerDetailRecord = {
  active: boolean;
  attachments?: AttachmentItem[];
  compName: string;
  deptName: string;
  duty: string;
  engLevel: number;
  endDate: string;
  grade: string;
  id: string;
  jobClass: string;
  jobName: string;
  jobPart: string;
  jobTag: string;
  joinDay: number;
  joinYn: string;
  method: string;
  partDay: number;
  proPart: string;
  recordId?: number | null;
  remark: string;
  returnYn: string;
  selectDay: number;
  seq: number;
  startDate: string;
};

export type SchoolRecord = {
  active: boolean;
  attachments?: AttachmentItem[];
  career: number;
  graduationDate: string;
  id: string;
  lastYn: string;
  major: string;
  schName: string;
  validMajorYn: string;
};

export type EngineerProfile = {
  awards: AwardRecord[];
  certificates: CertificateRecord[];
  career: CareerRecord[];
  careerDetails: CareerDetailRecord[];
  detail: EngineerDetail;
  education: EducationRecord[];
  schools: SchoolRecord[];
  trainings: TrainingRecord[];
  summary: EngineerSummary;
};

export type SelectedDetailRows = {
  awards: AwardRecord[];
  certificates: CertificateRecord[];
  career: CareerRecord[];
  careerDetails: CareerDetailRecord[];
  education: EducationRecord[];
  schools: SchoolRecord[];
  trainings: TrainingRecord[];
};
