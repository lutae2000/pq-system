package com.cheil.cheil_be.application.engineer;

import java.io.IOException;
import java.time.Year;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import technology.tabula.ObjectExtractor;
import technology.tabula.PageIterator;
import technology.tabula.RectangularTextContainer;
import technology.tabula.Table;
import technology.tabula.extractors.SpreadsheetExtractionAlgorithm;

@Service
@Slf4j
public class EngineerPdfExtractionService {

    private static final String DATE = "\\d{4}\\.\\d{2}\\.\\d{2}";
    private static final Pattern NAME = Pattern.compile("성명\\(한글\\)\\s+(.+?)\\s+\\(한자\\)|성명\\s*[:：]\\s*(\\S+)");
    private static final Pattern BIRTH_DATE = Pattern.compile("생년월일\\s+([0-9]{2,4}[.\\-/][0-9]{1,2}[.\\-/][0-9]{1,2})");
    private static final Pattern QUALIFICATION = Pattern.compile("([^0-9]+?)\\s+(" + DATE + ")(?:\\s+([A-Z0-9-]+(?:\\s+[A-Z])?))?\\s*$");
    private static final Pattern QUALIFICATION_NUMBER = Pattern.compile("(" + DATE + ")\\s+([A-Z0-9-]+)");
    private static final Pattern SCHOOL = Pattern.compile("^(" + DATE + ")\\s+(.+?)\\s+(\\S+)\\s+(\\S+\\[[^]]+])$");
    private static final Pattern TRAINING = Pattern.compile("^(" + DATE + ")\\s*~\\s*(" + DATE + ")\\s+(.+?)\\s+(\\S+)\\s+(\\S+)$");
    private static final Pattern AWARD = Pattern.compile("^(" + DATE + ")\\s+(\\S+)\\s+(.+)$");
    private static final Pattern CAREER_START = Pattern.compile("(" + DATE + ")\\s*~\\s*(.*?)(?=(?:" + DATE + ")\\s*~|$)");
    private static final Pattern DATE_VALUE = Pattern.compile(DATE);
    private static final Set<String> GRADES = Set.of("초급", "중급", "고급", "특급");
    private static final Set<String> TRAINING_RECOGNITION_TYPES = Set.of("건설사업관리", "설계시공", "설계·시공", "품질관리");

    public EngineerPdfExtractionDtos.Response extract(MultipartFile file) {
        validate(file);
        ExtractedDocument document = extractDocument(file);
        List<String> lines = cleanLines(document.text());
        List<String> warnings = new ArrayList<>();
        if (lines.isEmpty()) {
            warnings.add("텍스트를 찾지 못했습니다. 스캔 PDF는 OCR 처리가 필요합니다.");
        }

        return new EngineerPdfExtractionDtos.Response(
                file.getOriginalFilename(),
                extractBasic(lines),
                extractSections(lines, document.licenses(), document.education(), document.projectHistories(), document.companyPerformances()),
                document.text(),
                warnings
        );
    }

    private ExtractedDocument extractDocument(MultipartFile file) {
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            stripper.setLineSeparator("\n");
            stripper.setWordSeparator(" ");
            stripper.setAddMoreFormatting(true);
            String text = stripper.getText(document);
            PositionedTextStripper positionedStripper = new PositionedTextStripper();
            positionedStripper.setSortByPosition(true);
            positionedStripper.getText(document);
            List<EngineerPdfExtractionDtos.Row> projectHistories = parseProjectHistories(document, positionedStripper.glyphs());
            List<EngineerPdfExtractionDtos.Row> companyPerformances = parseCompanyPerformances(document);
            PersonnelTableSections personnelTables = parsePersonnelTables(document);
            if (companyPerformances.isEmpty()) companyPerformances = companyPerformancesFromProjects(projectHistories);
            return new ExtractedDocument(text, personnelTables.licenses(), personnelTables.education(), projectHistories, companyPerformances);
        } catch (IOException exception) {
            log.warn("Failed to extract engineer PDF text. file={}", file.getOriginalFilename(), exception);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PDF 내용을 읽지 못했습니다.", exception);
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PDF 파일이 필요합니다.");
        }
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (!filename.endsWith(".pdf") && !"application/pdf".equalsIgnoreCase(file.getContentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PDF 파일만 업로드할 수 있습니다.");
        }
    }

    private List<String> cleanLines(String text) {
        return text.lines()
                .map(line -> line.replace('\u0000', ' ').replaceAll("\\s+", " ").trim())
                .filter(line -> !line.isBlank())
                .toList();
    }

    private EngineerPdfExtractionDtos.Basic extractBasic(List<String> lines) {
        String allText = String.join("\n", lines);
        String name = firstNonBlankGroup(NAME, allText);
        String birthday = normalizeDate(firstGroup(BIRTH_DATE, allText));
        String dutyPart = "";
        String proPart = "";
        String constructionManagementGrade = "";
        List<String> gradeValues = new ArrayList<>();

        for (int index = 0; index < lines.size(); index++) {
            if (!lines.get(index).equals("등급")) {
                continue;
            }
            for (int offset = 1; offset <= 3 && index + offset < lines.size(); offset++) {
                String valueLine = lines.get(index + offset);
                if (valueLine.contains("종목 및 등급")) break;
                List<String> tokens = List.of(valueLine.split(" "));
                List<Integer> gradeIndexes = new ArrayList<>();
                for (int tokenIndex = 0; tokenIndex < tokens.size(); tokenIndex++) {
                    if (GRADES.contains(tokens.get(tokenIndex))) gradeIndexes.add(tokenIndex);
                }
                if (dutyPart.isBlank() && !gradeIndexes.isEmpty()) {
                    int designGradeIndex = gradeIndexes.get(0);
                    dutyPart = joinBasicField(tokens, 0, designGradeIndex);
                    int constructionDutyIndex = findMatchingToken(tokens, dutyPart, designGradeIndex + 1);
                    if (constructionDutyIndex > designGradeIndex) {
                        proPart = joinBasicField(tokens, designGradeIndex + 1, constructionDutyIndex);
                        constructionManagementGrade = gradeIndexes.stream()
                                .filter(gradeIndex -> gradeIndex > constructionDutyIndex)
                                .map(tokens::get)
                                .findFirst()
                                .orElse("");
                    }
                }
                tokens.stream().filter(GRADES::contains).forEach(gradeValues::add);
            }
            break;
        }

        String designGrade = gradeValues.isEmpty() ? "" : gradeValues.get(0);
        if (constructionManagementGrade.isBlank() && gradeValues.size() > 1) {
            constructionManagementGrade = gradeValues.get(1);
        }
        return new EngineerPdfExtractionDtos.Basic(name, birthday, dutyPart, proPart, designGrade, constructionManagementGrade);
    }

    private int findMatchingToken(List<String> tokens, String value, int startIndex) {
        String normalizedValue = normalizeBasicField(value);
        for (int index = startIndex; index < tokens.size(); index++) {
            if (normalizeBasicField(tokens.get(index)).equals(normalizedValue)) return index;
        }
        return -1;
    }

    private String joinBasicField(List<String> tokens, int startIndex, int endIndex) {
        return tokens.subList(startIndex, endIndex).stream()
                .filter(token -> !GRADES.contains(token))
                .map(token -> token.replace("*", ""))
                .filter(token -> !token.isBlank())
                .reduce((left, right) -> left + " " + right)
                .orElse("")
                .trim();
    }

    private String normalizeBasicField(String value) {
        return value.replaceAll("[^\\p{L}\\p{N}]", "").toLowerCase(Locale.ROOT);
    }

    private Map<String, List<EngineerPdfExtractionDtos.Row>> extractSections(
            List<String> lines,
            List<EngineerPdfExtractionDtos.Row> tableLicenses,
            List<EngineerPdfExtractionDtos.Row> tableEducation,
            List<EngineerPdfExtractionDtos.Row> projectHistories,
            List<EngineerPdfExtractionDtos.Row> companyPerformances
    ) {
        Map<String, List<EngineerPdfExtractionDtos.Row>> sections = new LinkedHashMap<>();
        List<EngineerPdfExtractionDtos.Row> careers = parseCareers(lines);
        List<String> licenseLines = sectionLines(lines, "국가기술자격");
        List<String> educationLines = sectionLines(lines, "학력");
        sections.put("licenses", tableLicenses.isEmpty() ? parseQualifications(licenseLines) : enrichLicenseNumbers(tableLicenses, lines));
        sections.put("education", tableEducation.isEmpty() ? parseSchools(educationLines) : enrichEducation(tableEducation, parseSchools(lines)));
        sections.put("training", parseTraining(lines));
        sections.put("awards", parseAwards(sectionLines(lines, "상훈")));
        sections.put("sanctions", parseSanctions(sectionLines(lines, "벌점 및 제재일")));
        sections.put("career", parseCareers(sectionLines(lines, "근무기간 상호")));
        sections.put("companyPerformances", companyPerformances);
        sections.put("projectHistories", linkProjectCompanies(projectHistories, careers));
        return sections;
    }

    private List<EngineerPdfExtractionDtos.Row> enrichLicenseNumbers(
            List<EngineerPdfExtractionDtos.Row> tableLicenses,
            List<String> lines
    ) {
        Map<String, String> numberByDate = new LinkedHashMap<>();
        for (String line : lines) {
            Matcher matcher = QUALIFICATION_NUMBER.matcher(line);
            while (matcher.find()) numberByDate.putIfAbsent(normalizeDate(matcher.group(1)), matcher.group(2));
        }
        return tableLicenses.stream().map(row -> {
            Map<String, String> values = new LinkedHashMap<>(row.values());
            if (values.getOrDefault("license_no", "").isBlank()) {
                values.put("license_no", numberByDate.getOrDefault(values.get("date_of_issue"), ""));
            }
            return new EngineerPdfExtractionDtos.Row(row.rowNumber(), values, row.confidence());
        }).toList();
    }

    private List<EngineerPdfExtractionDtos.Row> enrichEducation(
            List<EngineerPdfExtractionDtos.Row> tableEducation,
            List<EngineerPdfExtractionDtos.Row> textEducation
    ) {
        Map<String, EngineerPdfExtractionDtos.Row> textByDate = new LinkedHashMap<>();
        for (EngineerPdfExtractionDtos.Row row : textEducation) {
            textByDate.putIfAbsent(row.values().getOrDefault("graduation_date", ""), row);
        }
        return tableEducation.stream().map(row -> {
            EngineerPdfExtractionDtos.Row textRow = textByDate.get(row.values().getOrDefault("graduation_date", ""));
            if (textRow == null) return row;
            Map<String, String> values = new LinkedHashMap<>(row.values());
            values.put("career", textRow.values().getOrDefault("career", ""));
            return new EngineerPdfExtractionDtos.Row(row.rowNumber(), values, row.confidence());
        }).toList();
    }

    private List<String> sectionLines(List<String> lines, String sectionHeader) {
        boolean capture = false;
        List<String> section = new ArrayList<>();
        for (String line : lines) {
            if (startsWithSectionHeader(line, sectionHeader)) capture = true;
            else if (capture && isKnownSectionHeader(line)) break;
            if (capture) section.add(line);
        }
        return section;
    }

    private boolean isKnownSectionHeader(String line) {
        String normalized = line.replaceAll("\\s+", "");
        return normalized.startsWith("국가기술자격")
                || normalized.startsWith("학력")
                || normalized.startsWith("교육훈련")
                || normalized.startsWith("상훈")
                || normalized.startsWith("벌점및제재일")
                || normalized.startsWith("제재사항")
                || normalized.startsWith("근무기간상호");
    }

    private boolean startsWithSectionHeader(String line, String sectionHeader) {
        return line.replaceAll("\\s+", "").startsWith(sectionHeader.replaceAll("\\s+", ""));
    }

    private List<EngineerPdfExtractionDtos.Row> linkProjectCompanies(
            List<EngineerPdfExtractionDtos.Row> projectHistories,
            List<EngineerPdfExtractionDtos.Row> careers
    ) {
        return projectHistories.stream().map(project -> {
            String projectStart = project.values().getOrDefault("startdt", "");
            String projectEnd = project.values().getOrDefault("enddt", projectStart);
            List<EngineerPdfExtractionDtos.Row> contained = careers.stream()
                    .filter(career -> containsPeriod(career.values(), projectStart, projectEnd))
                    .toList();
            List<EngineerPdfExtractionDtos.Row> candidates = contained.isEmpty()
                    ? careers.stream().filter(career -> overlapsPeriod(career.values(), projectStart, projectEnd)).toList()
                    : contained;
            EngineerPdfExtractionDtos.Row matched = candidates.stream()
                    .max(Comparator.comparing(career -> career.values().getOrDefault("entrydt", "")))
                    .orElse(null);
            Map<String, String> values = new LinkedHashMap<>(project.values());
            String companyName = matched == null ? "" : matched.values().getOrDefault("compname", "");
            values.put("compname", companyName);
            values.put("compname_uncertain", contained.size() == 1 && !companyName.isBlank() ? "N" : "Y");
            return new EngineerPdfExtractionDtos.Row(project.rowNumber(), values, project.confidence());
        }).toList();
    }

    private boolean containsPeriod(Map<String, String> career, String projectStart, String projectEnd) {
        String careerStart = career.getOrDefault("entrydt", "");
        String careerEnd = career.getOrDefault("retiredt", "");
        return !projectStart.isBlank()
                && !careerStart.isBlank()
                && careerStart.compareTo(projectStart) <= 0
                && (careerEnd.isBlank() || careerEnd.compareTo(projectEnd) >= 0);
    }

    private boolean overlapsPeriod(Map<String, String> career, String projectStart, String projectEnd) {
        String careerStart = career.getOrDefault("entrydt", "");
        String careerEnd = career.getOrDefault("retiredt", "");
        return !projectStart.isBlank()
                && !careerStart.isBlank()
                && careerStart.compareTo(projectEnd) <= 0
                && (careerEnd.isBlank() || careerEnd.compareTo(projectStart) >= 0);
    }

    private PersonnelTableSections parsePersonnelTables(PDDocument document) {
        List<Map<String, String>> licenses = new ArrayList<>();
        List<Map<String, String>> education = new ArrayList<>();
        Set<String> licenseKeys = new HashSet<>();
        Set<String> educationKeys = new HashSet<>();
        ObjectExtractor extractor = new ObjectExtractor(document);
        PageIterator pages = extractor.extract();
        SpreadsheetExtractionAlgorithm algorithm = new SpreadsheetExtractionAlgorithm();
        while (pages.hasNext()) {
            for (Table table : algorithm.extract(pages.next())) {
                for (List<RectangularTextContainer> row : table.getRows()) {
                    if (row.size() < 3) continue;
                    List<String> first = splitCellLines(row.get(0).getText());
                    List<String> second = splitCellLines(row.get(1).getText());
                    List<String> third = splitCellLines(row.get(2).getText());

                    if (!first.isEmpty() && first.size() == second.size() && second.stream().allMatch(this::isDateText)
                            && third.size() == first.size() && third.stream().allMatch(this::isLicenseNumber)) {
                        for (int index = 0; index < first.size(); index++) {
                            addLicense(licenses, licenseKeys, first.get(index), second.get(index), third.get(index));
                        }
                        if (row.size() >= 5) {
                            List<String> otherNames = splitCellLines(row.get(3).getText());
                            List<String> otherDates = splitCellLines(row.get(4).getText());
                            for (int index = 0; index < Math.min(otherNames.size(), otherDates.size()); index++) {
                                if (isDateText(otherDates.get(index))) addLicense(licenses, licenseKeys, otherNames.get(index), otherDates.get(index), "");
                            }
                        }
                    }

                    List<String> schools = mergeWrappedCellLines(second, first.size());
                    if (!first.isEmpty() && first.stream().allMatch(this::isDateText) && schools.size() == first.size()) {
                        for (int index = 0; index < first.size(); index++) {
                            String date = normalizeDate(first.get(index));
                            String school = schools.get(index).trim();
                            String major = index < third.size() ? third.get(index).trim() : "";
                            if (school.isBlank()) continue;
                            String key = date + '|' + school + '|' + major;
                            if (educationKeys.add(key)) education.add(mapOf("graduation_date", date, "schname", school, "major", major, "career", "", "valid_major_yn", "Y", "last_yn", ""));
                        }
                    }
                }
            }
        }
        return new PersonnelTableSections(toRows(licenses, 0.98), toRows(education, 0.98));
    }

    private List<String> splitCellLines(String value) {
        return value == null ? List.of() : value.lines().map(String::trim).filter(line -> !line.isBlank()).toList();
    }

    private List<String> mergeWrappedCellLines(List<String> lines, int expectedSize) {
        if (lines.size() <= expectedSize || expectedSize <= 0) return lines;
        List<String> merged = new ArrayList<>(lines);
        while (merged.size() > expectedSize) {
            merged.set(0, merged.get(0) + merged.get(1));
            merged.remove(1);
        }
        return merged;
    }

    private boolean isDateText(String value) {
        return value != null && value.trim().matches(DATE);
    }

    private boolean isLicenseNumber(String value) {
        return value != null && value.replaceAll("\\s+", "").matches("[A-Z0-9-]+");
    }

    private void addLicense(List<Map<String, String>> licenses, Set<String> keys, String name, String date, String number) {
        String licenseCode = cleanLabel(name);
        String dateOfIssue = normalizeDate(date);
        String licenseNo = number.replaceAll("\\s+", "");
        if (licenseCode.isBlank()) return;
        String key = licenseCode + '|' + dateOfIssue + '|' + licenseNo;
        if (keys.add(key)) licenses.add(mapOf("license_code", licenseCode, "date_of_issue", dateOfIssue, "license_no", licenseNo));
    }

    private List<EngineerPdfExtractionDtos.Row> parseQualifications(List<String> lines) {
        List<Map<String, String>> values = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (String rawLine : lines) {
            String line = rawLine.replaceFirst("^(국가\\s*)?기술자격\\s+", "");
            Matcher matcher = QUALIFICATION.matcher(line);
            while (matcher.find()) {
                String licenseCode = cleanLabel(matcher.group(1));
                String dateOfIssue = normalizeDate(matcher.group(2));
                String licenseNo = matcher.group(3) == null ? "" : matcher.group(3).replaceAll("\\s+", "");
                if (licenseCode.isBlank() || containsAny(licenseCode, "교육기간", "수여일", "졸업일", "근무기간", "발급번호")) continue;
                String key = licenseCode + '|' + dateOfIssue + '|' + licenseNo;
                if (seen.add(key)) values.add(mapOf("license_code", licenseCode, "date_of_issue", dateOfIssue, "license_no", licenseNo));
            }
        }
        return toRows(values, 0.96);
    }

    private List<EngineerPdfExtractionDtos.Row> parseSchools(List<String> lines) {
        List<Map<String, String>> values = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (String rawLine : lines) {
            String line = rawLine.replaceFirst("^학력\\s+", "");
            if (line.contains("~") || line.contains("해당없음")) continue;
            Matcher matcher = SCHOOL.matcher(line);
            if (!matcher.matches()) continue;
            String date = normalizeDate(matcher.group(1));
            String school = matcher.group(2).trim();
            String major = matcher.group(3).trim();
            String degree = matcher.group(4).trim();
            String key = date + '|' + school + '|' + major + '|' + degree;
            if (seen.add(key)) values.add(mapOf("graduation_date", date, "schname", school, "major", major, "career", degree, "valid_major_yn", "Y", "last_yn", ""));
        }
        return toRows(values, 0.92);
    }

    private List<EngineerPdfExtractionDtos.Row> parseTraining(List<String> lines) {
        List<Map<String, String>> values = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (String rawLine : lines) {
            String line = rawLine.replaceFirst("^교육훈련\\s+", "");
            Matcher matcher = TRAINING.matcher(line);
            if (!matcher.matches()) continue;
            String start = normalizeDate(matcher.group(1));
            String end = normalizeDate(matcher.group(2));
            String course = matcher.group(3).trim();
            String institution = matcher.group(4).trim();
            String recognitionType = matcher.group(5).replaceAll("[^가-힣·]", "");
            if (!TRAINING_RECOGNITION_TYPES.contains(recognitionType)) continue;
            String key = start + '|' + end + '|' + course + '|' + institution;
            if (seen.add(key)) values.add(mapOf("startdt", start, "enddt", end, "eduname", course, "organname", institution));
        }
        return toRows(values, 0.94);
    }

    private List<EngineerPdfExtractionDtos.Row> parseAwards(List<String> lines) {
        List<Map<String, String>> values = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        boolean capture = false;
        for (String rawLine : lines) {
            if (rawLine.startsWith("수여일 수여기관 종류 및 근거")) {
                capture = true;
                continue;
            }
            if (capture && (rawLine.startsWith("벌점") || rawLine.startsWith("제재사항"))) {
                capture = false;
                continue;
            }
            if (!capture) continue;
            String line = rawLine.replaceFirst("^상훈\\s+", "");
            Matcher matcher = AWARD.matcher(line);
            if (!matcher.matches() || line.contains("해당없음")) continue;
            String date = normalizeDate(matcher.group(1));
            String institution = matcher.group(2).trim();
            String detail = matcher.group(3).trim();
            String key = date + '|' + institution + '|' + detail;
            if (seen.add(key)) values.add(mapOf("prizetag", "상훈", "dt", date, "kind", detail, "spec", detail, "organname", institution, "jobname", "", "remark", ""));
        }
        return toRows(values, 0.94);
    }

    private List<EngineerPdfExtractionDtos.Row> parseSanctions(List<String> lines) {
        List<Map<String, String>> values = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        boolean capture = false;
        for (String rawLine : lines) {
            if (rawLine.startsWith("벌점 및 제재일")) {
                capture = true;
                continue;
            }
            if (capture && rawLine.startsWith("근무기간 상호")) break;
            if (!capture || rawLine.contains("해당없음")) continue;
            String line = rawLine.replaceFirst("^제재사항\\s+", "");
            Matcher matcher = Pattern.compile("^(" + DATE + ")\\s+(.+)$").matcher(line);
            if (!matcher.matches()) continue;
            String key = matcher.group(1) + '|' + matcher.group(2);
            if (seen.add(key)) values.add(mapOf("dt", normalizeDate(matcher.group(1)), "kind", matcher.group(2).trim(), "organname", "", "remark", matcher.group(2).trim()));
        }
        return toRows(values, 0.75);
    }

    private List<EngineerPdfExtractionDtos.Row> parseCareers(List<String> lines) {
        List<Map<String, String>> values = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        boolean capture = false;
        for (int index = 0; index < lines.size(); index++) {
            String rawLine = lines.get(index);
            if (rawLine.startsWith("근무기간 상호")) {
                capture = true;
                continue;
            }
            if (capture && (rawLine.startsWith("본 증명서는") || rawLine.startsWith("■ 건설기술"))) {
                capture = false;
                continue;
            }
            if (!capture) continue;
            String line = rawLine.replaceFirst("^근무처\\s+", "");
            Matcher matcher = CAREER_START.matcher(line);
            List<String[]> starts = new ArrayList<>();
            while (matcher.find()) starts.add(new String[]{normalizeDate(matcher.group(1)), matcher.group(2).trim()});
            if (starts.isEmpty()) continue;

            List<String> ends = new ArrayList<>();
            if (index + 1 < lines.size()) {
                Matcher endMatcher = DATE_VALUE.matcher(lines.get(index + 1));
                while (endMatcher.find()) ends.add(normalizeDate(endMatcher.group()));
                if (lines.get(index + 1).replace(" ", "").contains("근무중")) ends.add("");
            }
            for (int rowIndex = 0; rowIndex < starts.size(); rowIndex++) {
                String[] start = starts.get(rowIndex);
                String end = rowIndex < ends.size() ? ends.get(rowIndex) : "";
                String key = start[0] + '|' + end + '|' + start[1];
                if (seen.add(key)) values.add(mapOf("entrydt", start[0], "retiredt", end, "compname", start[1], "deptname", "", "grade", "", "duty", ""));
            }
        }
        return toRows(values, 0.84);
    }

    private List<EngineerPdfExtractionDtos.Row> parseProjectHistories(PDDocument document, List<PositionedGlyph> glyphs) {
        List<Map<String, String>> values = new ArrayList<>();
        Map<String, Integer> companyRowByJobName = new LinkedHashMap<>();
        ObjectExtractor extractor = new ObjectExtractor(document);
        PageIterator pages = extractor.extract();
        SpreadsheetExtractionAlgorithm tableExtractor = new SpreadsheetExtractionAlgorithm();
        while (pages.hasNext()) {
            technology.tabula.Page page = pages.next();
            List<String[]> periods = projectPeriods(glyphs, page.getPageNumber());
            int periodIndex = 0;
            for (Table table : tableExtractor.extract(page)) {
                List<List<RectangularTextContainer>> rows = table.getRows();
                if (!isProjectHistoryTable(rows)) continue;
                for (int rowIndex = 4; rowIndex < rows.size(); rowIndex += 4) {
                    List<List<RectangularTextContainer>> recordRows = rows.subList(rowIndex, Math.min(rowIndex + 4, rows.size()));
                    String jobName = tableCell(recordRows, 0, 0);
                    if (jobName.isBlank() || jobName.contains("사업명")) continue;
                    int companyRowNumber = companyRowByJobName.computeIfAbsent(
                            normalizeBasicField(jobName),
                            ignored -> companyRowByJobName.size() + 1
                    );
                    String[] period = periodIndex < periods.size() ? periods.get(periodIndex++) : new String[]{"", ""};
                    values.add(mapOf(
                            "jobname", jobName,
                            "seq", "",
                            "_company_row_number", String.valueOf(companyRowNumber),
                            "startdt", period[0],
                            "enddt", period[1],
                            "jobclass", tableCell(recordRows, 2, 1),
                            "jobtag", "",
                            "jobpart", tableCell(recordRows, 0, 1),
                            "propart", tableCell(recordRows, 1, 2),
                            "englevel", "",
                            "compname", "",
                            "deptname", "",
                            "grade", tableCell(recordRows, 1, 3),
                            "duty", tableCell(recordRows, 0, 2),
                            "returnyn", "Y",
                            "joinyn", "Y",
                            "remark", joinRemark(
                                    tableCell(recordRows, 1, 0),
                                    tableCell(recordRows, 1, 1),
                                    tableCell(recordRows, 2, 0)
                            )
                    ));
                }
            }
        }
        return values.isEmpty() ? parseProjectHistoriesByPosition(glyphs) : toRows(values, 0.92);
    }

    private List<EngineerPdfExtractionDtos.Row> parseCompanyPerformances(PDDocument document) {
        List<Map<String, String>> values = new ArrayList<>();
        Set<String> seenJobNames = new HashSet<>();
        ObjectExtractor extractor = new ObjectExtractor(document);
        PageIterator pages = extractor.extract();
        SpreadsheetExtractionAlgorithm tableExtractor = new SpreadsheetExtractionAlgorithm();
        while (pages.hasNext()) {
            technology.tabula.Page page = pages.next();
            for (Table table : tableExtractor.extract(page)) {
                List<List<RectangularTextContainer>> rows = table.getRows();
                if (!isProjectHistoryTable(rows)) continue;
                for (int rowIndex = 4; rowIndex < rows.size(); rowIndex += 4) {
                    List<List<RectangularTextContainer>> recordRows = rows.subList(rowIndex, Math.min(rowIndex + 4, rows.size()));
                    String jobName = tableCell(recordRows, 0, 0);
                    if (jobName.isBlank() || jobName.contains("사업명")) continue;
                    if (!seenJobNames.add(normalizeBasicField(jobName))) continue;
                    values.add(mapOf(
                            "job_name", jobName,
                            "summary", tableCell(recordRows, 2, 0),
                            "order_client", tableCell(recordRows, 1, 0),
                            "job_type", tableCell(recordRows, 1, 1),
                            "contract_amt_million", normalizeAmount(tableCell(recordRows, 2, 2)),
                            "remark", tableValueByHeader(rows, recordRows, "비고")
                    ));
                }
            }
        }
        return toRows(values, 0.92);
    }

    private String normalizeAmount(String value) {
        return value == null ? "" : value.replaceAll("[^0-9.-]", "").trim();
    }

    private List<EngineerPdfExtractionDtos.Row> companyPerformancesFromProjects(
            List<EngineerPdfExtractionDtos.Row> projectHistories
    ) {
        Map<String, Map<String, String>> valuesByJobName = new LinkedHashMap<>();
        for (EngineerPdfExtractionDtos.Row project : projectHistories) {
            String jobName = project.values().getOrDefault("jobname", "");
            if (jobName.isBlank()) continue;
            String remark = project.values().getOrDefault("remark", "");
            valuesByJobName.putIfAbsent(normalizeBasicField(jobName), mapOf(
                    "job_name", jobName,
                    "summary", remarkPart(remark, "개요"),
                    "order_client", remarkPart(remark, "발주자"),
                    "job_type", remarkPart(remark, "공사종류"),
                    "contract_amt_million", "",
                    "remark", ""
            ));
        }
        return toRows(new ArrayList<>(valuesByJobName.values()), 0.78);
    }

    private String remarkPart(String remark, String label) {
        Pattern pattern = Pattern.compile("(?:^|\\|)\\s*" + Pattern.quote(label) + "\\s*:\\s*([^|]*)");
        Matcher matcher = pattern.matcher(remark == null ? "" : remark);
        return matcher.find() ? matcher.group(1).trim() : "";
    }

    private boolean isProjectHistoryTable(List<List<RectangularTextContainer>> rows) {
        if (rows.size() < 5) return false;
        String header = rows.subList(0, Math.min(4, rows.size())).stream()
                .flatMap(List::stream)
                .map(RectangularTextContainer::getText)
                .reduce((left, right) -> left + right)
                .orElse("")
                .replaceAll("\\s+", "");
        return header.contains("사업명") && header.contains("직무분야")
                && header.contains("담당업무") && header.contains("책임정도");
    }

    private String tableCell(List<List<RectangularTextContainer>> rows, int rowIndex, int columnIndex) {
        if (rowIndex >= rows.size() || columnIndex >= rows.get(rowIndex).size()) return "";
        return rows.get(rowIndex).get(columnIndex).getText()
                .replace('\r', ' ')
                .replace('\n', ' ')
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String tableValueByHeader(
            List<List<RectangularTextContainer>> tableRows,
            List<List<RectangularTextContainer>> recordRows,
            String headerName
    ) {
        for (int rowIndex = 0; rowIndex < Math.min(4, tableRows.size()); rowIndex++) {
            List<RectangularTextContainer> headerRow = tableRows.get(rowIndex);
            for (int columnIndex = 0; columnIndex < headerRow.size(); columnIndex++) {
                String header = headerRow.get(columnIndex).getText().replaceAll("\\s+", "");
                if (header.contains(headerName)) return tableCell(recordRows, rowIndex, columnIndex);
            }
        }
        return "";
    }

    private List<String[]> projectPeriods(List<PositionedGlyph> glyphs, int pageNumber) {
        List<PositionedGlyph> pageGlyphs = glyphs.stream().filter(glyph -> glyph.page() == pageNumber).toList();
        List<PositionedLine> pageLines = positionedLines(pageGlyphs, 0, Float.MAX_VALUE, 0, Float.MAX_VALUE);
        float headerBottom = pageLines.stream()
                .filter(line -> line.text().replace(" ", "").contains("적용공법"))
                .map(PositionedLine::y)
                .max(Float::compare)
                .orElse(145f);
        float contentBottom = pageLines.stream()
                .filter(line -> line.y() > headerBottom && containsAny(line.text(), "본 증명서는", "건설기술 진흥법 시행규칙", "3. 배치금지"))
                .map(PositionedLine::y)
                .min(Float::compare)
                .orElse(Float.MAX_VALUE);
        List<String> dates = positionedLines(pageGlyphs, 20, 78, headerBottom + 3, contentBottom).stream()
                .map(PositionedLine::text)
                .filter(text -> text.replace(" ", "").matches(DATE))
                .map(this::normalizeDate)
                .toList();
        List<String[]> periods = new ArrayList<>();
        for (int index = 0; index + 1 < dates.size(); index += 2) {
            periods.add(new String[]{dates.get(index), dates.get(index + 1)});
        }
        return periods;
    }

    private List<EngineerPdfExtractionDtos.Row> parseProjectHistoriesByPosition(List<PositionedGlyph> glyphs) {
        List<Map<String, String>> values = new ArrayList<>();
        Map<String, Integer> companyRowByJobName = new LinkedHashMap<>();
        int maxPage = glyphs.stream().mapToInt(PositionedGlyph::page).max().orElse(0);
        for (int page = 1; page <= maxPage; page++) {
            int pageNumber = page;
            List<PositionedGlyph> pageGlyphs = glyphs.stream().filter(glyph -> glyph.page() == pageNumber).toList();
            List<PositionedLine> pageLines = positionedLines(pageGlyphs, 0, Float.MAX_VALUE, 0, Float.MAX_VALUE);
            boolean projectHistoryPage = pageLines.stream().anyMatch(line ->
                    line.text().contains("기술경력") || line.text().contains("건설사업관리 및 감리경력"));
            if (!projectHistoryPage) continue;

            float headerBottom = pageLines.stream()
                    .filter(line -> line.text().replace(" ", "").contains("적용공법"))
                    .map(PositionedLine::y)
                    .max(Float::compare)
                    .orElse(145f);
            float contentBottom = pageLines.stream()
                    .filter(line -> line.y() > headerBottom && containsAny(line.text(), "본 증명서는", "건설기술 진흥법 시행규칙", "3. 배치금지"))
                    .map(PositionedLine::y)
                    .min(Float::compare)
                    .orElse(Float.MAX_VALUE);

            List<PositionedLine> dateLines = positionedLines(pageGlyphs, 20, 78, headerBottom + 3, contentBottom).stream()
                    .filter(line -> line.text().replace(" ", "").matches(DATE))
                    .toList();
            for (int index = 0; index + 1 < dateLines.size(); index += 2) {
                PositionedLine startLine = dateLines.get(index);
                PositionedLine endLine = dateLines.get(index + 1);
                float nextStartY = index + 2 < dateLines.size() ? dateLines.get(index + 2).y() : contentBottom;
                float recordTop = Math.max(headerBottom + 4, startLine.y() - 30);
                float recordBottom = nextStartY == Float.MAX_VALUE ? contentBottom : nextStartY - 30;

                String jobName = areaText(pageGlyphs, 75, 360, recordTop, startLine.y() - 2);
                if (jobName.isBlank()) continue;
                String jobPart = areaText(pageGlyphs, 360, 445, recordTop, startLine.y() - 2);
                String duty = areaText(pageGlyphs, 445, 566, recordTop, startLine.y() - 2);
                String client = areaText(pageGlyphs, 75, 225, startLine.y() + 2, endLine.y() - 2);
                String constructionType = areaText(pageGlyphs, 225, 360, startLine.y() + 2, endLine.y() - 2);
                String proPart = areaText(pageGlyphs, 360, 445, startLine.y() + 2, endLine.y() - 2);
                String grade = areaText(pageGlyphs, 445, 566, startLine.y() + 2, endLine.y() - 2);
                String responsibility = responsibilityText(pageGlyphs, endLine.y() + 2, Math.min(recordBottom, endLine.y() + 34));
                String overview = areaText(pageGlyphs, 75, 360, endLine.y() + 2, Math.min(recordBottom, endLine.y() + 34));
                String remark = joinRemark(client, constructionType, overview);

                int companyRowNumber = companyRowByJobName.computeIfAbsent(
                        normalizeBasicField(jobName),
                        ignored -> companyRowByJobName.size() + 1
                );
                values.add(mapOf(
                        "jobname", jobName,
                        "seq", "",
                        "_company_row_number", String.valueOf(companyRowNumber),
                        "startdt", normalizeDate(startLine.text()),
                        "enddt", normalizeDate(endLine.text()),
                        "jobclass", responsibility,
                        "jobtag", "",
                        "jobpart", jobPart,
                        "propart", proPart,
                        "englevel", "",
                        "compname", "",
                        "deptname", "",
                        "grade", grade,
                        "duty", duty,
                        "returnyn", "Y",
                        "joinyn", "Y",
                        "remark", remark
                ));
            }
        }
        return toRows(values, 0.86);
    }

    private List<PositionedLine> positionedLines(
            List<PositionedGlyph> glyphs,
            float minX,
            float maxX,
            float minY,
            float maxY
    ) {
        List<PositionedGlyph> filtered = glyphs.stream()
                .filter(glyph -> glyph.x() >= minX && glyph.x() < maxX && glyph.y() >= minY && glyph.y() < maxY)
                .sorted(Comparator.comparing(PositionedGlyph::y).thenComparing(PositionedGlyph::x))
                .toList();
        List<List<PositionedGlyph>> grouped = new ArrayList<>();
        for (PositionedGlyph glyph : filtered) {
            List<PositionedGlyph> current = grouped.isEmpty() ? null : grouped.get(grouped.size() - 1);
            if (current == null || Math.abs(current.get(0).y() - glyph.y()) > 2.2f) {
                current = new ArrayList<>();
                grouped.add(current);
            }
            current.add(glyph);
        }

        List<PositionedLine> lines = new ArrayList<>();
        for (List<PositionedGlyph> lineGlyphs : grouped) {
            lineGlyphs.sort(Comparator.comparing(PositionedGlyph::x));
            StringBuilder text = new StringBuilder();
            float previousEndX = -1;
            for (PositionedGlyph glyph : lineGlyphs) {
                if (previousEndX >= 0 && glyph.x() - previousEndX > 2.5f) text.append(' ');
                text.append(glyph.text());
                previousEndX = Math.max(previousEndX, glyph.endX());
            }
            String normalized = text.toString().replaceAll("\\s+", " ").trim();
            if (!normalized.isBlank()) lines.add(new PositionedLine(lineGlyphs.get(0).y(), normalized));
        }
        return lines;
    }

    private String areaText(List<PositionedGlyph> glyphs, float minX, float maxX, float minY, float maxY) {
        return positionedLines(glyphs, minX, maxX, minY, maxY).stream()
                .map(PositionedLine::text)
                .reduce((left, right) -> left + " " + right)
                .orElse("")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String responsibilityText(List<PositionedGlyph> glyphs, float minY, float maxY) {
        return positionedLines(glyphs, 360, 445, minY, maxY).stream()
                .map(PositionedLine::text)
                .map(this::removeResponsibilityPrefix)
                .filter(text -> !text.isBlank())
                .reduce((left, right) -> left + right)
                .orElse("")
                .replaceAll("\\s+", "")
                .trim();
    }

    private String removeResponsibilityPrefix(String text) {
        int roleStart = List.of("책임", "기술지원", "공사감독", "감리", "기술인").stream()
                .mapToInt(text::indexOf)
                .filter(index -> index >= 0)
                .min()
                .orElse(-1);
        return roleStart < 0 ? "" : text.substring(roleStart);
    }

    private String joinRemark(String client, String constructionType, String overview) {
        List<String> parts = new ArrayList<>();
        if (!client.isBlank()) parts.add("발주자: " + client);
        if (!constructionType.isBlank()) parts.add("공사종류: " + constructionType);
        if (!overview.isBlank()) parts.add("개요: " + overview);
        return String.join(" | ", parts);
    }

    private List<EngineerPdfExtractionDtos.Row> toRows(List<Map<String, String>> values, double confidence) {
        List<EngineerPdfExtractionDtos.Row> rows = new ArrayList<>();
        for (int index = 0; index < values.size(); index++) rows.add(new EngineerPdfExtractionDtos.Row(index + 1, values.get(index), confidence));
        return rows;
    }

    private Map<String, String> mapOf(String... entries) {
        Map<String, String> values = new LinkedHashMap<>();
        for (int index = 0; index + 1 < entries.length; index += 2) values.put(entries[index], entries[index + 1]);
        return values;
    }

    private String cleanLabel(String value) {
        return value.replaceFirst("^(국가|기술자격|자격)\\s*", "").trim();
    }

    private boolean containsAny(String value, String... candidates) {
        for (String candidate : candidates) if (value.contains(candidate)) return true;
        return false;
    }

    private String firstGroup(Pattern pattern, String text) {
        Matcher matcher = pattern.matcher(text);
        return matcher.find() ? matcher.group(1).trim() : "";
    }

    private String firstNonBlankGroup(Pattern pattern, String text) {
        Matcher matcher = pattern.matcher(text);
        if (!matcher.find()) return "";
        for (int index = 1; index <= matcher.groupCount(); index++) if (matcher.group(index) != null && !matcher.group(index).isBlank()) return matcher.group(index).trim();
        return "";
    }

    private String normalizeDate(String value) {
        if (value == null || value.isBlank()) return "";
        String digits = value.replaceAll("\\D", "");
        if (digits.length() == 6) {
            int year = Integer.parseInt(digits.substring(0, 2));
            int currentYear = Year.now().getValue() % 100;
            digits = (year > currentYear ? "19" : "20") + digits;
        }
        return digits.length() == 8 ? digits.substring(0, 4) + "-" + digits.substring(4, 6) + "-" + digits.substring(6) : value.trim();
    }

    private record ExtractedDocument(
            String text,
            List<EngineerPdfExtractionDtos.Row> licenses,
            List<EngineerPdfExtractionDtos.Row> education,
            List<EngineerPdfExtractionDtos.Row> projectHistories,
            List<EngineerPdfExtractionDtos.Row> companyPerformances
    ) {
    }

    private record PersonnelTableSections(
            List<EngineerPdfExtractionDtos.Row> licenses,
            List<EngineerPdfExtractionDtos.Row> education
    ) {
    }

    private record PositionedGlyph(int page, float x, float y, float endX, String text) {
    }

    private record PositionedLine(float y, String text) {
    }

    private static final class PositionedTextStripper extends PDFTextStripper {
        private final List<PositionedGlyph> glyphs = new ArrayList<>();

        private PositionedTextStripper() throws IOException {
        }

        @Override
        protected void writeString(String text, List<TextPosition> textPositions) {
            for (TextPosition position : textPositions) {
                String value = position.getUnicode();
                if (value == null || value.isBlank()) continue;
                float x = position.getXDirAdj();
                glyphs.add(new PositionedGlyph(
                        getCurrentPageNo(),
                        x,
                        position.getYDirAdj(),
                        x + position.getWidthDirAdj(),
                        value
                ));
            }
        }

        private List<PositionedGlyph> glyphs() {
            return glyphs;
        }
    }
}
