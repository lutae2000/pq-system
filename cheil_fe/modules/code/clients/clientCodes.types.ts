export type ClientCodeClassification = "지방자치단체" | "관공서" | "민간기업" | "공공기관" | "정부";
export type ClientCodeRegion = "서울" | "경기" | "충청" | "전라" | "경상" | "강원" | "제주";

export type ClientCodeRecord = {
  active: boolean;
  address: string;
  addressDetail: string;
  businessItem: string;
  businessNo: string;
  businessType: string;
  classification: ClientCodeClassification;
  corporateNo: string;
  code: string;
  englishName: string;
  homepage: string;
  id: string;
  memo: string;
  longName: string;
  parentOrganization: string;
  postalCode: string;
  representative: string;
  region: ClientCodeRegion;
  shortName: string;
};

export type ClientCodeFilters = {
  classification: "전체" | ClientCodeClassification;
  keyword: string;
  region: "전체" | ClientCodeRegion;
};
