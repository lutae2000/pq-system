package com.cheil.cheil_be.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.BufferedWriter;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.UnaryOperator;
import java.util.stream.Stream;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.FormulaEvaluator;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

class WorkOverlapContractCsvMigrationTest {

    private static final Path INPUT_DIRECTORY = Path.of(System.getProperty(
            "workOverlapContractMigrationInputDirectory",
            "C:/Users/cheil/마이그레이션"
    ));
    private static final Path OUTPUT_DIRECTORY = Path.of(System.getProperty(
            "workOverlapContractMigrationOutputDirectory",
            System.getenv().getOrDefault("WORK_OVERLAP_CONTRACT_OUTPUT_DIRECTORY", INPUT_DIRECTORY.toString())
    ));
    private static final int CONTRACT_INPUT_SHEET_INDEX = 2;
    private static final String CONTRACT_NO = "contract_no";
    private static final List<Column> TABLE_COLUMNS = List.of(
            new Column(CONTRACT_NO, List.of("계약번호", "계약 번호"), WorkOverlapContractCsvMigrationTest::text),
            new Column("service_type", List.of("용역구분", "용역 구분", "구분", "구분(설계/감리)"), WorkOverlapContractCsvMigrationTest::text),
            new Column("client_name", List.of("발주처", "발주기관"), WorkOverlapContractCsvMigrationTest::text),
            new Column("supervising_department_code", List.of("주관부서코드", "주관 부서 코드"), WorkOverlapContractCsvMigrationTest::text),
            new Column("public_contract_yn", List.of("공개계약여부", "공개 계약 여부"), WorkOverlapContractCsvMigrationTest::booleanValue),
            new Column("service_name", List.of("용역명", "계약명"), WorkOverlapContractCsvMigrationTest::text),
            new Column("construction_start_date", List.of("공사착수일", "착수일", "공사 시작일"), WorkOverlapContractCsvMigrationTest::date),
            new Column("construction_complete_date", List.of("공사준공일", "준공일", "공사 완료일"), WorkOverlapContractCsvMigrationTest::date),
            new Column("management_service_complete_date", List.of("관리용역준공일", "관리 용역 준공일"), WorkOverlapContractCsvMigrationTest::date),
            new Column("construction_stop_from_date", List.of("공사중지시작일", "공사 중지 시작일", "중지일"), WorkOverlapContractCsvMigrationTest::date),
            new Column("construction_stop_to_date", List.of("공사중지종료일", "공사 중지 종료일", "중지종료일"), WorkOverlapContractCsvMigrationTest::date),
            new Column("restart_date", List.of("재개일", "공사재개일"), WorkOverlapContractCsvMigrationTest::date),
            new Column("contract_amount", List.of("계약금액", "계약 금액", "총계약금액(원)"), WorkOverlapContractCsvMigrationTest::amount),
            new Column("share_amount", List.of("지분금액", "지분 금액", "제일지분금액(원)"), WorkOverlapContractCsvMigrationTest::amount),
            new Column("joint_contract_ratio", List.of("공동도급비율", "공동 도급 비율"), WorkOverlapContractCsvMigrationTest::text),
            new Column("performance_certification", List.of("실적증명", "실적 증명", "실적증명서", "실적증명여부"), WorkOverlapContractCsvMigrationTest::receivedValue),
            new Column("participate_list_document", List.of("참여명단문서", "참여 명단 문서", "참여명단", "참여자명단"), WorkOverlapContractCsvMigrationTest::receivedValue),
            new Column("cems_confirm", List.of("CEMS확인", "CEMS 확인", "CEMS확인여부", "CEMS승인"), WorkOverlapContractCsvMigrationTest::cemsApprovedValue),
            new Column("remark", List.of("비고", "참고사항"), WorkOverlapContractCsvMigrationTest::text)
    );

    @Test
    void convertsContractInputSheetToWorkOverlapContractsCsv() throws Exception {
        List<Path> inputs;
        try (Stream<Path> files = Files.list(INPUT_DIRECTORY)) {
            inputs = files
                    .filter(path -> path.getFileName().toString().matches("(?i).*(WORK_OVERLAP|업무중복도).*\\.xlsx"))
                    .sorted()
                    .toList();
        }
        Assumptions.assumeTrue(!inputs.isEmpty(),
                "Put the work overlap contract workbook in " + INPUT_DIRECTORY);
        Files.createDirectories(OUTPUT_DIRECTORY);

        for (Path input : inputs) {
            Path output = OUTPUT_DIRECTORY.resolve(stripExtension(input.getFileName().toString()) + "_work_overlap_contracts_migration.csv");
            convert(input, output);
            assertThat(Files.size(output)).isGreaterThan(0L);
        }
    }

    private static void convert(Path input, Path output) throws IOException {
        try (Workbook workbook = WorkbookFactory.create(input.toFile());
             BufferedWriter writer = Files.newBufferedWriter(output, StandardCharsets.UTF_8)) {
            assertThat(workbook.getNumberOfSheets()).isGreaterThan(CONTRACT_INPUT_SHEET_INDEX);
            DataFormatter formatter = new DataFormatter(Locale.ROOT);
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            var sheet = workbook.getSheetAt(CONTRACT_INPUT_SHEET_INDEX);
            Header header = findHeader(sheet, formatter);
            List<Column> outputColumns = TABLE_COLUMNS.stream()
                    .filter(column -> column.databaseColumn().equals(CONTRACT_NO)
                            || header.indexByDatabaseColumn().containsKey(column.databaseColumn()))
                    .toList();
            assertThat(header.indexByDatabaseColumn()).containsKey("service_name");

            writer.write('\uFEFF');
            writeRow(writer, outputColumns.stream().map(Column::databaseColumn).toList());

            int generatedContractNumber = 1;
            for (Row row : sheet) {
                if (row.getRowNum() <= header.rowNumber()) {
                    continue;
                }
                String serviceName = cellValue(row, header.indexByDatabaseColumn().get("service_name"), formatter, evaluator);
                if (serviceName.isBlank()) {
                    continue;
                }

                Map<String, String> values = new LinkedHashMap<>();
                for (Column column : outputColumns) {
                    if (column.databaseColumn().equals(CONTRACT_NO)) {
                        String sourceContractNo = header.indexByDatabaseColumn().containsKey(CONTRACT_NO)
                                ? cellValue(row, header.indexByDatabaseColumn().get(CONTRACT_NO), formatter, evaluator)
                                : "";
                        values.put(CONTRACT_NO, sourceContractNo.isBlank()
                                ? String.format(Locale.ROOT, "C%07d", generatedContractNumber++)
                                : text(sourceContractNo));
                    } else {
                        int columnIndex = header.indexByDatabaseColumn().get(column.databaseColumn());
                        values.put(column.databaseColumn(), column.converter().apply(cellValue(row, columnIndex, formatter, evaluator)));
                    }
                }
                writeRow(writer, outputColumns.stream().map(column -> values.getOrDefault(column.databaseColumn(), "")).toList());
            }
        }
    }

    private static Header findHeader(org.apache.poi.ss.usermodel.Sheet sheet, DataFormatter formatter) {
        int scanLimit = Math.min(sheet.getLastRowNum(), 29);
        for (int rowIndex = 0; rowIndex <= scanLimit; rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null) {
                continue;
            }
            Map<String, Integer> indexByHeader = new LinkedHashMap<>();
            for (var cell : row) {
                indexByHeader.put(normalizeHeader(formatter.formatCellValue(cell)), cell.getColumnIndex());
            }
            Map<String, Integer> indexByDatabaseColumn = new LinkedHashMap<>();
            for (Column column : TABLE_COLUMNS) {
                for (String alias : column.headerAliases()) {
                    Integer index = indexByHeader.get(normalizeHeader(alias));
                    if (index != null) {
                        indexByDatabaseColumn.put(column.databaseColumn(), index);
                        break;
                    }
                }
            }
            if (indexByDatabaseColumn.containsKey("service_name")) {
                return new Header(rowIndex, indexByDatabaseColumn);
            }
        }
        throw new IllegalArgumentException("Could not find the contract input header in sheet 3: " + sheet.getSheetName());
    }

    private static String cellValue(Row row, int columnIndex, DataFormatter formatter, FormulaEvaluator evaluator) {
        var cell = row.getCell(columnIndex);
        if (cell == null) {
            return "";
        }
        try {
            return formatter.formatCellValue(cell, evaluator).trim();
        } catch (RuntimeException exception) {
            return cell.getCellType() == org.apache.poi.ss.usermodel.CellType.FORMULA
                    ? ""
                    : formatter.formatCellValue(cell).trim();
        }
    }

    private static String normalizeHeader(String value) {
        return value == null ? "" : value.replaceAll("[\\s_()\\[\\]]", "").toLowerCase(Locale.ROOT);
    }

    private static String text(String value) {
        return value == null ? "" : value.trim();
    }

    private static String amount(String value) {
        String normalized = text(value).replaceAll("[,\\s₩원]", "");
        if (normalized.isBlank() || normalized.equals("-")) {
            return "";
        }
        return new BigDecimal(normalized).stripTrailingZeros().toPlainString();
    }

    private static String date(String value) {
        String normalized = text(value);
        if (normalized.isBlank() || normalized.equals("-")) {
            return "";
        }
        String digits = normalized.replaceAll("\\D", "");
        if (digits.length() == 8) {
            return digits;
        }
        for (DateTimeFormatter formatter : List.of(
                DateTimeFormatter.ofPattern("yyyy.M.d"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                DateTimeFormatter.ofPattern("yyyy/MM/dd"),
                DateTimeFormatter.ofPattern("yy.MM.dd")
        )) {
            try {
                return LocalDate.parse(normalized, formatter).format(DateTimeFormatter.BASIC_ISO_DATE);
            } catch (DateTimeParseException ignored) {
                // Try the next common spreadsheet date format.
            }
        }
        return normalized;
    }

    private static String booleanValue(String value) {
        return switch (text(value).toUpperCase(Locale.ROOT)) {
            case "Y", "YES", "TRUE", "1", "예", "O", "수령" -> "true";
            case "N", "NO", "FALSE", "0", "아니오", "X", "미수령" -> "false";
            default -> "";
        };
    }

    private static String receivedValue(String value) {
        return Boolean.toString("수령".equals(text(value)));
    }

    private static String cemsApprovedValue(String value) {
        String normalized = text(value);
        return Boolean.toString("승인".equals(normalized) || "수령".equals(normalized));
    }

    private static void writeRow(BufferedWriter writer, List<String> values) throws IOException {
        for (int index = 0; index < values.size(); index++) {
            if (index > 0) {
                writer.write(',');
            }
            writer.write(csv(values.get(index)));
        }
        writer.newLine();
    }

    private static String csv(String value) {
        String safe = value == null ? "" : value;
        return "\"" + safe.replace("\"", "\"\"") + "\"";
    }

    private static String stripExtension(String fileName) {
        int extensionIndex = fileName.lastIndexOf('.');
        return extensionIndex < 0 ? fileName : fileName.substring(0, extensionIndex);
    }

    private record Column(String databaseColumn, List<String> headerAliases, UnaryOperator<String> converter) {
    }

    private record Header(int rowNumber, Map<String, Integer> indexByDatabaseColumn) {
    }
}
