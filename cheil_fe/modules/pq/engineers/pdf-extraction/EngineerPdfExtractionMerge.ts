import type { EngineerProfile } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";
import type { EngineerPdfExtraction, EngineerPdfExtractionRow } from "@/modules/pq/engineers/pdf-extraction/pdfExtractionApi";

export type PdfMergeStatus = "existing" | "insert" | "update";

export const PDF_MERGE_STATUS_FIELD = "_merge_status";
export const PDF_RECORD_ID_FIELD = "_record_id";
const DB_VALUE_PREFIX = "_db_";

const matchFields: Record<string, string> = {
  awards: "kind",
  career: "compname",
  education: "schname",
  licenses: "license_code",
  projectHistories: "jobname",
  training: "eduname",
};

const sectionFields: Record<string, string[]> = {
  awards: ["dt", "prizetag", "kind", "organname", "jobname", "spec", "remark"],
  career: ["entrydt", "retiredt", "compname"],
  education: ["graduation_date", "schname", "major", "career", "valid_major_yn"],
  licenses: ["date_of_issue", "license_code", "license_no"],
  projectHistories: ["seq", "jobname", "startdt", "enddt", "jobclass", "jobpart", "propart", "englevel", "compname", "deptname", "grade", "duty", "returnyn", "joinyn", "remark"],
  training: ["startdt", "enddt", "eduname", "organname"],
};

function normalizeName(value: string | undefined) {
  return String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function normalizeCertificateName(value: string | undefined) {
  return normalizeName(value).replace(/[^\p{L}\p{N}]/gu, "");
}

function resolveReferenceCode(value: string, labelByCode: ReadonlyMap<string, string>) {
  if (labelByCode.has(value)) return value;
  const normalized = normalizeCertificateName(value);
  return [...labelByCode.entries()].find(([, name]) => normalizeCertificateName(name) === normalized)?.[0] ?? value;
}

function resolveDegreeCode(value: string, degreeNameByCode: ReadonlyMap<string, string>) {
  const exact = resolveReferenceCode(value, degreeNameByCode);
  if (exact !== value || degreeNameByCode.has(value)) return exact;
  const normalized = normalizeCertificateName(value);
  return [...degreeNameByCode.entries()]
    .filter(([, name]) => normalized.includes(normalizeCertificateName(name)))
    .sort((left, right) => normalizeCertificateName(right[1]).length - normalizeCertificateName(left[1]).length)[0]?.[0] ?? value;
}

export function normalizePdfReferenceCodes(
  extraction: EngineerPdfExtraction,
  certificationNameByCode: ReadonlyMap<string, string>,
  degreeNameByCode: ReadonlyMap<string, string>,
) {
  return {
    ...extraction,
    sections: {
      ...extraction.sections,
      licenses: (extraction.sections.licenses ?? []).map((row) => ({
        ...row,
        values: {
          ...row.values,
          license_code: resolveReferenceCode(row.values.license_code ?? "", certificationNameByCode),
        },
      })),
      education: (extraction.sections.education ?? []).map((row) => ({
        ...row,
        values: {
          ...row.values,
          career: resolveDegreeCode(row.values.career ?? "", degreeNameByCode),
        },
      })),
      projectHistories: (extraction.sections.projectHistories ?? []).map((row) => ({
        ...row,
        values: {
          ...row.values,
          returnyn: row.values.returnyn?.trim() || "Y",
        },
      })),
    },
  };
}

function existingRows(
  profile: EngineerProfile,
  certificationNameByCode: ReadonlyMap<string, string>,
  degreeNameByCode: ReadonlyMap<string, string>,
): Record<string, EngineerPdfExtractionRow[]> {
  const row = (rowNumber: number, recordId: string, values: Record<string, string>): EngineerPdfExtractionRow => ({
    confidence: 1,
    rowNumber,
    values: { ...values, [PDF_MERGE_STATUS_FIELD]: "existing", [PDF_RECORD_ID_FIELD]: recordId },
  });
  return {
    licenses: profile.certificates.map((item, index) => row(index + 1, item.id, {
      date_of_issue: item.issueDate,
      license_code: resolveReferenceCode(item.certificateName, certificationNameByCode),
      license_no: item.licenseNo,
    })),
    education: profile.education.map((item, index) => row(index + 1, item.id, {
      graduation_date: item.endDate,
      schname: item.schoolName,
      major: item.major,
      career: resolveDegreeCode(item.degree, degreeNameByCode),
      valid_major_yn: item.validMajorYn || "Y",
    })),
    career: profile.career.map((item, index) => row(index + 1, item.id, {
      entrydt: item.startDate,
      retiredt: item.endDate,
      compname: item.company,
      deptname: item.department,
      grade: item.position,
      duty: item.jobDuty,
    })),
    training: profile.trainings.map((item, index) => row(index + 1, item.id, {
      startdt: item.startDate,
      enddt: item.endDate,
      eduname: item.trainingName,
      organname: item.institution,
    })),
    awards: profile.awards.map((item, index) => row(index + 1, item.id, {
      dt: item.issueDate,
      prizetag: item.category,
      kind: item.kind,
      organname: item.agency,
      jobname: item.businessName,
      spec: item.basis,
      remark: item.remark,
    })),
    projectHistories: profile.careerDetails.map((item, index) => row(index + 1, String(item.recordId ?? item.id), {
      seq: String(item.seq || index + 1),
      jobname: item.jobName,
      startdt: item.startDate,
      enddt: item.endDate,
      jobclass: item.jobClass,
      jobpart: item.jobPart,
      propart: item.proPart,
      englevel: String(item.engLevel || ""),
      compname: item.compName,
      deptname: item.deptName,
      grade: item.grade,
      duty: item.duty,
      returnyn: item.returnYn?.trim() || "Y",
      joinyn: item.joinYn,
      remark: item.remark,
    })),
  };
}

function mergeSection(sectionKey: string, extracted: EngineerPdfExtractionRow[], existing: EngineerPdfExtractionRow[]) {
  const matchField = matchFields[sectionKey];
  if (!matchField) return extracted;
  const available = [...existing];
  const merged = extracted.map((pdfRow) => {
    const key = normalizeName(pdfRow.values[matchField]);
    const exactCareerIndex = sectionKey === "career" && key
      ? available.findIndex((dbRow) => normalizeName(dbRow.values.compname) === key
        && normalizeComparableValue("entrydt", dbRow.values.entrydt) === normalizeComparableValue("entrydt", pdfRow.values.entrydt)
        && normalizeComparableValue("retiredt", dbRow.values.retiredt) === normalizeComparableValue("retiredt", pdfRow.values.retiredt))
      : -1;
    const matchedIndex = exactCareerIndex >= 0
      ? exactCareerIndex
      : key ? available.findIndex((dbRow) => isMatchingRow(sectionKey, matchField, pdfRow, dbRow, key)) : -1;
    if (matchedIndex < 0) {
      return { ...pdfRow, values: { ...pdfRow.values, [PDF_MERGE_STATUS_FIELD]: "insert" } };
    }
    const [dbRow] = available.splice(matchedIndex, 1);
    const fields = sectionFields[sectionKey] ?? [];
    const mergedPdfValues = sectionKey === "career" ? {
      ...pdfRow.values,
      deptname: pdfRow.values.deptname?.trim() || dbRow.values.deptname || "",
      duty: pdfRow.values.duty?.trim() || dbRow.values.duty || "",
      grade: pdfRow.values.grade?.trim() || dbRow.values.grade || "",
    } : pdfRow.values;
    const hasChanges = fields.some((field) => normalizeComparableValue(field, mergedPdfValues[field]) !== normalizeComparableValue(field, dbRow.values[field]));
    const dbValues = hasChanges ? Object.fromEntries(fields.map((field) => [`${DB_VALUE_PREFIX}${field}`, dbRow.values[field] ?? ""])) : {};
    return {
      ...pdfRow,
      values: {
        ...mergedPdfValues,
        ...dbValues,
        [PDF_MERGE_STATUS_FIELD]: hasChanges ? "update" : "existing",
        [PDF_RECORD_ID_FIELD]: dbRow.values[PDF_RECORD_ID_FIELD] ?? "",
      },
    };
  });
  return [...merged, ...available].map((item, index) => ({ ...item, rowNumber: index + 1 }));
}

function normalizeComparableValue(field: string, value: string | undefined) {
  if (["date_of_issue", "graduation_date", "startdt", "enddt", "dt", "entrydt", "retiredt"].includes(field)) {
    return String(value ?? "").replace(/\D/g, "");
  }
  return normalizeName(value);
}

function isMatchingRow(sectionKey: string, matchField: string, pdfRow: EngineerPdfExtractionRow, dbRow: EngineerPdfExtractionRow, normalizedKey: string) {
  if (normalizeName(dbRow.values[matchField]) !== normalizedKey) return false;
  return sectionKey !== "education" || textSimilarity(pdfRow.values.major, dbRow.values.major) >= 0.6;
}

function textSimilarity(left: string | undefined, right: string | undefined) {
  const a = normalizeCertificateName(left);
  const b = normalizeCertificateName(right);
  if (!a || !b) return a === b ? 1 : 0;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return 1 - previous[b.length] / Math.max(a.length, b.length);
}

export function mergePdfExtractionWithProfile(
  extraction: EngineerPdfExtraction,
  profile: EngineerProfile,
  certificationNameByCode: ReadonlyMap<string, string>,
  degreeNameByCode: ReadonlyMap<string, string>,
): EngineerPdfExtraction {
  const normalizedExtraction = normalizePdfReferenceCodes(extraction, certificationNameByCode, degreeNameByCode);
  const current = existingRows(profile, certificationNameByCode, degreeNameByCode);
  return {
    ...normalizedExtraction,
    basic: {
      name: normalizedExtraction.basic.name || profile.summary.name,
      birthDate: normalizedExtraction.basic.birthDate || profile.detail.birthDate,
      department: profile.summary.department,
      position: profile.summary.position,
      workField: normalizedExtraction.basic.workField || profile.detail.jobField || profile.summary.workField,
      specialtyField: normalizedExtraction.basic.specialtyField || profile.detail.specialtyField,
      designGrade: normalizedExtraction.basic.designGrade || profile.detail.technicalField,
      constructionManagementGrade: normalizedExtraction.basic.constructionManagementGrade || profile.detail.supervisionQualification,
    },
    sections: Object.fromEntries(
      Object.entries(normalizedExtraction.sections).map(([key, rows]) => [key, mergeSection(key, rows, current[key] ?? [])]),
    ),
  };
}

export function discardMergedExtractionRow(rows: EngineerPdfExtractionRow[], rowNumber: number) {
  const target = rows.find((row) => row.rowNumber === rowNumber);
  if (!target) return rows;
  if (target.values[PDF_MERGE_STATUS_FIELD] === "insert") {
    return rows.filter((row) => row.rowNumber !== rowNumber).map((row, index) => ({ ...row, rowNumber: index + 1 }));
  }
  if (target.values[PDF_MERGE_STATUS_FIELD] !== "update") return rows;
  const restoredValues: Record<string, string> = { ...target.values, [PDF_MERGE_STATUS_FIELD]: "existing" };
  for (const field of sectionFieldsFromValues(target.values)) {
    restoredValues[field] = target.values[`${DB_VALUE_PREFIX}${field}`] ?? restoredValues[field] ?? "";
  }
  return rows.map((row) => row.rowNumber === rowNumber ? { ...row, values: restoredValues } : row);
}

function sectionFieldsFromValues(values: Record<string, string>) {
  return Object.keys(values).filter((field) => field.startsWith(DB_VALUE_PREFIX)).map((field) => field.slice(DB_VALUE_PREFIX.length));
}

export function markMergedRowsPersisted(rows: EngineerPdfExtractionRow[]) {
  return rows.map((row) => ({
    ...row,
    values: Object.fromEntries(
      Object.entries({ ...row.values, [PDF_MERGE_STATUS_FIELD]: "existing" }).filter(([field]) => !field.startsWith(DB_VALUE_PREFIX)),
    ),
  }));
}

export function markEditedMergedValues(nextValues: Record<string, string>, currentValues: Record<string, string>) {
  if (currentValues[PDF_MERGE_STATUS_FIELD] !== "existing") return nextValues;
  const dbValues = Object.fromEntries(
    Object.entries(currentValues)
      .filter(([field]) => !field.startsWith("_") )
      .map(([field, value]) => [`${DB_VALUE_PREFIX}${field}`, value]),
  );
  return { ...nextValues, ...dbValues, [PDF_MERGE_STATUS_FIELD]: "update" };
}
