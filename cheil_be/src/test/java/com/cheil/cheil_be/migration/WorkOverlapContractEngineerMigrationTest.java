package com.cheil.cheil_be.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
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
                       bool_or(needs_birthday) AS needs_birthday,
                       bool_or(in_roster) AS in_roster
                FROM (
                    SELECT source_name, lookup_name, birth_year, needs_birthday, true AS in_roster FROM roster
                    UNION ALL
                    SELECT source_name, lookup_name, birth_year, needs_birthday, false FROM participants
                ) sources
                GROUP BY source_name
            ), roster_name_variants AS (
                SELECT lookup_name, count(DISTINCT source_name) AS variants
                FROM roster GROUP BY lookup_name
            ), stage_birthdays AS (
                SELECT DISTINCT btrim(namekor) AS lookup_name, btrim(birthday) AS birthday
                FROM public.eng_tmp_final
                WHERE btrim(birthday) ~ '^(19|20)[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$'
            ), name_evidence AS (
                SELECT n.source_name, n.lookup_name, n.birth_year, n.in_roster,
                       (n.needs_birthday OR coalesce(r.variants, 0) > 1) AS needs_birthday,
                       v.birthday AS verified_birthday,
                       stage.birthdays AS stage_birthdays, stage.birthday_count AS stage_count,
                       CASE WHEN stage.birthday_count = 1
                                  AND (n.birth_year IS NOT NULL OR
                                       (NOT n.needs_birthday AND coalesce(r.variants, 0) <= 1))
                            THEN stage.birthday
                       END AS stage_birthday
                FROM names n
                LEFT JOIN roster_name_variants r USING (lookup_name)
                LEFT JOIN verified_birthdays v USING (source_name)
                CROSS JOIN LATERAL (
                    SELECT count(*) AS birthday_count, min(s.birthday) AS birthday,
                           string_agg(s.birthday, ', ' ORDER BY s.birthday) AS birthdays
                    FROM stage_birthdays s
                    WHERE s.lookup_name = n.lookup_name
                      AND (n.birth_year IS NULL OR right(left(s.birthday, 4), length(n.birth_year)) = n.birth_year)
                ) stage
            ), candidates AS (
                SELECT n.*,
                       count(e.engr_id) AS name_count,
                       max(e.engr_id) AS unique_name_id,
                       string_agg(e.engr_id, ', ' ORDER BY e.engr_id) AS candidate_ids,
                       count(e.engr_id) FILTER (
                           WHERE btrim(e.birthday) = coalesce(n.verified_birthday, n.stage_birthday)
                       ) AS birthday_count,
                       max(e.engr_id) FILTER (
                           WHERE btrim(e.birthday) = coalesce(n.verified_birthday, n.stage_birthday)
                       ) AS birthday_id
                FROM name_evidence n
                LEFT JOIN pq_engineer_master e ON btrim(e.namekor) = n.lookup_name
                GROUP BY n.source_name, n.lookup_name, n.birth_year, n.in_roster, n.needs_birthday,
                         n.verified_birthday, n.stage_birthdays, n.stage_count, n.stage_birthday
            ), people AS (
                SELECT c.*,
                       CASE WHEN coalesce(verified_birthday, stage_birthday) IS NOT NULL AND birthday_count = 1
                                THEN birthday_id
                            WHEN verified_birthday IS NULL AND stage_count = 0
                                 AND NOT needs_birthday AND name_count = 1 THEN unique_name_id
                       END AS engr_id,
                       CASE
                           WHEN verified_birthday IS NOT NULL AND birthday_count <> 1 THEN '생년월일 재확인'
                           WHEN name_count = 0 AND needs_birthday THEN '미등록 후보 · 생년월일 확인'
                           WHEN name_count = 0 THEN '미등록 후보'
                           WHEN stage_birthday IS NOT NULL AND birthday_count = 0 THEN '임시명단 생년월일 불일치'
                           WHEN coalesce(verified_birthday, stage_birthday) IS NOT NULL AND birthday_count = 1 THEN '매칭'
                           WHEN stage_count > 0 OR needs_birthday OR name_count > 1 THEN '생년월일 확인'
                           ELSE '매칭'
                       END AS result,
                       CASE WHEN verified_birthday IS NOT NULL AND birthday_count = 1 THEN '수동 확인'
                            WHEN verified_birthday IS NULL AND stage_birthday IS NOT NULL AND birthday_count = 1
                                THEN 'eng_tmp_final'
                            WHEN verified_birthday IS NULL AND stage_count = 0 AND NOT needs_birthday AND name_count = 1
                                THEN '성명 단독'
                       END AS match_source
                FROM candidates c
            ), assignments AS (
                SELECT p.*, n.engr_id, n.match_source,
                       CASE WHEN NOT coalesce(n.in_roster, false) THEN '기술자명단 확인'
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
            )
            """;

    @Test
    void exportsAssignmentSqlAndEngineerReviewWorkbook() throws IOException, SQLException {
        String inputPath = System.getenv("WORK_OVERLAP_ENGINEER_XLSX");
        Assumptions.assumeTrue(inputPath != null, "Set WORK_OVERLAP_ENGINEER_XLSX to the source workbook");
        Path input = Path.of(inputPath);
        var formatter = new DataFormatter(Locale.ROOT);
        String query;
        try (var workbook = WorkbookFactory.create(input.toFile())) {
            var roster = readRows(findSheet(workbook, "기술자명단"), formatter,
                    List.of("성명", "직무분야", "전문분야", "재직상태", "퇴사일"));
            var participants = readRows(findSheet(workbook, "참여인력"), formatter,
                    List.of("성명", "계약번호", "분야", "참여구분", "비고"));
            assertThat(roster).isNotEmpty();
            assertThat(participants).isNotEmpty();
            query = sourceQuery(roster, participants);
            System.out.printf("Roster: %d, participation rows: %d%n", roster.size(), participants.size());
        }

        StandardEnvironment environment = loadDatasourceEnvironment();
        String filename = input.getFileName().toString();
        String prefix = filename.substring(0, filename.lastIndexOf('.'))
                + (environment.matchesProfiles("prod") ? "_prod" : "") + "_eng_tmp_final";
        Path reviewPath = input.resolveSibling(prefix + "_기술자_매핑검토.xlsx");
        try (Connection connection = openReviewConnection(environment)) {
            connection.setReadOnly(true);
            connection.setAutoCommit(false);
            connection.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);
            try (var statement = connection.createStatement()) {
                statement.execute("SET LOCAL standard_conforming_strings = on");
            }
            exportReview(connection, query, reviewPath);
            connection.rollback();
        }

        Path sqlPath = input.resolveSibling(prefix + "_work_overlap_contract_engineers.sql");
        Files.writeString(sqlPath, """
                -- Run with the target schema in search_path and load work_overlap_contracts first.
                -- Uses public.eng_tmp_final for full dates when the name and any Excel birth year agree.
                -- Enter one confirmed YYYYMMDD birthday per exact source name in verified_birthdays.
                -- Rows requiring review or with conflicting assignment details are held back.
                BEGIN;
                SET LOCAL standard_conforming_strings = on;
                LOCK TABLE work_overlap_contract_engineers IN SHARE ROW EXCLUSIVE MODE;
                """ + query + """
                INSERT INTO work_overlap_contract_engineers
                    (contract_no, engr_id, field, participation_type, remark, created_id, last_changed_id)
                SELECT contract_no, engr_id, nullif(field, ''), nullif(participation_type, ''),
                       nullif(remark, ''), 'migration', 'migration'
                FROM ready a
                WHERE variants = 1 AND NOT EXISTS (
                    SELECT 1 FROM work_overlap_contract_engineers existing
                    WHERE existing.contract_no = a.contract_no AND existing.engr_id = a.engr_id
                )
                RETURNING contract_no, engr_id;
                COMMIT;
                """, StandardCharsets.UTF_8);
        System.out.printf("%s%n%s%n", sqlPath, reviewPath);
    }

    private static StandardEnvironment loadDatasourceEnvironment() {
        var environment = new StandardEnvironment();
        environment.getPropertySources().addLast(new MapPropertySource(
                "workOverlapReviewDefaults", Map.of("spring.profiles.active", "prod")));
        ConfigDataEnvironmentPostProcessor.applyTo(environment);
        return environment;
    }

    private static Connection openReviewConnection(StandardEnvironment environment) throws SQLException {
        var properties = new Properties();
        properties.setProperty("user", environment.getRequiredProperty("spring.datasource.username"));
        properties.setProperty("password", environment.getProperty("spring.datasource.password", ""));
        properties.setProperty("connectTimeout", "5");
        properties.setProperty("readOnly", "true");
        properties.setProperty("readOnlyMode", "always");
        return DriverManager.getConnection(environment.getRequiredProperty("spring.datasource.url"), properties);
    }

    private static Sheet findSheet(org.apache.poi.ss.usermodel.Workbook workbook, String suffix) {
        return StreamSupport.stream(workbook.spliterator(), false)
                .filter(sheet -> sheet.getSheetName().strip().endsWith(suffix))
                .findFirst().orElseThrow(() -> new IllegalArgumentException("Missing sheet: " + suffix));
    }

    private static List<SourceRow> readRows(Sheet sheet, DataFormatter formatter, List<String> headers) {
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
                        || (headers.contains("계약번호") && !row.values().get(1).isBlank()))
                .toList();
    }

    private static String sourceQuery(List<SourceRow> roster, List<SourceRow> participants) {
        return "WITH roster(source_row, source_name, lookup_name, birth_year, needs_birthday, duty, specialty, employment, retired_on) AS (VALUES\n"
                + rowValues(roster)
                + "\n), participants(source_row, source_name, lookup_name, birth_year, needs_birthday, contract_no, field, participation_type, remark) AS (VALUES\n"
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
            var year = NAME_BIRTH_YEAR.matcher(name);
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

    private static void exportReview(Connection connection, String query, Path output)
            throws SQLException, IOException {
        try (var workbook = new XSSFWorkbook()) {
            writeSheet(connection, workbook, "미등록 후보", query + """
                    SELECT p.source_name AS "원본 성명", p.lookup_name AS "등록할 성명",
                           r.duty AS "직무분야", r.specialty AS "전문분야",
                           r.employment AS "재직상태", r.retired_on AS "퇴사일",
                           NULL::text AS "등록할 engr_id", p.stage_birthdays AS "임시명단 생년월일 후보",
                           NULL::text AS "확인 생년월일",
                           p.result AS "검토 상태"
                    FROM people p LEFT JOIN roster r USING (source_name)
                    WHERE p.source_name <> '' AND p.name_count = 0
                    ORDER BY p.source_name, r.source_row
                    """);
            writeSheet(connection, workbook, "생년월일 확인", query + """
                    SELECT source_name AS "원본 성명", lookup_name AS "조회 성명",
                           birth_year AS "엑셀 생년", candidate_ids AS "동일 성명 engr_id",
                           stage_birthdays AS "임시명단 생년월일 후보", NULL::text AS "확인 생년월일",
                           result AS "검토 상태"
                    FROM people
                    WHERE engr_id IS NULL AND (needs_birthday OR name_count > 1 OR stage_count > 1
                        OR (name_count > 0 AND stage_count > 0))
                    ORDER BY source_name
                    """);
            writeSheet(connection, workbook, "참여인력 매핑", query + """
                    SELECT a.source_row AS "원본 행", a.contract_no AS "계약번호", a.source_name AS "성명",
                           a.engr_id AS "engr_id", a.field AS "분야", a.participation_type AS "참여구분",
                           a.remark AS "비고", a.match_source AS "매핑 근거",
                           CASE WHEN a.source_name = '' OR a.contract_no = '' THEN '필수값 누락'
                                WHEN a.result <> '매칭' THEN a.result
                                WHEN r.variants > 1 THEN '동일 계약·기술자 상세 충돌'
                                WHEN EXISTS (SELECT 1 FROM work_overlap_contract_engineers e
                                    WHERE e.contract_no = a.contract_no AND e.engr_id = a.engr_id) THEN '기존 등록'
                                ELSE '등록 가능'
                           END AS "검토 상태"
                    FROM assignments a
                    LEFT JOIN ready r ON r.contract_no = a.contract_no AND r.engr_id = a.engr_id
                        AND r.field = a.field AND r.participation_type = a.participation_type AND r.remark = a.remark
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
        try (var statement = connection.createStatement(); var result = statement.executeQuery(sql)) {
            var metadata = result.getMetaData();
            int columns = metadata.getColumnCount();
            var header = sheet.createRow(0);
            for (int index = 1; index <= columns; index++) {
                header.createCell(index - 1).setCellValue(metadata.getColumnLabel(index));
                sheet.setColumnWidth(index - 1, 24 * 256);
            }
            int rowIndex = 1;
            while (result.next()) {
                var row = sheet.createRow(rowIndex++);
                for (int index = 1; index <= columns; index++) {
                    row.createCell(index - 1).setCellValue(result.getString(index));
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
