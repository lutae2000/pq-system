export type CompanyProfile = {
  address?: string | null;
  addressDetail?: string | null;
  businessItem?: string | null;
  businessRegistrationNo?: string | null;
  businessType?: string | null;
  companyName: string;
  corporateRegistrationNo?: string | null;
  establishedOn?: string | null;
  faxNo?: string | null;
  homepageUrl?: string | null;
  lastChangedAt?: string | null;
  lastChangedId?: string | null;
  mainBusiness?: string | null;
  memo?: string | null;
  phoneNo?: string | null;
  postalCode?: string | null;
  profileId: number;
  representativeName?: string | null;
};

export type CompanyFinancialStatus = {
  capitalAmountMillion?: number | null;
  createdAt?: string | null;
  createdId?: string | null;
  creditRating?: string | null;
  currentRatio?: number | null;
  debtRatio?: number | null;
  financialId: number;
  fiscalYear: number;
  note?: string | null;
  registeredOn?: string | null;
  salesAmountMillion?: number | null;
};

export type CompanyAttachmentType = "FINANCIAL" | "BUSINESS_REGISTRATION" | "LICENSE" | "ETC";

export type CompanyAttachment = {
  attachmentId: number;
  attachmentType: CompanyAttachmentType;
  contentType?: string | null;
  createdAt?: string | null;
  createdId?: string | null;
  downloadUrl: string;
  fileId: string;
  fileSize: number;
  fiscalYear?: number | null;
  issuedOn?: string | null;
  note?: string | null;
  originalFilename: string;
  title: string;
  validUntil?: string | null;
};

export type CompanyProfileHistory = {
  changedAt: string;
  changedBy?: string | null;
  changeSummary?: string | null;
  changeType: string;
  histId: number;
  snapshotJson: string;
};

export type CompanyProfileDetail = {
  attachments: CompanyAttachment[];
  financialStatuses: CompanyFinancialStatus[];
  histories: CompanyProfileHistory[];
  profile: CompanyProfile;
};

export type FileUploadResult = {
  contentType?: string | null;
  downloadUrl: string;
  fileId: string;
  originalFilename: string;
  size: number;
};
