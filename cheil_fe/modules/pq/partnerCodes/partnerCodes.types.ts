export type PartnerOrderCompanyRecord = {
  address: string;
  addressDetail: string;
  associationNo: string;
  businessNo: string;
  businessType: string;
  capital: number;
  code: string;
  companyType: "동종" | "타종" | "기타";
  corporateNo: string;
  employeeCount: number;
  englishName: string;
  fax: string;
  homepage: string;
  id: string;
  industry: string;
  longName: string;
  memo: string;
  postalCode: string;
  phone: string;
  representative: string;
  shortName: string;
  specialtyTech: string;
};

export type PartnerOrderCompanyFilters = {
  keyword: string;
};
