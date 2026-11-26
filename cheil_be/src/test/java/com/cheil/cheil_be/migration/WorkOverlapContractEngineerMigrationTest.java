package com.cheil.cheil_be.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Types;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

class WorkOverlapContractEngineerMigrationTest {
    private static final Pattern NAME_BIRTH_YEAR =
            Pattern.compile("[（(]\\s*((?:19|20)\\d{2}|\\d{2})\\s*[）)]\\s*$");
    private static final String RESOLUTION = """
            , names AS (
                SELECT source_name, min(lookup_name) AS lookup_name, min(birth_year) AS birth_year,
                       bool_or(needs_birthday) AS needs_birthday
                FROM (
                    SELECT source_name, lookup_name, birth_year, needs_birthday FROM roster
                    UNION ALL
                    SELECT source_name, lookup_name, birth_year, needs_birthday FROM participants
                ) sources
                GROUP BY source_name
            ), roster_name_variants AS (
                SELECT lookup_name, count(DISTINCT source_name) AS variants
                FROM roster GROUP BY lookup_name
            ), name_evidence AS (
                SELECT n.source_name, n.lookup_name, n.birth_year,
                       (n.needs_birthday OR coalesce(r.variants, 0) > 1) AS needs_birthday,
                       v.birthday AS verified_birthday
                FROM names n
                LEFT JOIN roster_name_variants r USING (lookup_name)
                LEFT JOIN verified_birthdays v USING (source_name)
            ), engineers AS (
                SELECT engr_id, btrim(namekor) AS lookup_name,
                       regexp_replace(btrim(birthday), '[-./[:space:]]', '', 'g') AS birthday
                FROM pq_engineer_master
            ), name_matches AS (
                SELECT n.*, e.engr_id, e.birthday,
                       e.birthday ~ '^(19|20)[0-9]{6}$'
                           AND left(e.birthday, 4) <= to_char(current_date, 'YYYY')
                           AND right(left(e.birthday, 4), length(n.birth_year)) = n.birth_year AS matches_year
                FROM name_evidence n
                LEFT JOIN engineers e USING (lookup_name)
            ), candidates AS (
                SELECT source_name, lookup_name, birth_year, needs_birthday, verified_birthday,
                       count(engr_id) AS name_count,
                       max(engr_id) AS unique_name_id,
                       string_agg(engr_id || coalesce(' (' || left(nullif(birthday, ''), 4) || ')', ''),
                                  ', ' ORDER BY engr_id) AS candidate_ids,
                       count(engr_id) FILTER (WHERE matches_year) AS year_count,
                       max(engr_id) FILTER (WHERE matches_year) AS year_id,
                       count(engr_id) FILTER (WHERE birthday = verified_birthday AND (birth_year IS NULL OR matches_year)) AS birthday_count,
                       max(engr_id) FILTER (WHERE birthday = verified_birthday AND (birth_year IS NULL OR matches_year)) AS birthday_id
                FROM name_matches
                GROUP BY source_name, lookup_name, birth_year, needs_birthday, verified_birthday
            ), people AS (
                SELECT c.*,
                       CASE WHEN verified_birthday IS NOT NULL THEN CASE WHEN birthday_count = 1 THEN birthday_id END
                            WHEN birth_year IS NOT NULL THEN CASE WHEN year_count = 1 THEN year_id END
                            WHEN NOT needs_birthday AND name_count = 1 THEN unique_name_id
                       END AS engr_id,
                       CASE
                           WHEN verified_birthday IS NOT NULL AND birthday_count <> 1 THEN '생년월일 재확인'
                           WHEN name_count = 0 THEN '미등록 후보'
                           WHEN birthday_count = 1 OR year_count = 1 THEN '매칭'
                           WHEN birth_year IS NOT NULL AND year_count = 0 THEN '출생연도 불일치'
                           WHEN needs_birthday OR name_count > 1 THEN '생년월일 확인'
                           ELSE '매칭'
                       END AS result,
                       CASE WHEN verified_birthday IS NOT NULL AND birthday_count = 1 THEN '수동 확인'
                            WHEN verified_birthday IS NULL AND year_count = 1 THEN '성명과 출생연도'
                            WHEN verified_birthday IS NULL AND birth_year IS NULL AND NOT needs_birthday AND name_count = 1 THEN '성명 단독'
                       END AS match_source
                FROM candidates c
            ), assignments AS (
                SELECT p.*, n.engr_id, n.match_source, n.candidate_ids,
                       CASE WHEN p.source_name = '' OR p.contract_no = '' THEN '필수값 누락'
                            WHEN n.engr_id IS NULL THEN n.result
                            WHEN c.contract_no IS NULL THEN '계약 미등록'
                            WHEN char_length(p.field) > 100 OR char_length(p.participation_type) > 100
                                THEN '컬럼 길이 확인'
                            ELSE '매칭'
                       END AS result
                FROM participants p
                LEFT JOIN people n USING (source_name)
                LEFT JOIN work_overlap_contracts c ON c.contract_no = p.contract_no
            ), distinct_assignments AS (
                SELECT DISTINCT contract_no, engr_id, field, participation_type, remark
                FROM assignments WHERE result = '매칭'
            ), ready AS (
                SELECT a.*, count(*) OVER (PARTITION BY contract_no, engr_id) AS variants
                FROM distinct_assignments a
            ), reviewed AS (
                SELECT a.*,
                       CASE WHEN a.result <> '매칭' THEN a.result
                            WHEN r.variants > 1 THEN '동일 계약·기술자 상세 충돌'
                            WHEN EXISTS (SELECT 1 FROM work_overlap_contract_engineers e
                                WHERE e.contract_no = a.contract_no AND e.engr_id = a.engr_id
                                  AND nullif(e.field, '') IS NOT DISTINCT FROM nullif(a.field, '')
                                  AND nullif(e.participation_type, '') IS NOT DISTINCT FROM nullif(a.participation_type, '')
                                  AND nullif(e.remark, '') IS NOT DISTINCT FROM nullif(a.remark, '')) THEN '기존 등록'
                            WHEN EXISTS (SELECT 1 FROM work_overlap_contract_engineers e
                                WHERE e.contract_no = a.contract_no AND e.engr_id = a.engr_id) THEN '기존 등록 · 상세 차이'
                            ELSE '등록 가능'
                       END AS review_status
                FROM assignments a
                LEFT JOIN ready r ON r.contract_no = a.contract_no AND r.engr_id = a.engr_id
                    AND r.field = a.field AND r.participation_type = a.participation_type AND r.remark = a.remark
            ), upload_rows AS (
                SELECT DISTINCT contract_no, engr_id, nullif(field, '') AS field,
                       nullif(participation_type, '') AS participation_type, nullif(remark, '') AS remark,
                       'migration' AS created_id, 'migration' AS last_changed_id
                FROM reviewed
                WHERE review_status = '등록 가능'
            )
            """;
    private static final String LOCK_TARGET = "LOCK TABLE work_overlap_contract_engineers IN SHARE ROW EXCLUSIVE MODE";
    private static final String INSERT_ASSIGNMENTS = """
            INSERT INTO work_overlap_contract_engineers
                (contract_no, engr_id, field, participation_type, remark, created_id, last_changed_id)
            SELECT contract_no, engr_id, field, participation_type, remark, created_id, last_changed_id
            FROM upload_rows;
            """;

    @Test
    void exportsAssignmentSqlAndEngineerReviewWorkbook() throws IOException, SQLException {
        String inputPath = System.getenv("WORK_OVERLAP_ENGINEER_XLSX");
        Assumptions.assumeTrue(inputPath != null, "Set WORK_OVERLAP_ENGINEER_XLSX to the source workbook");
        boolean apply = "true".equalsIgnoreCase(System.getenv("WORK_OVERLAP_ENGINEER_APPLY"));
        boolean exportSql = "true".equalsIgnoreCase(System.getenv("WORK_OVERLAP_ENGINEER_EXPORT_SQL"));
        if (apply && System.getenv("SPRING_PROFILES_ACTIVE") == null) {
            throw new IllegalArgumentException("Set SPRING_PROFILES_ACTIVE explicitly before applying the migration");
        }
        Path input = Path.of(inputPath);
        var formatter = new DataFormatter(Locale.ROOT);
        formatter.setUseCachedValuesForFormulaCells(true);
        String query;
        try (var stream = Files.newInputStream(input); var workbook = WorkbookFactory.create(stream)) {
            var roster = readRows(findSheet(workbook, "기술자명단"), formatter,
                    List.of("성명", "직무분야", "전문분야", "재직상태", "퇴사일"));
            var participants = readRows(workbook.getSheet("③참여인력"), formatter,
                    List.of("성명", "계약번호", "분야", "참여구분", "비고", "참여상태", "최종상태(자동)"));
            assertThat(roster).isNotEmpty();
            assertThat(participants).isNotEmpty();
            query = sourceQuery(roster, participants);
            System.out.printf("Roster: %d, participation rows: %d%n", roster.size(), participants.size());
        }

        StandardEnvironment environment = loadDatasourceEnvironment();
        String filename = input.getFileName().toString();
        String profile = String.join("-", environment.getActiveProfiles());
        String prefix = filename.substring(0, filename.lastIndexOf('.')) + "_" + profile;
        Path reviewPath = input.resolveSibling(prefix + "_참여인력_업로드검토.xlsx");
        try (Connection connection = openConnection(environment, true)) {
            connection.setAutoCommit(false);
            connection.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);
            try (var statement = connection.createStatement()) {
                statement.execute("SET LOCAL standard_conforming_strings = on");
            }
            exportReview(connection, query, reviewPath);
            writeSummary(connection, query);
            connection.rollback();
        }

        System.out.println(reviewPath);
        if (exportSql) {
            Path sqlPath = input.resolveSibling(prefix + "_work_overlap_contract_engineers.sql");
            Files.writeString(sqlPath, """
                    -- Run with the target schema in search_path and load work_overlap_contracts first.
                    -- Matches names and any Excel birth year against pq_engineer_master.
                    -- Enter one confirmed YYYYMMDD birthday per exact source name in verified_birthdays.
                    -- Rows requiring review or with conflicting assignment details are held back.
                    BEGIN;
                    SET LOCAL standard_conforming_strings = on;
                    """ + LOCK_TARGET + ";\n" + query + INSERT_ASSIGNMENTS + "COMMIT;\n", StandardCharsets.UTF_8);
            System.out.println(sqlPath);
        }
        if (apply) {
            applyAssignments(environment, query);
        }
    }

    private static StandardEnvironment loadDatasourceEnvironment() {
        var environment = new StandardEnvironment();
        environment.getPropertySources().addLast(new MapPropertySource(
                "workOverlapReviewDefaults", Map.of("spring.profiles.active", "prod")));
        ConfigDataEnvironmentPostProcessor.applyTo(environment);
        return environment;
    }

    private static Connection openConnection(StandardEnvironment environment, boolean readOnly) throws SQLException {
        var properties = new Properties();
        properties.setProperty("user", environment.getRequiredProperty("spring.datasource.username"));
        properties.setProperty("password", environment.getProperty("spring.datasource.password", ""));
        properties.setProperty("connectTimeout", "5");
        properties.setProperty("readOnly", Boolean.toString(readOnly));
        properties.setProperty("readOnlyMode", "always");
        return DriverManager.getConnection(environment.getRequiredProperty("spring.datasource.url"), properties);
    }

    private static Sheet findSheet(org.apache.poi.ss.usermodel.Workbook workbook, String suffix) {
        return StreamSupport.stream(workbook.spliterator(), false)
                .filter(sheet -> sheet.getSheetName().strip().endsWith(suffix))
                .findFirst().orElseThrow(() -> new IllegalArgumentException("Missing sheet: " + suffix));
    }

    private static List<SourceRow> readRows(Sheet sheet, DataFormatter formatter, List<String> headers) {
        if (sheet == null) {
            throw new IllegalArgumentException("Missing sheet: ③참여인력");
        }
        Row header = StreamSupport.stream(sheet.spliterator(), false).limit(30)
                .filter(row -> StreamSupport.stream(row.spliterator(), false)
                        .map(cell -> formatter.formatCellValue(cell).strip()).toList().containsAll(headers))
                .findFirst().orElseThrow(() -> new IllegalArgumentException("Missing headers in " + sheet.getSheetName()));
        Map<String, Integer> indexes = StreamSupport.stream(header.spliterator(), false)
                .filter(cell -> headers.contains(formatter.formatCellValue(cell).strip()))
                .collect(Collectors.toMap(cell -> formatter.formatCellValue(cell).strip(), org.apache.poi.ss.usermodel.Cell::getColumnIndex));
        return StreamSupport.stream(sheet.spliterator(), false)
                .filter(row -> row.getRowNum() > header.getRowNum())
                .map(row -> new SourceRow(row.getRowNum() + 1, headers.stream()
                        .map(label -> formatter.formatCellValue(row.getCell(indexes.get(label))).strip()).toList()))
                .filter(row -> !row.values().getFirst().isBlank()
                        || (headers.contains("계약번호") && row.values().subList(1, 6).stream()
                                .anyMatch(value -> !value.isBlank())))
                .toList();
    }

    private static String sourceQuery(List<SourceRow> roster, List<SourceRow> participants) {
        return "WITH roster(source_row, source_name, lookup_name, birth_year, needs_birthday, duty, specialty, employment, retired_on) AS (VALUES\n"
                + rowValues(roster)
                + "\n), participants(source_row, source_name, lookup_name, birth_year, needs_birthday,"
                + " contract_no, field, participation_type, remark, participation_status, final_status) AS (VALUES\n"
                + rowValues(participants)
                + """
                ), verified_birthdays(source_name, birthday) AS (
                    -- Replace this empty SELECT with reviewed values, for example:
                    -- VALUES ('원본 성명(구분)', '19800101')
                    SELECT NULL::text, NULL::text WHERE FALSE
                )
                """ + RESOLUTION;
    }

    private static String rowValues(List<SourceRow> rows) {
        return rows.stream().map(row -> {
            String name = row.values().getFirst();
            String lookupName = name.split("[（(]", 2)[0].strip();
            var year = NAME_BIRTH_YEAR.matcher(Normalizer.normalize(name, Normalizer.Form.NFKC));
            String birthYear = year.find() ? literal(year.group(1)) : "NULL::text";
            return "(" + row.rowNumber() + ", " + literal(name) + ", " + literal(lookupName)
                    + ", " + birthYear + ", " + (!name.equals(lookupName)) + ", "
                    + row.values().stream().skip(1).map(WorkOverlapContractEngineerMigrationTest::literal)
                            .collect(Collectors.joining(", ")) + ")";
        }).collect(Collectors.joining(",\n"));
    }

    private static String literal(String value) {
        return "'" + value.replace("'", "''") + "'";
    }

    private static void writeSummary(Connection connection, String query) throws SQLException {
        try (var statement = connection.createStatement()) {
            try (var target = statement.executeQuery("""
                    SELECT current_database(), current_schema(),
                           (SELECT count(*) FROM pq_engineer_master),
                           (SELECT count(*) FROM work_overlap_contracts),
                           (SELECT count(*) FROM work_overlap_contract_engineers)
                    """)) {
                target.next();
                System.out.printf("DB: %s.%s, engineers: %d, contracts: %d, existing assignments: %d%n",
                        target.getString(1), target.getString(2), target.getLong(3), target.getLong(4), target.getLong(5));
            }
            try (var result = statement.executeQuery(query + """
                    SELECT review_status, count(*),
                           count(DISTINCT (contract_no, engr_id)) FILTER (WHERE engr_id IS NOT NULL)
                    FROM reviewed GROUP BY review_status ORDER BY review_status
                    """)) {
                while (result.next()) {
                    System.out.printf("%s: %d source rows, %d contract/engineer pairs%n",
                            result.getString(1), result.getLong(2), result.getLong(3));
                }
            }
        }
    }

    private static void applyAssignments(StandardEnvironment environment, String query) throws SQLException {
        try (Connection connection = openConnection(environment, false)) {
            connection.setAutoCommit(false);
            try (var statement = connection.createStatement()) {
                statement.execute("SET LOCAL standard_conforming_strings = on");
                statement.execute("SET LOCAL lock_timeout = '10s'");
                statement.execute(LOCK_TARGET);
                int inserted = statement.executeUpdate(query + INSERT_ASSIGNMENTS);
                try (var verification = statement.executeQuery(query + """
                        SELECT count(*) FROM reviewed WHERE review_status = '등록 가능'
                        """)) {
                    verification.next();
                    if (verification.getLong(1) != 0) {
                        throw new SQLException("Eligible assignments remain after insertion");
                    }
                }
                connection.commit();
                System.out.printf("Inserted and committed: %d%n", inserted);
            } catch (SQLException exception) {
                connection.rollback();
                throw exception;
            }
        }
    }

    private static void exportReview(Connection connection, String query, Path output)
            throws SQLException, IOException {
        try (var workbook = new XSSFWorkbook()) {
            writeSheet(connection, workbook, "요약", query + """
                    SELECT '업로드 대상 (중복 제거)' AS "항목", count(*) AS "건수" FROM upload_rows
                    UNION ALL
                    SELECT '원본 참여인력 행', count(*) FROM reviewed
                    UNION ALL
                    SELECT '원본 행 · ' || review_status, count(*) FROM reviewed GROUP BY review_status
                    UNION ALL
                    SELECT '등록 가능 원본 행 · 참여상태 ' || coalesce(nullif(participation_status, ''), '(빈칸)'),
                           count(*)
                    FROM reviewed WHERE review_status = '등록 가능' GROUP BY participation_status
                    """);
            writeSheet(connection, workbook, "업로드 대상", query + """
                    SELECT contract_no, engr_id, field, participation_type, remark, created_id, last_changed_id
                    FROM upload_rows
                    ORDER BY contract_no, engr_id
                    """);
            writeSheet(connection, workbook, "미등록 후보", query + """
                    SELECT p.source_name AS "원본 성명", p.lookup_name AS "등록할 성명",
                           r.duty AS "직무분야", r.specialty AS "전문분야",
                           r.employment AS "재직상태", r.retired_on AS "퇴사일",
                           NULL::text AS "등록할 engr_id", p.birth_year AS "엑셀 출생연도",
                           NULL::text AS "확인 생년월일",
                           p.result AS "검토 상태"
                    FROM people p LEFT JOIN roster r USING (source_name)
                    WHERE p.source_name <> '' AND p.name_count = 0
                      AND EXISTS (SELECT 1 FROM participants a WHERE a.source_name = p.source_name)
                    ORDER BY p.source_name, r.source_row
                    """);
            writeSheet(connection, workbook, "생년월일 확인", query + """
                    SELECT source_name AS "원본 성명", lookup_name AS "조회 성명",
                           birth_year AS "엑셀 생년", candidate_ids AS "동일 성명 engr_id (출생연도)",
                           NULL::text AS "확인 생년월일",
                           result AS "검토 상태"
                    FROM people p
                    WHERE engr_id IS NULL AND name_count > 0
                      AND EXISTS (SELECT 1 FROM participants a WHERE a.source_name = p.source_name)
                    ORDER BY source_name
                    """);
            writeSheet(connection, workbook, "참여인력 매핑", query + """
                    SELECT a.source_row AS "원본 행", a.contract_no AS "계약번호", a.source_name AS "성명",
                           a.engr_id AS "engr_id", a.field AS "분야", a.participation_type AS "참여구분",
                           a.remark AS "비고", a.participation_status AS "참여상태",
                           a.final_status AS "최종상태(원본 저장값)", a.birth_year AS "괄호 생년",
                           a.match_source AS "매핑 근거", a.review_status AS "검토 상태",
                           CASE WHEN a.engr_id IS NULL THEN a.candidate_ids END AS "동일 성명 후보 ID (출생연도)"
                    FROM reviewed a
                    ORDER BY a.source_row
                    """);
            try (var stream = Files.newOutputStream(output)) {
                workbook.write(stream);
            }
        }
    }

    private static void writeSheet(Connection connection, XSSFWorkbook workbook, String label, String sql)
            throws SQLException {
        var sheet = workbook.createSheet(label);
        var headerFont = workbook.createFont();
        headerFont.setBold(true);
        var headerStyle = workbook.createCellStyle();
        headerStyle.setFont(headerFont);
        try (var statement = connection.createStatement(); var result = statement.executeQuery(sql)) {
            var metadata = result.getMetaData();
            int columns = metadata.getColumnCount();
            var header = sheet.createRow(0);
            for (int index = 1; index <= columns; index++) {
                String columnLabel = metadata.getColumnLabel(index);
                var cell = header.createCell(index - 1);
                cell.setCellValue(columnLabel);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(index - 1, switch (columnLabel) {
                    case "항목", "비고", "remark", "동일 성명 후보 ID (출생연도)", "동일 성명 engr_id (출생연도)" -> 48 * 256;
                    default -> 24 * 256;
                });
            }
            int rowIndex = 1;
            while (result.next()) {
                var row = sheet.createRow(rowIndex++);
                for (int index = 1; index <= columns; index++) {
                    if (metadata.getColumnType(index) == Types.INTEGER || metadata.getColumnType(index) == Types.BIGINT) {
                        row.createCell(index - 1).setCellValue(result.getLong(index));
                    } else {
                        row.createCell(index - 1).setCellValue(result.getString(index));
                    }
                }
            }
            sheet.createFreezePane(0, 1);
            sheet.setAutoFilter(new org.apache.poi.ss.util.CellRangeAddress(0, rowIndex - 1, 0, columns - 1));
            System.out.printf("%s: %d%n", label, rowIndex - 1);
        }
    }

    private record SourceRow(int rowNumber, List<String> values) {
    }
}
