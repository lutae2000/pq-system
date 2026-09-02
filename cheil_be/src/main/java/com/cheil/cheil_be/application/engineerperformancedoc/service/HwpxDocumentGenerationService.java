package com.cheil.cheil_be.application.engineerperformancedoc.service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;
import java.util.zip.CRC32;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import com.cheil.cheil_be.adapter.in.web.engineerperformancedoc.EngineerProjectHistoryReviewResponse;
import com.cheil.cheil_be.adapter.in.web.engineerperformancedoc.HwpxGenerateRequest;
import com.cheil.cheil_be.adapter.in.web.engineerperformancedoc.HwpxTemplateFieldResponse;
import com.cheil.cheil_be.application.bidnotice.service.BidNoticeAdminService;
import com.cheil.cheil_be.application.engineer.EngineerAdminService;
import com.cheil.cheil_be.application.engineer.EngineerDtos;

@Service
@RequiredArgsConstructor
public class HwpxDocumentGenerationService {

    private static final String HWP_NS = "http://www.hancom.co.kr/hwpml/2011/paragraph";
    private static final String SECTION_PATTERN = "Contents/section";

    private final EngineerAdminService engineerAdminService;
    private final BidNoticeAdminService bidNoticeAdminService;
    private final EngineerPerformanceDocumentService performanceDocumentService;
    private final JdbcClient jdbcClient;

    public List<HwpxTemplateFieldResponse> inspect(MultipartFile template) {
        return collectFields(readZip(template)).stream()
                .map(name -> new HwpxTemplateFieldResponse(name, ""))
                .toList();
    }

    public byte[] generate(MultipartFile template, HwpxGenerateRequest request) {
        validateRequest(template, request);
        byte[] templateBytes = readBytes(template);
        var bidNotice = bidNoticeAdminService.findByBidSeq(request.bidSeq());
        Map<String, byte[]> outputs = new LinkedHashMap<>();

        for (String engineerId : request.engineerIds()) {
            EngineerDtos.Profile profile = engineerAdminService.findByEngrId(engineerId);
            BasicDocumentValues basicValues = findBasicDocumentValues(request.bidSeq(), engineerId, profile);
            List<EngineerProjectHistoryReviewResponse> reviews = performanceDocumentService.findReviewResults(
                    request.bidSeq(), engineerId, request.relatedProjectHistoryConditions());
            byte[] output = render(templateBytes, profile, basicValues, bidNotice, reviews, request.mappings());
            String filename = safeFilename(profile.basic().nameKor(), engineerId) + "_기술인실적.hwpx";
            outputs.put(filename, output);
        }

        try {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            try (ZipOutputStream zip = new ZipOutputStream(bytes, StandardCharsets.UTF_8)) {
                outputs.forEach((filename, content) -> {
                    try {
                        zip.putNextEntry(new ZipEntry(filename));
                        zip.write(content);
                        zip.closeEntry();
                    } catch (IOException exception) {
                        throw new IllegalStateException("HWPX 산출물 ZIP 생성에 실패했습니다.", exception);
                    }
                });
            }
            return bytes.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("HWPX 산출물 ZIP 생성에 실패했습니다.", exception);
        }
    }

    private byte[] render(
            byte[] templateBytes,
            EngineerDtos.Profile profile,
            BasicDocumentValues basicValues,
            com.cheil.cheil_be.domain.bidnotice.BidNotice bidNotice,
            List<EngineerProjectHistoryReviewResponse> reviews,
            Map<String, String> mappings
    ) {
        Map<String, String> globalValues = new LinkedHashMap<>();
        Map<String, String> mappingValues = mappings == null ? Map.of() : mappings;
        for (Map.Entry<String, String> mapping : mappingValues.entrySet()) {
            if (!StringUtils.hasText(mapping.getValue()) || isRepeatablePath(mapping.getValue())) continue;
            globalValues.put(mapping.getKey(), resolve(mapping.getValue(), profile, basicValues, bidNotice, null, null, null, mapping.getKey()));
        }

        try {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            try (ZipInputStream input = new ZipInputStream(new ByteArrayInputStream(templateBytes), StandardCharsets.UTF_8);
                 ZipOutputStream output = new ZipOutputStream(bytes, StandardCharsets.UTF_8)) {
                Map<String, byte[]> entries = new LinkedHashMap<>();
                ZipEntry entry;
                while ((entry = input.getNextEntry()) != null) {
                    byte[] content = input.readAllBytes();
                    if (isSection(entry.getName())) {
                        content = renderSection(content, globalValues, mappingValues, profile, basicValues, bidNotice, reviews);
                    }
                    entries.put(entry.getName(), content);
                }
                // HWPX requires the mimetype entry to be the first entry and to be STORED.
                if (entries.containsKey("mimetype")) {
                    writeZipEntry(output, "mimetype", entries.remove("mimetype"), true);
                }
                for (Map.Entry<String, byte[]> generatedEntry : entries.entrySet()) {
                    writeZipEntry(output, generatedEntry.getKey(), generatedEntry.getValue(), false);
                }
            }
            byte[] generated = bytes.toByteArray();
            validateGeneratedPackage(generated);
            return generated;
        } catch (Exception exception) {
            throw new IllegalStateException("HWPX 양식에 데이터를 입력하지 못했습니다.", exception);
        }
    }

    private void writeZipEntry(ZipOutputStream output, String name, byte[] content, boolean stored) throws IOException {
        ZipEntry entry = new ZipEntry(name);
        if (stored) {
            CRC32 checksum = new CRC32();
            checksum.update(content);
            entry.setMethod(ZipEntry.STORED);
            entry.setSize(content.length);
            entry.setCompressedSize(content.length);
            entry.setCrc(checksum.getValue());
        }
        output.putNextEntry(entry);
        output.write(content);
        output.closeEntry();
    }

    private void validateGeneratedPackage(byte[] content) {
        Set<String> entries = new LinkedHashSet<>();
        try (ZipInputStream input = new ZipInputStream(new ByteArrayInputStream(content), StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = input.getNextEntry()) != null) {
                entries.add(entry.getName());
                byte[] entryContent = input.readAllBytes();
                if (isSection(entry.getName())) {
                    Document document = documentBuilder().newDocumentBuilder().parse(new ByteArrayInputStream(entryContent));
                    validateTableStructure(document);
                }
            }
        } catch (Exception exception) {
            throw new IllegalStateException("생성된 HWPX 패키지 검증에 실패했습니다.", exception);
        }
        if (!entries.contains("mimetype") || !entries.contains("Contents/content.hpf") || !entries.contains("Contents/header.xml")) {
            throw new IllegalStateException("생성된 HWPX 패키지의 필수 파일이 누락되었습니다.");
        }
    }

    private void validateTableStructure(Document document) {
        NodeList tables = document.getElementsByTagNameNS(HWP_NS, "tbl");
        for (int tableIndex = 0; tableIndex < tables.getLength(); tableIndex++) {
            Element table = (Element) tables.item(tableIndex);
            List<Element> rows = directChildren(table, "tr");
            if (parseLong(table.getAttribute("rowCnt")) != rows.size()) {
                throw new IllegalStateException("HWPX 표의 행 개수 정보가 일치하지 않습니다.");
            }
            for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
                for (Element cell : directChildren(rows.get(rowIndex), "tc")) {
                    NodeList addresses = cell.getElementsByTagNameNS(HWP_NS, "cellAddr");
                    if (addresses.getLength() > 0 && parseLong(((Element) addresses.item(0)).getAttribute("rowAddr")) != rowIndex) {
                        throw new IllegalStateException("HWPX 표의 셀 행 주소가 일치하지 않습니다.");
                    }
                }
            }
        }
    }

    private byte[] renderSection(
            byte[] source,
            Map<String, String> globalValues,
            Map<String, String> mappings,
            EngineerDtos.Profile profile,
            BasicDocumentValues basicValues,
            com.cheil.cheil_be.domain.bidnotice.BidNotice bidNotice,
            List<EngineerProjectHistoryReviewResponse> reviews
    ) throws Exception {
        Document document = documentBuilder().newDocumentBuilder().parse(new ByteArrayInputStream(source));
        NodeList cells = document.getElementsByTagNameNS(HWP_NS, "tc");
        for (int index = 0; index < cells.getLength(); index++) {
            Element cell = (Element) cells.item(index);
            String name = cell.getAttribute("name");
            if (globalValues.containsKey(name)) {
                setMappedCellText(cell, name, globalValues.get(name));
            } else if ("row.grade".equals(mappings.get(name)) && !isInsideRepeatableRow(cell, mappings)) {
                setCellText(cell, profile.basic().grade());
            }
        }

        renderCareerRows(document, mappings, profile, bidNotice, reviews);
        renderHistoryRows(document, mappings, profile, bidNotice);
        normalizeTables(document);

        TransformerFactory transformerFactory = TransformerFactory.newInstance();
        var transformer = transformerFactory.newTransformer();
        transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
        transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "no");
        transformer.setOutputProperty(OutputKeys.STANDALONE, "yes");
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        transformer.transform(new DOMSource(document), new StreamResult(output));
        return output.toByteArray();
    }

    private void renderCareerRows(
            Document document,
            Map<String, String> mappings,
            EngineerDtos.Profile profile,
            com.cheil.cheil_be.domain.bidnotice.BidNotice bidNotice,
            List<EngineerProjectHistoryReviewResponse> reviews
    ) {
        if (reviews.isEmpty()) return;

        List<Element> rows = elements(document.getElementsByTagNameNS(HWP_NS, "tr"));
        for (Element row : rows) {
            Set<String> rowFields = namedCells(row);
            boolean repeatable = mappings.entrySet().stream()
                    .anyMatch(mapping -> mapping.getValue() != null
                            && mapping.getValue().startsWith("row.")
                            && rowFields.contains(mapping.getKey()));
            if (!repeatable || row.getParentNode() == null) continue;

            Node parent = row.getParentNode();
            increaseTableHeight(parent, row, reviews.size() - 1);
            for (int sequence = 0; sequence < reviews.size(); sequence++) {
                EngineerProjectHistoryReviewResponse review = reviews.get(sequence);
                Element clone = (Element) row.cloneNode(true);
                fillCareerRow(clone, mappings, profile, bidNotice, review, sequence + 1);
                parent.insertBefore(clone, row);
            }
            parent.removeChild(row);
        }
    }

    private void fillCareerRow(
            Element row,
            Map<String, String> mappings,
            EngineerDtos.Profile profile,
            com.cheil.cheil_be.domain.bidnotice.BidNotice bidNotice,
            EngineerProjectHistoryReviewResponse review,
            int sequence
    ) {
        NodeList cells = row.getElementsByTagNameNS(HWP_NS, "tc");
        for (int index = 0; index < cells.getLength(); index++) {
            Element cell = (Element) cells.item(index);
            String name = cell.getAttribute("name");
            String path = mappings.get(name);
            if (path != null && path.startsWith("row.")) {
                String value = "row.seq".equals(path)
                        ? String.valueOf(sequence)
                        : resolve(path, profile, null, bidNotice, review, null, null, name);
                setMappedCellText(cell, name, value);
            }
        }
    }

    private void renderHistoryRows(
            Document document,
            Map<String, String> mappings,
            EngineerDtos.Profile profile,
            com.cheil.cheil_be.domain.bidnotice.BidNotice bidNotice
    ) {
        List<EngineerDtos.Career> histories = profile.careers() == null ? List.of() : profile.careers();
        if (histories.isEmpty()) return;

        List<Element> rows = elements(document.getElementsByTagNameNS(HWP_NS, "tr"));
        for (Element row : rows) {
            Set<String> rowFields = namedCells(row);
            boolean repeatable = mappings.entrySet().stream()
                    .anyMatch(mapping -> mapping.getValue() != null
                            && mapping.getValue().startsWith("history.")
                            && rowFields.contains(mapping.getKey()));
            if (!repeatable || row.getParentNode() == null) continue;

            Node parent = row.getParentNode();
            increaseTableHeight(parent, row, histories.size() - 1);
            for (int historyIndex = 0; historyIndex < histories.size(); historyIndex++) {
                Element clone = (Element) row.cloneNode(true);
                fillHistoryRow(clone, mappings, profile, bidNotice, histories.get(historyIndex), historyIndex + 1);
                parent.insertBefore(clone, row);
            }
            parent.removeChild(row);
        }
    }

    private void fillHistoryRow(
            Element row,
            Map<String, String> mappings,
            EngineerDtos.Profile profile,
            com.cheil.cheil_be.domain.bidnotice.BidNotice bidNotice,
            EngineerDtos.Career history,
            int sequence
    ) {
        NodeList cells = row.getElementsByTagNameNS(HWP_NS, "tc");
        for (int index = 0; index < cells.getLength(); index++) {
            Element cell = (Element) cells.item(index);
            String name = cell.getAttribute("name");
            String path = mappings.get(name);
            if (path != null && path.startsWith("history.")) {
                setMappedCellText(cell, name, resolve(path, profile, null, bidNotice, null, history, sequence, name));
            }
        }
    }

    private String resolve(
            String path,
            EngineerDtos.Profile profile,
            BasicDocumentValues basicValues,
            com.cheil.cheil_be.domain.bidnotice.BidNotice bidNotice,
            EngineerProjectHistoryReviewResponse review,
            EngineerDtos.Career history,
            Integer historySequence,
            String fieldName
    ) {
        if (path == null) return "";
        if (path.startsWith("row.")) return reviewValue(path.substring(4), review, fieldName);
        if (path.startsWith("history.")) return historyValue(path.substring(8), history, historySequence, fieldName);
        return switch (path) {
            case "basic.school" -> basicValues.school();
            case "basic.degree" -> basicValues.degree();
            case "basic.major" -> basicValues.major();
            case "basic.graduationDate" -> HwpxFieldFormatter.formatDate(basicValues.graduationDate(), "yyyy-MM-dd");
            case "basic.graduationDateDot" -> HwpxFieldFormatter.formatDate(basicValues.graduationDate(), "yyyy.mm.dd");
            case "basic.graduationMonth" -> HwpxFieldFormatter.formatDate(basicValues.graduationDate(), "yyyy-MM");
            case "basic.graduationDateKorean" -> HwpxFieldFormatter.formatDate(basicValues.graduationDate(), "yyyy년MM월");
            case "basic.licenseName" -> basicValues.licenseName();
            case "basic.licenseIssueDate" -> HwpxFieldFormatter.formatDate(basicValues.licenseIssueDate(), "yyyy-MM-dd");
            case "basic.licenseIssueDateDot" -> HwpxFieldFormatter.formatDate(basicValues.licenseIssueDate(), "yyyy.mm.dd");
            case "basic.licenseIssueDateShort" -> HwpxFieldFormatter.formatDate(basicValues.licenseIssueDate(), "yy.mm.dd");
            case "basic.licenseIssueDateMonth" -> HwpxFieldFormatter.formatDate(basicValues.licenseIssueDate(), "yyyy-mm");
            case "basic.licenseIssueDateKorean" -> HwpxFieldFormatter.formatDate(basicValues.licenseIssueDate(), "yyyy년MM월");
            case "basic.licenseGrade" -> basicValues.licenseGrade();
            case "basic.licenseNo" -> basicValues.licenseNo();
            case "basic.licenseCareer" -> basicValues.licenseCareer();
            case "summary.name" -> profile.basic().nameKor();
            case "summary.id" -> profile.basic().engrId();
            case "summary.department" -> profile.basic().deptName();
            case "summary.position" -> profile.basic().dutyPart();
            case "detail.birthDate" -> HwpxFieldFormatter.formatBirthDate(fieldName, profile.basic().birthday());
            case "detail.age" -> age(profile.basic().birthday());
            case "detail.qualificationGrade" -> profile.basic().grade();
            case "bidNotice.projectName" -> bidNotice.projectName();
            case "bidNotice.orderClientName", "bidNotice.orderClient" -> bidNotice.orderClient();
            default -> "";
        };
    }

    private BasicDocumentValues findBasicDocumentValues(Long bidSeq, String engineerId, EngineerDtos.Profile profile) {
        return jdbcClient.sql("""
                SELECT s.graduation_date, s.schname, s.major,
                       COALESCE(
                           fn_common_code_name('ED', CAST(s.career AS VARCHAR), NULL),
                           fn_common_code_name('ED', LPAD(CAST(s.career AS VARCHAR), 3, '0'), NULL),
                           fn_common_code_name('ED', LPAD(CAST(s.career * 10 AS VARCHAR), 3, '0'), NULL),
                           CAST(s.career AS VARCHAR)
                       ) AS degree_label,
                       l.date_of_issue,
                       COALESCE((SELECT c.cert_name FROM certifications c WHERE c.cert_code = l.license_code AND c.use_yn = TRUE), l.license_code) AS license_name,
                       l.license_no
                FROM pq_engineer_document_value_settings v
                LEFT JOIN pq_engineer_school s ON s.id = v.selected_education_id AND s.engr_id = v.engineer_id
                LEFT JOIN pq_engineer_license l ON l.id = v.selected_license_id AND l.engr_id = v.engineer_id
                WHERE v.bid_seq = :bidSeq AND v.engineer_id = :engineerId
                """)
                .params(Map.of("bidSeq", bidSeq, "engineerId", engineerId))
                .query((rs, rowNum) -> new BasicDocumentValues(
                        rs.getString("schname"), rs.getString("degree_label"), rs.getString("major"),
                        rs.getString("graduation_date"), rs.getString("license_name"), rs.getString("date_of_issue"),
                        profile.basic().grade(), rs.getString("license_no"), formatLicenseCareer(rs.getString("date_of_issue"))))
                .optional()
                .orElseGet(() -> new BasicDocumentValues("", "", "", "", "", "", profile.basic().grade(), "", ""));
    }

    private String formatLicenseCareer(String issueDate) {
        LocalDate issue = parseDate(issueDate);
        if (issue == null || issue.isAfter(LocalDate.now())) return "";
        Period period = Period.between(issue, LocalDate.now());
        return period.getYears() + "년" + period.getMonths() + "개월";
    }

    private LocalDate parseDate(String value) {
        if (!StringUtils.hasText(value)) return null;
        String digits = value.replaceAll("\\D", "");
        if (digits.length() != 8) return null;
        try {
            return LocalDate.parse(digits, DateTimeFormatter.BASIC_ISO_DATE);
        } catch (DateTimeParseException exception) {
            return null;
        }
    }

    private String normalizeMappedValue(String fieldName, String value) {
        if (value == null || fieldName == null || !fieldName.toLowerCase(Locale.ROOT).contains("xx")) {
            return value;
        }
        return value.replaceAll("\\R", "").replace(" ", "\u00A0");
    }

    private void setMappedCellText(Element cell, String fieldName, String value) {
        setCellText(cell, normalizeMappedValue(fieldName, value));
        if (fieldName == null || !fieldName.toLowerCase(Locale.ROOT).contains("xx")) {
            return;
        }

        NodeList lineBreaks = cell.getElementsByTagNameNS(HWP_NS, "lineBreak");
        List<Node> removableLineBreaks = new ArrayList<>();
        for (int index = 0; index < lineBreaks.getLength(); index++) {
            removableLineBreaks.add(lineBreaks.item(index));
        }
        removableLineBreaks.forEach((lineBreak) -> lineBreak.getParentNode().removeChild(lineBreak));
    }

    private record BasicDocumentValues(
            String school, String degree, String major, String graduationDate,
            String licenseName, String licenseIssueDate, String licenseGrade,
            String licenseNo, String licenseCareer
    ) {
    }

    private String historyValue(String field, EngineerDtos.Career history, Integer sequence, String fieldName) {
        if (history == null) return "";
        String formattedValue = HwpxFieldFormatter.format(fieldName, history);
        if (formattedValue != null) return formattedValue;
        return switch (field) {
            case "seq" -> sequence == null ? "" : String.format("%03d", sequence);
            case "compName" -> history.compName();
            case "entryDate" -> history.entryDt();
            case "retireDate" -> history.retireDt();
            case "deptName" -> history.deptName();
            case "grade" -> history.grade();
            case "duty" -> history.duty();
            default -> "";
        };
    }

    private String reviewValue(String field, EngineerProjectHistoryReviewResponse review, String fieldName) {
        if (review == null) return "";
        String formattedValue = HwpxFieldFormatter.format(fieldName, review);
        if (formattedValue != null) return formattedValue;
        return switch (field) {
            case "seq" -> string(review.seq());
            case "jobName" -> review.jobName();
            case "summary" -> review.summary();
            case "contractAmt" -> string(review.contractAmt());
            case "ownAmt" -> string(review.ownAmt());
            case "divisionRate" -> string(review.divisionRate());
            case "contractTerm" -> review.contractTerm();
            case "workTerm" -> review.workTerm();
            case "contractFromDate" -> review.contractFromDate();
            case "contractToDate" -> review.contractToDate();
            case "startDate" -> review.startDate();
            case "endDate" -> review.endDate();
            case "compName" -> review.compName();
            case "orderClient" -> review.orderClient();
            case "grade" -> review.grade();
            case "duty" -> review.duty();
            case "proPart" -> review.proPart();
            case "jobClass" -> review.jobClass();
            case "method" -> review.method();
            case "jobTag" -> review.jobTag();
            case "jobPart" -> review.jobPart();
            case "deptName" -> review.deptName();
            case "returnYn" -> review.returnYn();
            case "joinYn" -> review.joinYn();
            case "joinDay" -> string(review.joinDay());
            case "partDay" -> string(review.partDay());
            case "selectDay" -> string(review.selectDay());
            case "remark" -> review.remark();
            default -> "";
        };
    }

    private Set<String> namedCells(Element row) {
        Set<String> names = new LinkedHashSet<>();
        NodeList cells = row.getElementsByTagNameNS(HWP_NS, "tc");
        for (int index = 0; index < cells.getLength(); index++) {
            String name = ((Element) cells.item(index)).getAttribute("name");
            if (StringUtils.hasText(name)) names.add(name);
        }
        return names;
    }

    private boolean isInsideRepeatableRow(Element cell, Map<String, String> mappings) {
        for (Node parent = cell.getParentNode(); parent != null; parent = parent.getParentNode()) {
            if (!(parent instanceof Element element) || !"tr".equals(element.getLocalName())) {
                continue;
            }
            return mappings.entrySet().stream()
                    .anyMatch(mapping -> mapping.getValue() != null
                            && isRepeatablePath(mapping.getValue())
                            && namedCells(element).contains(mapping.getKey()));
        }
        return false;
    }

    private boolean isRepeatablePath(String path) {
        return path.startsWith("row.") || path.startsWith("history.");
    }

    private void increaseTableHeight(Node parent, Element templateRow, int addedRowCount) {
        if (!(parent instanceof Element table) || !"tbl".equals(table.getLocalName()) || addedRowCount <= 0) return;
        long rowHeight = directChildren(templateRow, "tc").stream()
                .mapToLong(cell -> firstLongAttribute(cell, "cellSz", "height"))
                .max()
                .orElse(0L);
        if (rowHeight <= 0) return;
        directChildren(table, "sz").stream().findFirst().ifPresent(size -> {
            long currentHeight = parseLong(size.getAttribute("height"));
            if (currentHeight > 0) size.setAttribute("height", String.valueOf(currentHeight + rowHeight * addedRowCount));
        });
    }

    private void normalizeTables(Document document) {
        NodeList tables = document.getElementsByTagNameNS(HWP_NS, "tbl");
        for (int tableIndex = 0; tableIndex < tables.getLength(); tableIndex++) {
            Element table = (Element) tables.item(tableIndex);
            List<Element> rows = directChildren(table, "tr");
            table.setAttribute("rowCnt", String.valueOf(rows.size()));
            for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
                for (Element cell : directChildren(rows.get(rowIndex), "tc")) {
                    NodeList addresses = cell.getElementsByTagNameNS(HWP_NS, "cellAddr");
                    if (addresses.getLength() > 0) ((Element) addresses.item(0)).setAttribute("rowAddr", String.valueOf(rowIndex));
                }
            }
        }
    }

    private List<Element> directChildren(Element parent, String localName) {
        List<Element> children = new ArrayList<>();
        for (Node child = parent.getFirstChild(); child != null; child = child.getNextSibling()) {
            if (child.getNodeType() == Node.ELEMENT_NODE && localName.equals(child.getLocalName())) children.add((Element) child);
        }
        return children;
    }

    private long firstLongAttribute(Element parent, String childName, String attributeName) {
        NodeList children = parent.getElementsByTagNameNS(HWP_NS, childName);
        return children.getLength() == 0 ? 0L : parseLong(((Element) children.item(0)).getAttribute(attributeName));
    }

    private long parseLong(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException exception) {
            return 0L;
        }
    }

    private void setCellText(Element cell, String value) {
        NodeList subLists = cell.getElementsByTagNameNS(HWP_NS, "subList");
        if (subLists.getLength() == 0) return;
        NodeList paragraphs = ((Element) subLists.item(0)).getElementsByTagNameNS(HWP_NS, "p");
        if (paragraphs.getLength() == 0) return;
        Element paragraph = (Element) paragraphs.item(0);
        List<Node> runs = new ArrayList<>();
        for (Node child = paragraph.getFirstChild(); child != null; child = child.getNextSibling()) {
            if (child.getNodeType() == Node.ELEMENT_NODE && "run".equals(child.getLocalName())) runs.add(child);
        }
        Element run;
        if (runs.isEmpty()) {
            run = paragraph.getOwnerDocument().createElementNS(HWP_NS, "hp:run");
        } else {
            // Keep the template run's charPrIDRef. Dropping it makes HWPX fall back to
            // an unexpected character style and can cause long values to overlap.
            run = (Element) runs.get(0);
            for (int index = 1; index < runs.size(); index++) {
                paragraph.removeChild(runs.get(index));
            }
            List<Node> runChildren = new ArrayList<>();
            for (Node child = run.getFirstChild(); child != null; child = child.getNextSibling()) {
                runChildren.add(child);
            }
            runChildren.forEach(run::removeChild);
        }
        String sourceValue = value == null ? "" : value;
        String[] lines = sourceValue.split("\\r\\n|\\r|\\n", -1);
        Element text = paragraph.getOwnerDocument().createElementNS(HWP_NS, "hp:t");
        text.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
        for (int index = 0; index < lines.length; index++) {
            text.appendChild(paragraph.getOwnerDocument().createTextNode(lines[index]));
            if (index < lines.length - 1) {
                text.appendChild(paragraph.getOwnerDocument().createElementNS(HWP_NS, "hp:lineBreak"));
            }
        }
        run.appendChild(text);

        if (run.getParentNode() != paragraph) {
            paragraph.insertBefore(run, paragraph.getFirstChild());
        }

        // linesegarray is a cached layout result from the empty template cell.
        // Keeping it after replacing the text leaves stale line widths/baselines.
        List<Node> lineSegments = new ArrayList<>();
        for (Node child = paragraph.getFirstChild(); child != null; child = child.getNextSibling()) {
            if (child.getNodeType() == Node.ELEMENT_NODE && "linesegarray".equals(child.getLocalName())) {
                lineSegments.add(child);
            }
        }
        lineSegments.forEach(paragraph::removeChild);
    }

    private List<Element> elements(NodeList nodes) {
        List<Element> result = new ArrayList<>();
        for (int index = 0; index < nodes.getLength(); index++) result.add((Element) nodes.item(index));
        return result;
    }

    private Set<String> collectFields(Map<String, byte[]> entries) {
        Set<String> fields = new LinkedHashSet<>();
        entries.forEach((name, content) -> {
            if (!isSection(name)) return;
            try {
                Document document = documentBuilder().newDocumentBuilder().parse(new ByteArrayInputStream(content));
                NodeList cells = document.getElementsByTagNameNS(HWP_NS, "tc");
                for (int index = 0; index < cells.getLength(); index++) {
                    String field = ((Element) cells.item(index)).getAttribute("name");
                    if (StringUtils.hasText(field)) fields.add(field);
                }
            } catch (Exception exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "HWPX 양식의 XML을 읽을 수 없습니다.", exception);
            }
        });
        return fields;
    }

    private Map<String, byte[]> readZip(MultipartFile template) {
        Map<String, byte[]> entries = new LinkedHashMap<>();
        try (InputStream input = template.getInputStream(); ZipInputStream zip = new ZipInputStream(input, StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) entries.put(entry.getName(), zip.readAllBytes());
            return entries;
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "HWPX 양식을 읽을 수 없습니다.", exception);
        }
    }

    private byte[] readBytes(MultipartFile file) {
        try { return file.getBytes(); } catch (IOException exception) { throw new IllegalStateException("HWPX 양식을 읽을 수 없습니다.", exception); }
    }

    private void validateRequest(MultipartFile template, HwpxGenerateRequest request) {
        if (template == null || template.isEmpty() || !template.getOriginalFilename().toLowerCase().endsWith(".hwpx"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "HWPX 양식을 업로드해 주세요.");
        if (request == null || request.bidSeq() == null || request.engineerIds() == null || request.engineerIds().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "공고와 기술인을 선택해 주세요.");
    }

    private boolean isSection(String name) { return name.startsWith(SECTION_PATTERN) && name.endsWith(".xml"); }
    private String string(Object value) { return value == null ? "" : String.valueOf(value); }

    private String age(String birthday) {
        if (!StringUtils.hasText(birthday)) return "";
        LocalDate birthDate;
        try {
            birthDate = LocalDate.parse(birthday.replaceAll("\\D", ""), DateTimeFormatter.BASIC_ISO_DATE);
        } catch (DateTimeParseException exception) {
            return "";
        }
        LocalDate today = LocalDate.now();
        if (today.isBefore(birthDate)) return "";
        return "만 " + Period.between(birthDate, today).getYears() + "세";
    }
    private String safeFilename(String name, String fallback) { return (StringUtils.hasText(name) ? name : fallback).replaceAll("[\\\\/:*?\"<>|]", "_"); }
    private DocumentBuilderFactory documentBuilder() {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);
            return factory;
        } catch (Exception exception) {
            throw new IllegalStateException("HWPX XML 파서를 초기화하지 못했습니다.", exception);
        }
    }
}
