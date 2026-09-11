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
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.HashMap;
import java.util.TreeMap;
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
import com.cheil.cheil_be.domain.companyperformance.CompanyPerformance;
import com.cheil.cheil_be.application.engineer.EngineerAdminService;
import com.cheil.cheil_be.application.engineer.EngineerDtos;

/** HWPX 템플릿을 분석하고 기술인별 데이터로 산출물을 생성하는 서비스. */
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
            Map<Long, List<HwpxFieldFormatter.ContractPeriod>> contractPeriods = findContractPeriods(reviews);
            Map<Long, List<HwpxFieldFormatter.ContractPeriod>> participationPeriods =
                    findParticipationPeriods(engineerId, reviews);
            Map<Long, String> jobRatios = findJobRatios(reviews);
            byte[] output = render(templateBytes, profile, basicValues, bidNotice, reviews, contractPeriods,
                    participationPeriods, jobRatios, request.mappings());
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

    /** 회사실적 전용 서비스가 전달한 데이터를 HWPX 문서로 렌더링한다. */
    public byte[] renderCompanyPerformances(
            MultipartFile template,
            List<CompanyPerformance> performances,
            Map<Long, String> contractPeriods,
            Map<Long, String> jobRatios,
            Map<String, String> jobTypeNames,
            Map<String, String> mappings
    ) {
        byte[] source = readBytes(template);
        return renderCompanies(source, performances,
                contractPeriods == null ? Map.of() : contractPeriods,
                jobRatios == null ? Map.of() : jobRatios,
                jobTypeNames == null ? Map.of() : jobTypeNames,
                mappings);
    }

    public byte[] renderWorkOverlap(
            MultipartFile template,
            Long bidSeq,
            String workDutyId,
            List<String> engineerIds,
            String referenceDate,
            Map<String, String> mappings
    ) {
        if (template == null || template.isEmpty() || bidSeq == null || !StringUtils.hasText(workDutyId)
                || engineerIds == null || engineerIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "HWPX 양식과 업무중복도 계약 데이터를 확인해 주세요.");
        }
        List<Map<String, String>> rows = findWorkOverlapRows(bidSeq, workDutyId, engineerIds, referenceDate);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "선택된 기술인의 업무중복도 계약을 확인해 주세요.");
        }
        byte[] source = readBytes(template);
        Map<String, byte[]> packageEntries = readZip(template);
        Map<String, String> boldCharPrByBase = findBoldCharPrByBase(packageEntries.get("Contents/header.xml"));
        Map<String, String> mappingValues = mappings == null ? Map.of() : mappings;
        try (ZipInputStream input = new ZipInputStream(new ByteArrayInputStream(source), StandardCharsets.UTF_8);
             ByteArrayOutputStream bytes = new ByteArrayOutputStream();
             ZipOutputStream output = new ZipOutputStream(bytes, StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = input.getNextEntry()) != null) {
                byte[] content = input.readAllBytes();
                if (isSection(entry.getName())) {
                    content = renderWorkOverlapSection(content, rows, mappingValues, boldCharPrByBase);
                }
                writeZipEntry(output, entry.getName(), content, "mimetype".equals(entry.getName()));
            }
            output.finish();
            byte[] result = bytes.toByteArray();
            validateGeneratedPackage(result);
            return result;
        } catch (Exception exception) {
            throw new IllegalStateException("업무중복도 HWPX 문서 생성에 실패했습니다.", exception);
        }
    }

    private List<Map<String, String>> findWorkOverlapRows(Long bidSeq, String workDutyId, List<String> engineerIds, String referenceDate) {
        String normalizedReferenceDate = StringUtils.hasText(referenceDate)
                ? referenceDate.replaceAll("[^0-9]", "")
                : LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        LocalDate baseDate;
        try {
            baseDate = LocalDate.parse(normalizedReferenceDate, DateTimeFormatter.BASIC_ISO_DATE);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "기준일은 yyyy-MM-dd 형식이어야 합니다.");
        }
        List<Map<String, String>> rows = jdbcClient.sql("""
                        SELECT w.engr_id, COALESCE(de.responsibility, w.responsibility) AS responsibility,
                               m.namekor, m.birthday, m.propart,
                               COALESCE(specialty.code_detail_name, specialty.code_name, m.propart) AS specialty,
                               c.contract_no, c.service_type, c.client_name, c.service_name,
                               c.contract_amount, c.share_amount,
                               c.joint_contract_ratio,
                               c.construction_start_date, c.construction_complete_date,
                               c.construction_stop_from_date,
                               c.management_service_complete_date,
                               w.display_order,
                               c.remark, e.participation_type, e.pq_target_yn
                        FROM work_overlap_document_targets w
                        JOIN work_overlap_contracts c ON c.contract_no = w.contract_no
                        LEFT JOIN pq_engineer_master m ON m.engr_id = w.engr_id
                        LEFT JOIN work_overlap_document_engineers de
                               ON de.bid_seq = w.bid_seq AND de.work_duty_id = w.work_duty_id AND de.engr_id = w.engr_id
                        LEFT JOIN common_codes specialty
                               ON specialty.code_level = 3 AND specialty.level1_code = 'PQ'
                              AND specialty.level2_code = 'PA' AND specialty.level3_code = m.propart
                        LEFT JOIN work_overlap_contract_engineers e
                               ON e.contract_no = w.contract_no AND e.engr_id = w.engr_id
                        WHERE w.bid_seq = :bidSeq
                          AND w.work_duty_id = :workDutyId
                          AND w.engr_id IN (:engineerIds)
                        ORDER BY w.engr_id, w.display_order NULLS LAST, w.target_id
                        """)
                .param("bidSeq", bidSeq)
                .param("workDutyId", workDutyId.trim())
                .param("engineerIds", engineerIds.stream().filter(StringUtils::hasText).map(String::trim).distinct().toList())
                .query((rs, rowNum) -> {
                    Map<String, String> row = new LinkedHashMap<>();
                    row.put("engineer.id", string(rs.getString("engr_id")));
                    row.put("row.seq", string(rs.getObject("display_order")));
                    String engineerName = string(rs.getString("namekor"));
                    String responsibility = string(rs.getString("responsibility"));
                    String specialty = string(rs.getString("specialty"));
                    String specialtyLabel = StringUtils.hasText(specialty) ? specialty + "분야" : "";
                    String engineerLabel = "사업책임".equals(responsibility.replaceAll("\\s+", ""))
                            ? "사업책임기술인 : " + engineerName
                            : specialtyLabel + " " + responsibility + "기술인 : " + engineerName;
                    row.put("engineer.name", "□ " + engineerLabel.trim());
                    row.put("engineer.birthDate", string(rs.getString("birthday")));
                    row.put("engineer.specialtyField", specialty);
                    row.put("engineer.responsibility", responsibility);
                    row.put("row.contractNo", string(rs.getString("contract_no")));
                    row.put("row.serviceType", string(rs.getString("service_type")));
                    row.put("row.serviceName", string(rs.getString("service_name")));
                    row.put("row.clientName", string(rs.getString("client_name")));
                    row.put("row.contractAmount", string(rs.getBigDecimal("contract_amount")));
                    row.put("row.shareAmount", string(rs.getBigDecimal("share_amount")));
                    row.put("row.jointContractRatio", string(rs.getString("joint_contract_ratio")));
                    row.put("row.constructionStartDate", string(rs.getString("construction_start_date")));
                    row.put("row.constructionCompleteDate", string(rs.getString("construction_complete_date")));
                    row.put("row.constructionStopFromDate", string(rs.getString("construction_stop_from_date")));
                    row.put("row.managementServiceCompleteDate", string(rs.getString("management_service_complete_date")));
                    row.put("row.participationType", string(rs.getString("participation_type")));
                    row.put("row.pqTargetYn", rs.getObject("pq_target_yn") == null ? "" : (rs.getBoolean("pq_target_yn") ? "Y" : "N"));
                    row.put("row.remark", string(rs.getString("remark")));
                    String completeDate = rs.getString("construction_complete_date");
                    row.put("row.remainingPeriod", formatRemainingPeriod(completeDate, baseDate));
                    return row;
                })
                .list();
        Map<String, Integer> fallbackSequences = new HashMap<>();
        rows.forEach(row -> {
            if (!StringUtils.hasText(row.get("row.seq"))) {
                String engineerId = row.getOrDefault("engineer.id", "");
                int sequence = fallbackSequences.merge(engineerId, 1, Integer::sum);
                row.put("row.seq", String.valueOf(sequence));
            }
        });
        Map<String, BigDecimal> contractTotals = rows.stream().collect(java.util.stream.Collectors.groupingBy(
                row -> row.getOrDefault("engineer.id", ""), LinkedHashMap::new,
                java.util.stream.Collectors.reducing(BigDecimal.ZERO,
                        row -> parseDecimal(row.get("row.contractAmount")), BigDecimal::add)));
        rows.forEach(row -> {
            String engineerId = row.get("engineer.id");
            BigDecimal contractTotal = contractTotals.getOrDefault(engineerId, BigDecimal.ZERO);
            row.put("row.totalContractAmount", row.getOrDefault("row.contractAmount", ""));
            row.put("row.totalShareAmount", row.getOrDefault("row.shareAmount", ""));
            row.put("row.totalContractAmountMillion", formatMillion(contractTotal));
        });
        return rows;
    }

    private boolean isWorkOverlapDetailPath(String path) {
        return StringUtils.hasText(path) && path.startsWith("row.") && !"row.totalContractAmountMillion".equals(path);
    }

    private String resolveWorkOverlapValue(String path, String fieldName, Map<String, String> row) {
        if ("row.servicePeriod".equals(path)) {
            return formatWorkOverlapPeriod(fieldName, row);
        }
        if ("row.totalServiceDays".equals(path)) {
            return formatTotalServiceDays(row);
        }
        if ("row.jointContractRatioWithTotalContract".equals(path)
                || isJointContractRatioAmountField(fieldName)) {
            return formatJointContractRatioWithTotalContract(fieldName, row);
        }
        if (isWorkOverlapDatePath(path)) {
            return formatWorkOverlapDate(row.get(path), fieldName);
        }
        if (isWorkOverlapAmountPath(path)) {
            return formatWorkOverlapAmount(path, fieldName, row);
        }
        return row.getOrDefault(path, "");
    }

    private boolean isJointContractRatioAmountField(String fieldName) {
        String normalized = fieldName == null
                ? ""
                : fieldName.replaceAll("[\\s_\\-./()\\[\\]{}:：]", "").toLowerCase(Locale.ROOT);
        return normalized.contains("pq공동지분내역") && normalized.contains("총계약금액");
    }

    private boolean isWorkOverlapDatePath(String path) {
        return Set.of(
                "row.constructionStartDate",
                "row.constructionCompleteDate",
                "row.constructionStopFromDate",
                "row.managementServiceCompleteDate"
        ).contains(path);
    }

    private boolean isWorkOverlapAmountPath(String path) {
        return Set.of(
                "row.contractAmount",
                "row.shareAmount",
                "row.totalContractAmount",
                "row.shareAmountWithTotalContract",
                "row.totalContractAmountWithShare",
                "row.jointContractRatioWithTotalContract"
        ).contains(path);
    }

    private String formatWorkOverlapPeriod(String fieldName, Map<String, String> row) {
        String pattern = workOverlapDatePattern(fieldName, "yy.MM.dd");
        String startDate = formatWorkOverlapDatePattern(row.get("row.constructionStartDate"), pattern);
        String completeDate = formatWorkOverlapDatePattern(row.get("row.constructionCompleteDate"), pattern);
        if (!StringUtils.hasText(startDate) && !StringUtils.hasText(completeDate)) {
            return "";
        }

        String period = startDate + "\n~\n" + completeDate;
        String stopDate = formatWorkOverlapDatePattern(row.get("row.constructionStopFromDate"), pattern);
        return StringUtils.hasText(stopDate) ? period + "\n(" + stopDate + ")" : period;
    }

    private String formatWorkOverlapDatePattern(String value, String pattern) {
        LocalDate date = parseDate(value);
        return date == null ? "" : date.format(DateTimeFormatter.ofPattern(pattern));
    }

    private String formatWorkOverlapDate(String value, String fieldName) {
        String pattern = workOverlapDatePattern(fieldName, null);
        return pattern == null ? string(value) : formatWorkOverlapDatePattern(value, pattern);
    }

    private String workOverlapDatePattern(String fieldName, String defaultPattern) {
        String normalized = fieldName == null ? "" : fieldName.toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
        if (normalized.contains("yyyy-mm-dd")) return "yyyy-MM-dd";
        if (normalized.contains("yy.mm.dd")) return "yy.MM.dd";
        return defaultPattern;
    }

    private String formatTotalServiceDays(Map<String, String> row) {
        LocalDate startDate = parseDate(row.get("row.constructionStartDate"));
        LocalDate completeDate = parseDate(row.get("row.constructionCompleteDate"));
        if (startDate == null || completeDate == null) return "";
        return String.valueOf(java.time.temporal.ChronoUnit.DAYS.between(startDate, completeDate) + 1);
    }

    private String formatWorkOverlapAmount(String path, String fieldName, Map<String, String> row) {
        String primaryPath = switch (path) {
            case "row.shareAmount", "row.shareAmountWithTotalContract" -> "row.shareAmount";
            default -> "row.contractAmount";
        };
        String primary = formatWorkOverlapAmount(row.get(primaryPath), fieldName);
        if ("row.shareAmountWithTotalContract".equals(path)) {
            return primary + "\n(" + formatWorkOverlapAmount(row.get("row.contractAmount"), fieldName) + ")";
        }
        if ("row.totalContractAmountWithShare".equals(path)) {
            return primary + "\n(" + formatWorkOverlapAmount(row.get("row.shareAmount"), fieldName) + ")";
        }
        return primary;
    }

    private String formatWorkOverlapAmount(String value, String fieldName) {
        BigDecimal amount = parseDecimal(value);
        String normalized = fieldName == null ? "" : fieldName.replaceAll("\\s+", "");
        BigDecimal divisor = normalized.contains("백만") ? BigDecimal.valueOf(1_000_000L)
                : normalized.contains("억") ? BigDecimal.valueOf(100_000_000L)
                : normalized.contains("만") ? BigDecimal.valueOf(10_000L)
                : normalized.contains("천") ? BigDecimal.valueOf(1_000L)
                : BigDecimal.ONE;
        return NumberFormat.getIntegerInstance(Locale.KOREA)
                .format(amount.divide(divisor, 0, RoundingMode.DOWN));
    }

    private String formatJointContractRatioWithTotalContract(String fieldName, Map<String, String> row) {
        String ratio = row.getOrDefault("row.jointContractRatio", "");
        String amount = formatWorkOverlapAmount(row.get("row.contractAmount"), fieldName);
        String unit = workOverlapAmountUnit(fieldName);
        if (!StringUtils.hasText(ratio)) {
            return StringUtils.hasText(amount) ? "총계약금액\n" + amount + unit : "";
        }
        return ratio + "\n총계약금액\n" + amount + unit;
    }

    private String workOverlapAmountUnit(String fieldName) {
        String normalized = fieldName == null ? "" : fieldName.replaceAll("\\s+", "");
        if (normalized.contains("\uBC31\uB9CC")) return "백만원";
        if (normalized.contains("\uC5B5")) return "억원";
        if (normalized.contains("\uB9CC")) return "만원";
        if (normalized.contains("\uCC9C")) return "천원";
        return "원";
    }

    private BigDecimal parseDecimal(String value) {
        try { return value == null || value.isBlank() ? BigDecimal.ZERO : new BigDecimal(value); }
        catch (NumberFormatException exception) { return BigDecimal.ZERO; }
    }

    private String formatMillion(BigDecimal value) {
        return NumberFormat.getIntegerInstance(Locale.KOREA).format(value.divide(BigDecimal.valueOf(1_000_000L), 0, RoundingMode.DOWN));
    }

    private String formatRemainingPeriod(String completeDate, LocalDate baseDate) {
        try {
            LocalDate complete = LocalDate.parse(completeDate.replaceAll("[^0-9]", ""), DateTimeFormatter.BASIC_ISO_DATE);
            long days = java.time.temporal.ChronoUnit.DAYS.between(baseDate, complete) + 1;
            BigDecimal months = BigDecimal.valueOf(days).divide(BigDecimal.valueOf(30L), 1, RoundingMode.DOWN);
            return days + "일\n(" + months.toPlainString() + "개월)";
        } catch (Exception exception) {
            return "";
        }
    }

    private byte[] renderWorkOverlapSection(
            byte[] source,
            List<Map<String, String>> rows,
            Map<String, String> mappings,
            Map<String, String> boldCharPrByBase
    ) throws Exception {
        Document document = documentBuilder().newDocumentBuilder().parse(new ByteArrayInputStream(source));
        NodeList cells = document.getElementsByTagNameNS("*", "tc");
        Set<Element> mappedTables = new LinkedHashSet<>();
        for (int index = 0; index < cells.getLength(); index++) {
            Element cell = (Element) cells.item(index);
            if (!StringUtils.hasText(mappings.get(cell.getAttribute("name")))) continue;
            Node parent = cell.getParentNode();
            while (parent instanceof Element && !"tbl".equals(parent.getLocalName())) parent = parent.getParentNode();
            if (parent instanceof Element table) mappedTables.add(table);
        }
        Map<String, List<Map<String, String>>> rowsByEngineer = rows.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        row -> row.getOrDefault("engineer.id", ""),
                        LinkedHashMap::new,
                        java.util.stream.Collectors.toList()));
        for (Element templateTable : mappedTables) {
            Node parent = templateTable.getParentNode();
            Node nextSibling = templateTable.getNextSibling();
            for (List<Map<String, String>> engineerRows : rowsByEngineer.values()) {
                Element renderedTable = (Element) templateTable.cloneNode(true);
                Map<String, String> engineerRow = engineerRows.get(0);
                List<Element> detailRows = elements(renderedTable.getElementsByTagNameNS("*", "tr")).stream()
                        .filter(row -> directChildren(row, "tc").stream()
                                .map(cell -> mappings.get(cell.getAttribute("name")))
                                .anyMatch(this::isWorkOverlapDetailPath))
                        .toList();
                Set<Element> detailRowSet = Collections.newSetFromMap(new IdentityHashMap<>());
                detailRowSet.addAll(detailRows);
                NodeList renderedCells = renderedTable.getElementsByTagNameNS("*", "tc");
                for (int cellIndex = 0; cellIndex < renderedCells.getLength(); cellIndex++) {
                    Element cell = (Element) renderedCells.item(cellIndex);
                    String field = cell.getAttribute("name");
                    String path = mappings.get(field);
                    if (StringUtils.hasText(path) && !isInsideWorkOverlapDetailRow(cell, detailRowSet)) {
                        setWorkOverlapCellText(cell, field, path, resolveWorkOverlapValue(path, field, engineerRow), boldCharPrByBase);
                    }
                }
                for (Element detailRow : detailRows) {
                    Node rowParent = detailRow.getParentNode();
                    Node rowNextSibling = detailRow.getNextSibling();
                    for (Map<String, String> contractRow : engineerRows) {
                        Element renderedRow = (Element) detailRow.cloneNode(true);
                        NodeList rowCells = renderedRow.getElementsByTagNameNS("*", "tc");
                        for (int cellIndex = 0; cellIndex < rowCells.getLength(); cellIndex++) {
                            Element cell = (Element) rowCells.item(cellIndex);
                            String field = cell.getAttribute("name");
                            String path = mappings.get(field);
                            if (StringUtils.hasText(path)) {
                                setWorkOverlapCellText(cell, field, path, resolveWorkOverlapValue(path, field, contractRow), boldCharPrByBase);
                            }
                        }
                        rowParent.insertBefore(renderedRow, rowNextSibling);
                    }
                    rowParent.removeChild(detailRow);
                }
                parent.insertBefore(renderedTable, nextSibling);
            }
            parent.removeChild(templateTable);
        }
        normalizeTables(document);
        var transformer = TransformerFactory.newInstance().newTransformer();
        transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
        transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "no");
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        transformer.transform(new DOMSource(document), new StreamResult(output));
        return output.toByteArray();
    }

    private boolean isInsideWorkOverlapDetailRow(Element cell, Set<Element> detailRows) {
        for (Node parent = cell.getParentNode(); parent != null; parent = parent.getParentNode()) {
            if (parent instanceof Element element && "tr".equals(element.getLocalName())) {
                return detailRows.contains(element);
            }
        }
        return false;
    }

    private void setWorkOverlapCellText(
            Element cell,
            String fieldName,
            String path,
            String value,
            Map<String, String> boldCharPrByBase
    ) {
        if ("row.servicePeriod".equals(path)
                && StringUtils.hasText(value)
                && value.contains("\n(")
                && !boldCharPrByBase.isEmpty()) {
            setCellTextWithBoldSuffix(cell, value, boldCharPrByBase);
            return;
        }
        setMappedCellText(cell, fieldName, value);
    }

    private void setCellTextWithBoldSuffix(Element cell, String value, Map<String, String> boldCharPrByBase) {
        NodeList subLists = cell.getElementsByTagNameNS("*", "subList");
        if (subLists.getLength() == 0) return;
        NodeList paragraphs = ((Element) subLists.item(0)).getElementsByTagNameNS("*", "p");
        if (paragraphs.getLength() == 0) return;
        Element paragraph = (Element) paragraphs.item(0);
        List<Element> runs = directChildren(paragraph, "run");
        Element templateRun = runs.isEmpty()
                ? paragraph.getOwnerDocument().createElementNS(HWP_NS, "hp:run")
                : (Element) runs.get(0).cloneNode(false);
        String baseCharPrId = templateRun.getAttribute("charPrIDRef");
        String boldCharPrId = boldCharPrByBase.get(baseCharPrId);
        if (!StringUtils.hasText(boldCharPrId)) {
            setCellText(cell, value);
            return;
        }

        runs.forEach(paragraph::removeChild);
        int boldStart = value.lastIndexOf("\n(");
        appendTextRun(paragraph, templateRun, value.substring(0, boldStart + 1), baseCharPrId);
        appendTextRun(paragraph, templateRun, value.substring(boldStart + 1), boldCharPrId);
        removeLineSegments(paragraph);
    }

    private void appendTextRun(Element paragraph, Element templateRun, String value, String charPrId) {
        if (value.isEmpty()) return;
        Element run = (Element) templateRun.cloneNode(false);
        if (StringUtils.hasText(charPrId)) {
            run.setAttribute("charPrIDRef", charPrId);
        }
        Element text = paragraph.getOwnerDocument().createElementNS(HWP_NS, "hp:t");
        text.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
        String[] lines = value.split("\\r\\n|\\r|\\n", -1);
        for (int index = 0; index < lines.length; index++) {
            text.appendChild(paragraph.getOwnerDocument().createTextNode(lines[index]));
            if (index < lines.length - 1) {
                text.appendChild(paragraph.getOwnerDocument().createElementNS(HWP_NS, "hp:lineBreak"));
            }
        }
        run.appendChild(text);
        paragraph.appendChild(run);
    }

    private void removeLineSegments(Element paragraph) {
        List<Node> lineSegments = new ArrayList<>();
        for (Node child = paragraph.getFirstChild(); child != null; child = child.getNextSibling()) {
            if (child.getNodeType() == Node.ELEMENT_NODE && "linesegarray".equals(child.getLocalName())) {
                lineSegments.add(child);
            }
        }
        lineSegments.forEach(paragraph::removeChild);
    }

    private Map<String, String> findBoldCharPrByBase(byte[] headerSource) {
        if (headerSource == null || headerSource.length == 0) return Map.of();
        try {
            Document header = documentBuilder().newDocumentBuilder().parse(new ByteArrayInputStream(headerSource));
            List<Element> charProperties = elements(header.getElementsByTagNameNS("*", "charPr"));
            List<Element> boldProperties = charProperties.stream()
                    .filter(this::hasBoldChild)
                    .toList();
            Map<String, String> result = new LinkedHashMap<>();
            for (Element bold : boldProperties) {
                charProperties.stream()
                        .filter(candidate -> !hasBoldChild(candidate))
                        .filter(candidate -> charPrSignature(candidate).equals(charPrSignature(bold)))
                        .findFirst()
                        .ifPresent(base -> result.putIfAbsent(base.getAttribute("id"), bold.getAttribute("id")));
            }
            return result;
        } catch (Exception exception) {
            return Map.of();
        }
    }

    private boolean hasBoldChild(Element charPr) {
        return elements(charPr.getChildNodes()).stream().anyMatch(child -> "bold".equals(child.getLocalName()));
    }

    private String charPrSignature(Element charPr) {
        Map<String, String> attributes = new TreeMap<>();
        for (int index = 0; index < charPr.getAttributes().getLength(); index++) {
            Node attribute = charPr.getAttributes().item(index);
            if (!"id".equals(attribute.getNodeName())) attributes.put(attribute.getNodeName(), attribute.getNodeValue());
        }
        StringBuilder signature = new StringBuilder(attributes.toString());
        for (Element child : elements(charPr.getChildNodes())) {
            if ("bold".equals(child.getLocalName())) continue;
            signature.append('|').append(child.getLocalName()).append(attributesSignature(child));
        }
        return signature.toString();
    }

    private String attributesSignature(Element element) {
        Map<String, String> attributes = new TreeMap<>();
        for (int index = 0; index < element.getAttributes().getLength(); index++) {
            Node attribute = element.getAttributes().item(index);
            attributes.put(attribute.getNodeName(), attribute.getNodeValue());
        }
        return attributes.toString();
    }

    private byte[] renderCompanies(
            byte[] source,
            List<CompanyPerformance> performances,
            Map<Long, String> contractPeriods,
            Map<Long, String> jobRatios,
            Map<String, String> jobTypeNames,
            Map<String, String> mappings
    ) {
        try {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            try (ZipInputStream input = new ZipInputStream(new ByteArrayInputStream(source), StandardCharsets.UTF_8);
                 ZipOutputStream output = new ZipOutputStream(bytes, StandardCharsets.UTF_8)) {
                ZipEntry entry;
                while ((entry = input.getNextEntry()) != null) {
                    byte[] content = input.readAllBytes();
                    if (isSection(entry.getName())) {
                content = renderCompanySection(content, performances, contractPeriods, jobRatios,
                                jobTypeNames == null ? Map.of() : jobTypeNames,
                                mappings == null ? Map.of() : mappings);
                    }
                    writeZipEntry(output, entry.getName(), content, "mimetype".equals(entry.getName()));
                }
            }
            byte[] result = bytes.toByteArray();
            validateGeneratedPackage(result);
            return result;
        } catch (Exception exception) {
            throw new IllegalStateException("회사실적 HWPX 양식에 데이터를 입력하지 못했습니다.", exception);
        }
    }

    private byte[] renderCompanySection(
            byte[] source,
            List<CompanyPerformance> performances,
            Map<Long, String> contractPeriods,
            Map<Long, String> jobRatios,
            Map<String, String> jobTypeNames,
            Map<String, String> mappings
    ) throws Exception {
        Document document = documentBuilder().newDocumentBuilder().parse(new ByteArrayInputStream(source));
        NodeList cells = document.getElementsByTagNameNS("*", "tc");
        Set<Element> mappedRows = new LinkedHashSet<>();
        for (int index = 0; index < cells.getLength(); index++) {
            Element cell = (Element) cells.item(index);
            String field = cell.getAttribute("name");
            String path = mappings.get(field);
            if (StringUtils.hasText(path)) {
                Node parent = cell.getParentNode();
                while (parent instanceof Element && !"tr".equals(parent.getLocalName())) {
                    parent = parent.getParentNode();
                }
                if (parent instanceof Element row) {
                    mappedRows.add(row);
                }
            }
        }

        for (Element templateRow : mappedRows) {
            Node parent = templateRow.getParentNode();
            Node nextSibling = templateRow.getNextSibling();
            for (CompanyPerformance performance : performances) {
                Element renderedRow = (Element) templateRow.cloneNode(true);
                NodeList renderedCells = renderedRow.getElementsByTagNameNS("*", "tc");
                for (int cellIndex = 0; cellIndex < renderedCells.getLength(); cellIndex++) {
                    Element cell = (Element) renderedCells.item(cellIndex);
                    String field = cell.getAttribute("name");
                    String path = mappings.get(field);
                    if (StringUtils.hasText(path)) {
                        setMappedCellText(cell, field, companyValue(path, performance, field, contractPeriods, jobRatios, jobTypeNames));
                    }
                }
                parent.insertBefore(renderedRow, nextSibling);
            }
            parent.removeChild(templateRow);
        }
        normalizeTables(document);
        var transformer = TransformerFactory.newInstance().newTransformer();
        transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
        transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "no");
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        transformer.transform(new DOMSource(document), new StreamResult(output));
        return output.toByteArray();
    }

    private String companyValue(
            String path,
            CompanyPerformance performance,
            String fieldName,
            Map<Long, String> contractPeriods,
            Map<Long, String> jobRatios,
            Map<String, String> jobTypeNames
    ) {
        if (!path.startsWith("row.")) return "";
        return switch (path.substring(4)) {
            case "seq" -> performance.seq() == null ? "" : String.format("%03d", performance.seq());
            case "code" -> string(performance.jobName()) + string(performance.seq());
            case "jobName" -> string(performance.jobName());
            case "orderClient" -> string(performance.orderClient());
            case "contractPeriod" -> StringUtils.hasText(contractPeriods.get(performance.seq()))
                    ? formatCompanyPeriodText(contractPeriods.get(performance.seq()), fieldName)
                    : formatCompanyContractPeriod(performance, fieldName);
            case "contractFromDate" -> formatCompanyDate(performance.contractFromDate(), fieldName);
            case "contractToDate" -> formatCompanyDate(performance.contractToDate(), fieldName);
            case "contractAmt" -> formatCompanyAmount(performance.contractAmt(), fieldName);
            case "ownAmt" -> formatCompanyAmount(performance.ownAmt(), fieldName);
            case "jobRatio" -> {
                String jobRatio = jobRatios.get(performance.seq());
                String value = StringUtils.hasText(jobRatio) ? jobRatio : performance.jobRatio();
                yield fieldName.contains("PQ공동지분내역") ? formatJobRatio(value) : string(value);
            }
            case "divisionRate" -> formatCompanyDivisionRate(performance.divisionRate(), fieldName);
            case "jobType" -> jobTypeNames.getOrDefault(performance.jobType(), string(performance.jobType()));
            case "summary" -> string(performance.summary());
            case "generalManagementYn" -> "Y".equals(performance.generalManagement()) ? "Y" : "N";
            case "stopDate" -> formatCompanyDate(performance.stopDate(), fieldName);
            case "remark" -> string(performance.remark());
            default -> "";
        };
    }

    private String formatCompanyAmount(Number amount, String fieldName) {
        if (amount == null) return "";
        BigDecimal divisor = fieldName.contains("(억)")
                ? BigDecimal.valueOf(100_000_000L)
                : fieldName.contains("(백만)")
                        ? BigDecimal.valueOf(1_000_000L)
                        : fieldName.contains("(만)")
                                ? BigDecimal.valueOf(10_000L)
                                : fieldName.contains("(천)") ? BigDecimal.valueOf(1_000L) : BigDecimal.ONE;
        BigDecimal converted = BigDecimal.valueOf(amount.longValue()).divide(divisor, 0, RoundingMode.DOWN);
        return NumberFormat.getIntegerInstance(Locale.KOREA).format(converted);
    }

    private String formatCompanyDivisionRate(BigDecimal value, String fieldName) {
        if (value == null) return "";
        BigDecimal formatted = fieldName.contains("(0.00%)") ? value.movePointLeft(2) : value;
        return formatted.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String formatCompanyContractPeriod(CompanyPerformance performance, String fieldName) {
        String from = formatCompanyDate(performance.contractFromDate(), fieldName);
        String to = formatCompanyDate(performance.contractToDate(), fieldName);
        return formatCompanyPeriodRange(performance.contractFromDate(), performance.contractToDate(), fieldName, from, to);
    }

    private String formatCompanyPeriodText(String value, String fieldName) {
        return java.util.Arrays.stream(value.split("\\R"))
                .map(period -> {
                    String[] dates = period.split(" ~ ", -1);
                    if (dates.length != 2) return "";
                    return formatCompanyPeriodRange(
                            dates[0], dates[1], fieldName,
                            formatCompanyDate(dates[0], fieldName),
                            formatCompanyDate(dates[1], fieldName));
                })
                .filter(StringUtils::hasText)
                .collect(java.util.stream.Collectors.joining("\n"));
    }

    private String formatCompanyPeriodRange(
            String fromValue,
            String toValue,
            String fieldName,
            String formattedFrom,
            String formattedTo
    ) {
        if (formattedFrom.isEmpty() || formattedTo.isEmpty()) return "";
        LocalDate from = parseCompanyDate(fromValue);
        LocalDate to = parseCompanyDate(toValue);
        if (from == null || to == null || to.isBefore(from)) return formattedFrom + "\n~\n" + formattedTo;

        long days = java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
        String duration = switch (companyPeriodUnit(fieldName)) {
            case "일" -> days + "일";
            case "월" -> BigDecimal.valueOf(days).divide(BigDecimal.valueOf(30), 2, RoundingMode.DOWN).toPlainString() + "개월";
            case "년" -> BigDecimal.valueOf(days).divide(BigDecimal.valueOf(365), 2, RoundingMode.DOWN).toPlainString() + "년";
            case "년월" -> formatCompanyYearMonth(days);
            default -> "";
        };
        return formattedFrom + "\n~\n" + formattedTo + (duration.isEmpty() ? "" : "\n(" + duration + ")");
    }

    private String companyPeriodUnit(String fieldName) {
        String normalized = fieldName == null ? "" : fieldName.replaceAll("\\s+", "");
        if (normalized.contains("(년월)") || normalized.contains("용역년월") || normalized.contains("용역년월수")) return "년월";
        if (normalized.contains("(월)") || normalized.contains("(개월)") || normalized.contains("용역월수") || normalized.contains("용역개월수")) return "월";
        if (normalized.contains("(년)") || normalized.contains("용역년수")) return "년";
        if (normalized.contains("(일)") || normalized.contains("용역일수")) return "일";
        return "";
    }

    private String formatCompanyYearMonth(long days) {
        long years = days / 365;
        long months = Math.round((days % 365) / 30.0);
        if (months == 12) return (years + 1) + "년";
        if (years == 0) return months + "개월";
        return years + "년 " + months + "개월";
    }

    private LocalDate parseCompanyDate(String value) {
        if (!StringUtils.hasText(value)) return null;
        String digits = value.replaceAll("[^0-9]", "");
        if (digits.length() != 8) return null;
        try {
            return LocalDate.parse(digits, DateTimeFormatter.BASIC_ISO_DATE);
        } catch (DateTimeParseException exception) {
            return null;
        }
    }

    private String formatCompanyDate(String value, String fieldName) {
        if (!StringUtils.hasText(value)) return "";
        try {
            LocalDate date = LocalDate.parse(value.replaceAll("[^0-9]", ""), DateTimeFormatter.BASIC_ISO_DATE);
            String normalized = fieldName.toLowerCase(Locale.ROOT);
            DateTimeFormatter formatter = normalized.contains("yyyy년mm월dd일")
                    ? DateTimeFormatter.ofPattern("yyyy년MM월dd일")
                    : normalized.contains("yyyy년mm월")
                            ? DateTimeFormatter.ofPattern("yyyy년MM월")
                            : normalized.contains("yyyy.mm.dd")
                                    ? DateTimeFormatter.ofPattern("yyyy.MM.dd")
                                    : normalized.contains("yyyy.mm")
                                            ? DateTimeFormatter.ofPattern("yyyy.MM")
                                            : normalized.contains("yyyy-mm-dd")
                                                    ? DateTimeFormatter.ofPattern("yyyy-MM-dd")
                                                    : normalized.contains("yyyy-mm")
                                                            ? DateTimeFormatter.ofPattern("yyyy-MM")
                                                            : normalized.contains("yy.mm.dd")
                                                                    ? DateTimeFormatter.ofPattern("yy.MM.dd")
                                                                    : normalized.contains("yy-mm-dd")
                                                                            ? DateTimeFormatter.ofPattern("yy-MM-dd")
                                                                            : DateTimeFormatter.ofPattern("yyyy-MM-dd");
            return date.format(formatter);
        } catch (DateTimeParseException exception) {
            return value;
        }
    }

    private byte[] render(
            byte[] templateBytes,
            EngineerDtos.Profile profile,
            BasicDocumentValues basicValues,
            com.cheil.cheil_be.domain.bidnotice.BidNotice bidNotice,
            List<EngineerProjectHistoryReviewResponse> reviews,
            Map<Long, List<HwpxFieldFormatter.ContractPeriod>> contractPeriods,
            Map<Long, List<HwpxFieldFormatter.ContractPeriod>> participationPeriods,
            Map<Long, String> jobRatios,
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
                        content = renderSection(content, globalValues, mappingValues, profile, basicValues, bidNotice,
                                reviews, contractPeriods, participationPeriods, jobRatios);
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
            List<EngineerProjectHistoryReviewResponse> reviews,
            Map<Long, List<HwpxFieldFormatter.ContractPeriod>> contractPeriods,
            Map<Long, List<HwpxFieldFormatter.ContractPeriod>> participationPeriods,
            Map<Long, String> jobRatios
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

        renderCareerRows(document, mappings, profile, bidNotice, reviews, contractPeriods, participationPeriods, jobRatios);
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
            List<EngineerProjectHistoryReviewResponse> reviews,
            Map<Long, List<HwpxFieldFormatter.ContractPeriod>> contractPeriods,
            Map<Long, List<HwpxFieldFormatter.ContractPeriod>> participationPeriods,
            Map<Long, String> jobRatios
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
                fillCareerRow(clone, mappings, profile, bidNotice, review, sequence + 1,
                        contractPeriods.getOrDefault(review.seq() == null ? null : review.seq().longValue(), List.of()),
                        participationPeriods.getOrDefault(review.seq() == null ? null : review.seq().longValue(), List.of()),
                        jobRatios.getOrDefault(review.seq() == null ? null : review.seq().longValue(), ""));
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
            int sequence,
            List<HwpxFieldFormatter.ContractPeriod> contractPeriods,
            List<HwpxFieldFormatter.ContractPeriod> participationPeriods,
            String jobRatio
    ) {
        NodeList cells = row.getElementsByTagNameNS(HWP_NS, "tc");
        for (int index = 0; index < cells.getLength(); index++) {
            Element cell = (Element) cells.item(index);
            String name = cell.getAttribute("name");
            String path = mappings.get(name);
            if (path != null && path.startsWith("row.")) {
                String value = "row.seq".equals(path)
                        ? String.valueOf(sequence)
                        : "row.contractPeriods".equals(path)
                                ? formatContractPeriods(name, contractPeriods, review)
                                : "row.participationPeriods".equals(path)
                                        ? formatParticipationPeriods(name, participationPeriods, review)
                                : "row.jobRatio".equals(path)
                                        ? formatJobRatio(jobRatio)
                                : resolve(path, profile, null, bidNotice, review, null, null, name);
                setMappedCellText(cell, name, value);
            }
        }
    }

    private String formatContractPeriods(
            String fieldName,
            List<HwpxFieldFormatter.ContractPeriod> periods,
            EngineerProjectHistoryReviewResponse review
    ) {
        if (periods != null && !periods.isEmpty()) {
            return HwpxFieldFormatter.formatContractPeriods(fieldName, periods);
        }
        return HwpxFieldFormatter.format(fieldName.replace("용역차수기간", "용역일수"), review);
    }

    private String formatParticipationPeriods(
            String fieldName,
            List<HwpxFieldFormatter.ContractPeriod> periods,
            EngineerProjectHistoryReviewResponse review
    ) {
        if (periods != null && !periods.isEmpty()) {
            return HwpxFieldFormatter.formatParticipationPeriods(fieldName, periods);
        }
        return HwpxFieldFormatter.format(fieldName.replace("참여차수기간", "참여일수"), review);
    }

    private String formatJobRatio(String jobRatio) {
        return StringUtils.hasText(jobRatio) ? "※공동도급 " + jobRatio : "";
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
                boolean currentCompanyCareer = isLatestCurrentCompanyCareer(history, profile, sequence);
                String value = currentCompanyCareer && "history.workTerm".equals(path)
                        ? HwpxFieldFormatter.formatCurrentEmploymentPeriod(name, history.entryDt())
                        : currentCompanyCareer && ("history.deptName".equals(path) || "history.grade".equals(path))
                                ? ("history.deptName".equals(path) ? profile.basic().deptName() : profile.basic().grade())
                                : resolve(path, profile, null, bidNotice, null, history, sequence, name);
                setMappedCellText(cell, name, value);
            }
        }
    }

    private boolean isLatestCurrentCompanyCareer(EngineerDtos.Career history, EngineerDtos.Profile profile, int sequence) {
        List<EngineerDtos.Career> histories = profile.careers() == null ? List.of() : profile.careers();
        return sequence == histories.size()
                && history != null
                && normalizeCompanyName(history.compName()).equals(normalizeCompanyName("(주)제일엔지니어링종합건축사사무소"));
    }

    private String normalizeCompanyName(String companyName) {
        return companyName == null ? "" : companyName.replace("(주)", "").replaceAll("\\s+", "").trim();
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
            case "basic.companyName" -> "(주)제일엔지니어링\n종합건축사사무소";
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
            case "detail.birthDate" -> HwpxFieldFormatter.formatBirthDateWithAge(
                    fieldName, profile.basic().birthday(), age(profile.basic().birthday()));
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
                LEFT JOIN pq_engineer_school s ON s.id = v.selected_education_id AND s.engr_id = v.engr_id
                LEFT JOIN pq_engineer_license l ON l.id = v.selected_license_id AND l.engr_id = v.engr_id
                WHERE v.bid_seq = :bidSeq AND v.engr_id = :engineerId
                """)
                .params(Map.of("bidSeq", bidSeq, "engineerId", engineerId))
                .query((rs, rowNum) -> new BasicDocumentValues(
                        rs.getString("schname"), rs.getString("degree_label"), rs.getString("major"),
                        rs.getString("graduation_date"), rs.getString("license_name"), rs.getString("date_of_issue"),
                        profile.basic().grade(), rs.getString("license_no"), formatLicenseCareer(rs.getString("date_of_issue"))))
                .optional()
                .orElseGet(() -> new BasicDocumentValues("", "", "", "", "", "", profile.basic().grade(), "", ""));
    }

    private Map<Long, List<HwpxFieldFormatter.ContractPeriod>> findContractPeriods(
            List<EngineerProjectHistoryReviewResponse> reviews
    ) {
        List<Long> seqs = reviews.stream()
                .map(EngineerProjectHistoryReviewResponse::seq)
                .filter(java.util.Objects::nonNull)
                .map(Integer::longValue)
                .distinct()
                .toList();
        if (seqs.isEmpty()) return Map.of();

        Map<Long, List<HwpxFieldFormatter.ContractPeriod>> result = new HashMap<>();
        jdbcClient.sql("""
                        SELECT seq, contract_from_date, contract_to_date
                        FROM company_performance_contract_periods
                        WHERE seq IN (:seqs)
                        ORDER BY seq, sort_seq NULLS LAST, contract_from_date NULLS LAST, id
                        """)
                .param("seqs", seqs)
                .query((rs, rowNum) -> {
                    Long seq = rs.getLong("seq");
                    result.computeIfAbsent(seq, ignored -> new ArrayList<>())
                            .add(new HwpxFieldFormatter.ContractPeriod(
                                    rs.getString("contract_from_date"), rs.getString("contract_to_date")));
                    return seq;
                })
                .list();
        return result;
    }

    private Map<Long, List<HwpxFieldFormatter.ContractPeriod>> findParticipationPeriods(
            String engineerId,
            List<EngineerProjectHistoryReviewResponse> reviews
    ) {
        List<Long> seqs = reviews.stream()
                .map(EngineerProjectHistoryReviewResponse::seq)
                .filter(java.util.Objects::nonNull)
                .map(Integer::longValue)
                .distinct()
                .toList();
        if (seqs.isEmpty()) return Map.of();

        Map<Long, List<HwpxFieldFormatter.ContractPeriod>> result = new HashMap<>();
        jdbcClient.sql("""
                        SELECT seq, startdt, enddt
                        FROM pq_engineer_project_history
                        WHERE engr_id = :engineerId
                          AND seq IN (:seqs)
                        ORDER BY seq, startdt ASC NULLS LAST, id
                        """)
                .params(Map.of("engineerId", engineerId, "seqs", seqs))
                .query((rs, rowNum) -> {
                    Long seq = rs.getLong("seq");
                    result.computeIfAbsent(seq, ignored -> new ArrayList<>())
                            .add(new HwpxFieldFormatter.ContractPeriod(
                                    rs.getString("startdt"), rs.getString("enddt")));
                    return seq;
                })
                .list();
        return result;
    }

    private Map<Long, String> findJobRatios(List<EngineerProjectHistoryReviewResponse> reviews) {
        List<Long> seqs = reviews.stream()
                .map(EngineerProjectHistoryReviewResponse::seq)
                .filter(java.util.Objects::nonNull)
                .map(Integer::longValue)
                .distinct()
                .toList();
        if (seqs.isEmpty()) return Map.of();

        Map<Long, String> result = new HashMap<>();
        jdbcClient.sql("""
                        SELECT seq, job_ratio
                        FROM company_performances
                        WHERE seq IN (:seqs)
                        """)
                .param("seqs", seqs)
                .query((rs, rowNum) -> {
                    result.put(rs.getLong("seq"), rs.getString("job_ratio"));
                    return rs.getLong("seq");
                })
                .list();
        return result;
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
        if (value == null || !isInlineFieldName(fieldName)) {
            return value;
        }
        return value.replaceAll("\\R", "").replace(" ", "\u00A0");
    }

    private void setMappedCellText(Element cell, String fieldName, String value) {
        setCellText(cell, normalizeMappedValue(fieldName, value));
        if (!isInlineFieldName(fieldName)) {
            return;
        }

        NodeList lineBreaks = cell.getElementsByTagNameNS(HWP_NS, "lineBreak");
        List<Node> removableLineBreaks = new ArrayList<>();
        for (int index = 0; index < lineBreaks.getLength(); index++) {
            removableLineBreaks.add(lineBreaks.item(index));
        }
        removableLineBreaks.forEach((lineBreak) -> lineBreak.getParentNode().removeChild(lineBreak));
    }

    /** HWPX 필드명에 xx가 있으면 날짜·기간·금액·일반 텍스트 모두 한 줄로 출력한다. */
    private boolean isInlineFieldName(String fieldName) {
        return fieldName != null && fieldName.toLowerCase(Locale.ROOT).contains("xx");
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
                NodeList cells = document.getElementsByTagNameNS("*", "tc");
                for (int index = 0; index < cells.getLength(); index++) {
                    String field = ((Element) cells.item(index)).getAttribute("name");
                    if (StringUtils.hasText(field)) fields.add(field);
                }
                if (fields.isEmpty()) {
                    NodeList namedElements = document.getElementsByTagName("*");
                    for (int index = 0; index < namedElements.getLength(); index++) {
                        String field = ((Element) namedElements.item(index)).getAttribute("name");
                        if (StringUtils.hasText(field)) fields.add(field);
                    }
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
