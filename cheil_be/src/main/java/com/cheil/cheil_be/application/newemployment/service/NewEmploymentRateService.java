package com.cheil.cheil_be.application.newemployment.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.newemployment.NewEmploymentEmployeeRequest;
import com.cheil.cheil_be.adapter.in.web.newemployment.NewEmploymentEmployeeResponse;
import com.cheil.cheil_be.adapter.in.web.newemployment.NewEmploymentMonthlyStatusRequest;
import com.cheil.cheil_be.adapter.in.web.newemployment.NewEmploymentMonthlyStatusPivotResponse;
import com.cheil.cheil_be.adapter.in.web.newemployment.NewEmploymentMonthlyStatusResponse;
import com.cheil.cheil_be.adapter.in.web.newemployment.NewEmploymentRateSummaryResponse;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.common.text.StringValues;

@Service
@RequiredArgsConstructor
public class NewEmploymentRateService {

    private static final String GLOBAL_MONTHLY_DEPARTMENT_CODE = "ALL";
    private static final int EMPLOYEE_NO_MAX_LENGTH = 30;
    private static final int EMPLOYEE_NAME_MAX_LENGTH = 100;
    private static final int DEPARTMENT_CODE_MAX_LENGTH = 30;
    private static final int JOB_CATEGORY_MAX_LENGTH = 100;
    private static final int REMARK_MAX_LENGTH = 1000;
    private static final int MONTHLY_STATUS_WINDOW = 12;
    private static final int SUMMARY_WINDOW = 24;
    private static final DateTimeFormatter COMPACT_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;
    private static final DateTimeFormatter YEAR_MONTH_KEY_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");

    private final JdbcClient jdbcClient;

    @Transactional(readOnly = true)
    public NewEmploymentRateSummaryResponse summary(String baseYearMonth, String departmentCode, String employeeName) {
        List<MonthlyStatusRow> monthlyRows = loadMonthlyStatusRows(baseYearMonth, SUMMARY_WINDOW);
        List<MonthlyStatusRow> recentRows = monthlyRows.size() >= MONTHLY_STATUS_WINDOW
                ? monthlyRows.subList(monthlyRows.size() - MONTHLY_STATUS_WINDOW, monthlyRows.size())
                : monthlyRows;
        List<MonthlyStatusRow> previousRows = monthlyRows.size() >= MONTHLY_STATUS_WINDOW
                ? monthlyRows.subList(0, monthlyRows.size() - MONTHLY_STATUS_WINDOW)
                : List.of();
        int newHireCount = recentRows.stream().mapToInt(row -> row.newHireCount() == null ? 0 : row.newHireCount()).sum();
        BigDecimal previousAverage = average(previousRows.stream().map(MonthlyStatusRow::employeeCount).toList());
        BigDecimal recentAverage = average(recentRows.stream().map(MonthlyStatusRow::employeeCount).toList());

        return new NewEmploymentRateSummaryResponse(
                newHireCount,
                previousAverage,
                recentAverage,
                rate(BigDecimal.valueOf(newHireCount), previousAverage),
                rate(BigDecimal.valueOf(newHireCount), recentAverage)
        );
    }

    @Transactional(readOnly = true)
    public List<NewEmploymentMonthlyStatusResponse> monthlyStatuses(String baseYearMonth, String departmentCode, String employeeName) {
        return loadMonthlyStatusRows(baseYearMonth, MONTHLY_STATUS_WINDOW).stream()
                .map(this::toMonthlyStatusResponse)
                .toList();
    }

        @Transactional(readOnly = true)
    public List<NewEmploymentMonthlyStatusPivotResponse> monthlyStatusPivot(String baseYearMonth) {
        String normalizedAnchor = normalizeYearMonthAnchor(baseYearMonth);
        return jdbcClient.sql("""
                        with month as (
                            SELECT TO_CHAR(month_date, 'YYYY-MM') AS year_month
                            FROM generate_series(
                                DATE_TRUNC('month', to_date(:baseYearMonth, 'YYYYMM')) - INTERVAL '12 months',
                                DATE_TRUNC('month', to_date(:baseYearMonth, 'YYYYMM')),
                                INTERVAL '1 month'
                            ) AS month_date
                        )
                        SELECT m.year_month, coalesce(c.employee_count, 0) cnt
                        FROM month m
                        left join new_employment_monthly_counts c
                          on (m.year_month = c.base_year_month)
                        order by 1
                        """)
                .param("baseYearMonth", normalizedAnchor)
                .query((rs, rowNum) -> new NewEmploymentMonthlyStatusPivotResponse(
                        rs.getString("year_month"),
                        rs.getBigDecimal("cnt")
                ))
                .list();
    }

    @Transactional(readOnly = true)
    public NewEmploymentMonthlyStatusResponse findMonthlyStatusById(Long id) {
        return findMonthlyStatusRowById(id)
                .map(this::toMonthlyStatusResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "New employment record not found."));
    }

    @Transactional
    public NewEmploymentMonthlyStatusResponse createMonthlyStatus(NewEmploymentMonthlyStatusRequest request) {
        validate(request);
        String actor = AuditActorResolver.resolve();
        Long id = jdbcClient.sql("""
                        INSERT INTO new_employment_monthly_counts (
                            base_year_month,
                            department_code,
                            employee_count,
                            new_hire_count,
                            created_id,
                            last_changed_id
                        )
                        VALUES (
                            :baseYearMonth,
                            :departmentCode,
                            :employeeCount,
                            :newHireCount,
                            :actor,
                            :actor
                        )
                        RETURNING id
                        """)
                .param("baseYearMonth", normalizeMonthStorage(request.baseYearMonth(), "baseYearMonth", true))
                .param("departmentCode", GLOBAL_MONTHLY_DEPARTMENT_CODE)
                .param("employeeCount", normalizeCount(request.employeeCount(), "employeeCount"))
                .param("newHireCount", normalizeCount(request.newHireCount(), "newHireCount"))
                .param("actor", actor)
                .query(Long.class)
                .single();
        return findMonthlyStatusById(id);
    }

    @Transactional
    public NewEmploymentMonthlyStatusResponse updateMonthlyStatus(Long id, NewEmploymentMonthlyStatusRequest request) {
        findMonthlyStatusById(id);
        validate(request);
        String actor = AuditActorResolver.resolve();
        jdbcClient.sql("""
                        UPDATE new_employment_monthly_counts
                        SET base_year_month = :baseYearMonth,
                            employee_count = :employeeCount,
                            new_hire_count = :newHireCount,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE id = :id
                          AND department_code = :departmentCode
                        """)
                .param("id", id)
                .param("baseYearMonth", normalizeMonthStorage(request.baseYearMonth(), "baseYearMonth", true))
                .param("employeeCount", normalizeCount(request.employeeCount(), "employeeCount"))
                .param("newHireCount", normalizeCount(request.newHireCount(), "newHireCount"))
                .param("departmentCode", GLOBAL_MONTHLY_DEPARTMENT_CODE)
                .param("actor", actor)
                .update();
        return findMonthlyStatusById(id);
    }

    @Transactional
    public void deleteMonthlyStatus(Long id) {
        findMonthlyStatusById(id);
        int deleted = jdbcClient.sql("""
                        DELETE FROM new_employment_monthly_counts
                        WHERE id = :id
                          AND department_code = :departmentCode
                        """)
                .param("id", id)
                .param("departmentCode", GLOBAL_MONTHLY_DEPARTMENT_CODE)
                .update();
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "New employment record not found.");
        }
    }

    @Transactional(readOnly = true)
    public Page<NewEmploymentEmployeeResponse> findEmployees(
            String selectedYearMonth,
            String departmentCode,
            String employeeName,
            Pageable pageable
    ) {
        String normalizedYearMonth = normalizeYearMonthFilter(selectedYearMonth);
        String normalizedDepartmentCode = normalizeDepartmentCode(departmentCode);
        String normalizedEmployeeName = nullIfBlank(employeeName);
        String listSql = """
                SELECT h.id,
                       h.base_year_month,
                       h.employee_no,
                       h.employee_name,
                       h.birth_date,
                       h.hire_date,
                       h.department_code,
                       COALESCE(d.dept_name, h.department_code) AS department_name,
                       h.job_category,
                       h.remark,
                       h.created_at,
                       h.created_id,
                       h.last_changed_at,
                       h.last_changed_id
                FROM new_employment_employees h
                LEFT JOIN department d ON d.dept_code = h.department_code
                WHERE (CAST(:selectedYearMonth AS VARCHAR) IS NULL OR REPLACE(h.base_year_month, '-', '') = CAST(:selectedYearMonth AS VARCHAR))
                  AND (CAST(:departmentCode AS VARCHAR) IS NULL OR h.department_code = CAST(:departmentCode AS VARCHAR))
                  AND (CAST(:employeeName AS VARCHAR) IS NULL OR LOWER(h.employee_name) LIKE CAST(:employeeName AS VARCHAR))
                ORDER BY h.base_year_month DESC, h.hire_date DESC, h.employee_name, h.id DESC
                LIMIT :limit OFFSET :offset
                """;

        List<NewEmploymentEmployeeResponse> content = jdbcClient.sql(listSql)
                .param("selectedYearMonth", normalizedYearMonth)
                .param("departmentCode", normalizedDepartmentCode)
                .param("employeeName", normalizedEmployeeName == null ? null : "%" + normalizedEmployeeName.toLowerCase(Locale.ROOT) + "%")
                .param("limit", pageable.getPageSize())
                .param("offset", pageable.getOffset())
                .query((rs, rowNum) -> mapEmployee(rs))
                .list();
        Long total = jdbcClient.sql("""
                        SELECT COUNT(*)
                        FROM new_employment_employees h
                        LEFT JOIN department d ON d.dept_code = h.department_code
                        WHERE (CAST(:selectedYearMonth AS VARCHAR) IS NULL OR REPLACE(h.base_year_month, '-', '') = CAST(:selectedYearMonth AS VARCHAR))
                          AND (CAST(:departmentCode AS VARCHAR) IS NULL OR h.department_code = CAST(:departmentCode AS VARCHAR))
                          AND (CAST(:employeeName AS VARCHAR) IS NULL OR LOWER(h.employee_name) LIKE CAST(:employeeName AS VARCHAR))
                        """)
                .param("selectedYearMonth", normalizedYearMonth)
                .param("departmentCode", normalizedDepartmentCode)
                .param("employeeName", normalizedEmployeeName == null ? null : "%" + normalizedEmployeeName.toLowerCase(Locale.ROOT) + "%")
                .query(Long.class)
                .single();
        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    @Transactional(readOnly = true)
    public NewEmploymentEmployeeResponse findEmployeeById(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid department code.");
        }
        return jdbcClient.sql("""
                        SELECT h.id,
                               h.base_year_month,
                               h.employee_no,
                               h.employee_name,
                               h.birth_date,
                               h.hire_date,
                               h.department_code,
                               COALESCE(d.dept_name, h.department_code) AS department_name,
                               h.job_category,
                               h.remark,
                               h.created_at,
                               h.created_id,
                               h.last_changed_at,
                               h.last_changed_id
                        FROM new_employment_employees h
                        LEFT JOIN department d ON d.dept_code = h.department_code
                        WHERE h.id = :id
                        """)
                .param("id", id)
                .query((rs, rowNum) -> mapEmployee(rs))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "New employment record not found."));
    }

    @Transactional
    public NewEmploymentEmployeeResponse createEmployee(NewEmploymentEmployeeRequest request) {
        validate(request);
        ensureDepartmentExists(request.departmentCode());
        String actor = AuditActorResolver.resolve();
        Long id = jdbcClient.sql("""
                        INSERT INTO new_employment_employees (
                            base_year_month,
                            employee_no,
                            employee_name,
                            birth_date,
                            hire_date,
                            department_code,
                            job_category,
                            remark,
                            created_id,
                            last_changed_id
                        )
                        VALUES (
                            :baseYearMonth,
                            :employeeNo,
                            :employeeName,
                            :birthDate,
                            :hireDate,
                            :departmentCode,
                            :jobCategory,
                            :remark,
                            :actor,
                            :actor
                        )
                        RETURNING id
                        """)
                .param("baseYearMonth", normalizeMonthStorage(request.baseYearMonth(), "baseYearMonth", true))
                .param("employeeNo", nullIfBlank(request.employeeNo()))
                .param("employeeName", StringValues.required(request.employeeName(), "employeeName").trim())
                .param("birthDate", normalizeDate(request.birthDate(), "birthDate", false))
                .param("hireDate", normalizeDate(request.hireDate(), "hireDate", true))
                .param("departmentCode", StringValues.required(request.departmentCode(), "departmentCode").trim())
                .param("jobCategory", nullIfBlank(request.jobCategory()))
                .param("remark", nullIfBlank(request.remark()))
                .param("actor", actor)
                .query(Long.class)
                .single();
        return findEmployeeById(id);
    }

    @Transactional
    public NewEmploymentEmployeeResponse updateEmployee(Long id, NewEmploymentEmployeeRequest request) {
        findEmployeeById(id);
        validate(request);
        ensureDepartmentExists(request.departmentCode());
        String actor = AuditActorResolver.resolve();
        jdbcClient.sql("""
                        UPDATE new_employment_employees
                        SET base_year_month = :baseYearMonth,
                            employee_no = :employeeNo,
                            employee_name = :employeeName,
                            birth_date = :birthDate,
                            hire_date = :hireDate,
                            department_code = :departmentCode,
                            job_category = :jobCategory,
                            remark = :remark,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE id = :id
                        """)
                .param("id", id)
                .param("baseYearMonth", normalizeMonthStorage(request.baseYearMonth(), "baseYearMonth", true))
                .param("employeeNo", nullIfBlank(request.employeeNo()))
                .param("employeeName", StringValues.required(request.employeeName(), "employeeName").trim())
                .param("birthDate", normalizeDate(request.birthDate(), "birthDate", false))
                .param("hireDate", normalizeDate(request.hireDate(), "hireDate", true))
                .param("departmentCode", StringValues.required(request.departmentCode(), "departmentCode").trim())
                .param("jobCategory", nullIfBlank(request.jobCategory()))
                .param("remark", nullIfBlank(request.remark()))
                .param("actor", actor)
                .update();
        return findEmployeeById(id);
    }

    @Transactional
    public void deleteEmployee(Long id) {
        findEmployeeById(id);
        int deleted = jdbcClient.sql("DELETE FROM new_employment_employees WHERE id = :id")
                .param("id", id)
                .update();
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "New employment record not found.");
        }
    }

    private List<MonthlyStatusRow> loadMonthlyStatusRows(String baseYearMonth, int monthCount) {
        String normalizedYearMonth = normalizeYearMonthAnchor(baseYearMonth);
        return jdbcClient.sql("""
                        WITH months AS (
                            SELECT to_char(
                                       date_trunc('month', to_date(:baseYearMonth || '01', 'YYYYMMDD'))
                                       - make_interval(months => :monthCount - 1)
                                       + make_interval(months => gs),
                                       'YYYY-MM'
                                   ) AS base_year_month
                            FROM generate_series(0, :monthCount - 1) AS gs
                        ),
                        monthly_counts AS (
                            SELECT base_year_month,
                                   COALESCE(SUM(employee_count), 0)::integer AS employee_count,
                                   COALESCE(SUM(new_hire_count), 0)::integer AS new_hire_count,
                                   MAX(id) AS id
                            FROM new_employment_monthly_counts
                            WHERE department_code = :departmentCode
                              AND base_year_month BETWEEN (
                                  SELECT MIN(base_year_month) FROM months
                              ) AND (
                                  SELECT MAX(base_year_month) FROM months
                              )
                            GROUP BY base_year_month
                        )
                        SELECT COALESCE(counts.id, 0) AS id,
                               months.base_year_month,
                               COALESCE(counts.employee_count, 0) AS employee_count,
                               COALESCE(counts.new_hire_count, 0) AS new_hire_count,
                               NULL AS created_at,
                               NULL AS created_id,
                               NULL AS last_changed_at,
                               NULL AS last_changed_id
                        FROM months
                        LEFT JOIN monthly_counts counts ON counts.base_year_month = months.base_year_month
                        ORDER BY months.base_year_month
                        """)
                .param("departmentCode", GLOBAL_MONTHLY_DEPARTMENT_CODE)
                .param("baseYearMonth", normalizedYearMonth)
                .param("monthCount", monthCount)
                .query((rs, rowNum) -> new MonthlyStatusRow(
                        rs.getLong("id"),
                        rs.getString("base_year_month"),
                        rs.getObject("employee_count", Integer.class),
                        rs.getObject("new_hire_count", Integer.class),
                        toInstant(rs.getTimestamp("created_at")),
                        rs.getString("created_id"),
                        toInstant(rs.getTimestamp("last_changed_at")),
                        rs.getString("last_changed_id")
                ))
                .list();
    }

    private String normalizeYearMonthAnchor(String value) {
        String normalized = normalizeYearMonthFilter(value);
        return normalized != null ? normalized : LocalDate.now().format(YEAR_MONTH_KEY_FORMATTER);
    }

    private java.util.Optional<MonthlyStatusRow> findMonthlyStatusRowById(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid department code.");
        }
        return jdbcClient.sql("""
                        SELECT id,
                               base_year_month,
                               employee_count,
                               COALESCE(new_hire_count, 0) AS new_hire_count,
                               created_at,
                               created_id,
                               last_changed_at,
                               last_changed_id
                        FROM new_employment_monthly_counts
                        WHERE id = :id
                          AND department_code = :departmentCode
                        """)
                .param("id", id)
                .param("departmentCode", GLOBAL_MONTHLY_DEPARTMENT_CODE)
                .query((rs, rowNum) -> new MonthlyStatusRow(
                        rs.getLong("id"),
                        rs.getString("base_year_month"),
                        rs.getObject("employee_count", Integer.class),
                        rs.getObject("new_hire_count", Integer.class),
                        toInstant(rs.getTimestamp("created_at")),
                        rs.getString("created_id"),
                        toInstant(rs.getTimestamp("last_changed_at")),
                        rs.getString("last_changed_id")
                ))
                .optional();
    }

    private NewEmploymentMonthlyStatusResponse toMonthlyStatusResponse(MonthlyStatusRow row) {
        return new NewEmploymentMonthlyStatusResponse(
                row.id(),
                row.baseYearMonth(),
                row.employeeCount(),
                row.newHireCount(),
                row.createdAt(),
                row.createdId(),
                row.lastChangedAt(),
                row.lastChangedId()
        );
    }

    private BigDecimal average(List<Integer> values) {
        if (values.isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal sum = values.stream()
                .map(value -> BigDecimal.valueOf(value == null ? 0 : value))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(values.size()), 1, RoundingMode.HALF_UP);
    }

    private BigDecimal rate(BigDecimal numerator, BigDecimal denominator) {
        if (denominator == null || BigDecimal.ZERO.compareTo(denominator) == 0) {
            return null;
        }
        return numerator.multiply(BigDecimal.valueOf(100)).divide(denominator, 2, RoundingMode.HALF_UP);
    }

    private String normalizeYearMonthFilter(String value) {
        String normalized = StringValues.normalize(value);
        if (!StringUtils.hasText(normalized)) {
            return null;
        }
        String compact = normalized.trim().replace("-", "");
        if (!compact.matches("\\d{6}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid department code.");
        }
        return compact;
    }

    private String normalizeMonthStorage(String value, String fieldName, boolean required) {
        String normalized = StringValues.normalize(value);
        if (!StringUtils.hasText(normalized)) {
            if (required) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
            }
            return null;
        }
        String compact = normalized.trim().replace("-", "");
        if (!compact.matches("\\d{6}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be YYYYMM.");
        }
        return compact.substring(0, 4) + "-" + compact.substring(4, 6);
    }

    private NewEmploymentEmployeeResponse mapEmployee(ResultSet rs) throws SQLException {
        return new NewEmploymentEmployeeResponse(
                rs.getLong("id"),
                rs.getString("base_year_month"),
                rs.getString("employee_no"),
                rs.getString("employee_name"),
                rs.getString("birth_date"),
                rs.getString("hire_date"),
                rs.getString("department_code"),
                rs.getString("department_name"),
                rs.getString("job_category"),
                rs.getString("remark"),
                toInstant(rs.getTimestamp("created_at")),
                rs.getString("created_id"),
                toInstant(rs.getTimestamp("last_changed_at")),
                rs.getString("last_changed_id")
        );
    }

    private void validate(NewEmploymentEmployeeRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid department code.");
        }
        normalizeMonthStorage(request.baseYearMonth(), "baseYearMonth", true);
        StringValues.validateMaxLength(StringValues.normalize(request.employeeNo()), EMPLOYEE_NO_MAX_LENGTH, "employeeNo");
        StringValues.validateMaxLength(StringValues.required(request.employeeName(), "employeeName"), EMPLOYEE_NAME_MAX_LENGTH, "employeeName");
        StringValues.validateMaxLength(StringValues.required(request.departmentCode(), "departmentCode"), DEPARTMENT_CODE_MAX_LENGTH, "departmentCode");
        StringValues.validateMaxLength(StringValues.normalize(request.jobCategory()), JOB_CATEGORY_MAX_LENGTH, "jobCategory");
        StringValues.validateMaxLength(StringValues.normalize(request.remark()), REMARK_MAX_LENGTH, "remark");
        normalizeDate(request.birthDate(), "birthDate", false);
        normalizeDate(request.hireDate(), "hireDate", true);
    }

    private void validate(NewEmploymentMonthlyStatusRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid department code.");
        }
        normalizeMonthStorage(request.baseYearMonth(), "baseYearMonth", true);
        normalizeCount(request.employeeCount(), "employeeCount");
        normalizeCount(request.newHireCount(), "newHireCount");
    }

    private int normalizeCount(Integer value, String fieldName) {
        if (value == null) {
            return 0;
        }
        if (value < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be 0 or greater.");
        }
        return value;
    }

    private void ensureDepartmentExists(String departmentCode) {
        Boolean exists = jdbcClient.sql("SELECT EXISTS (SELECT 1 FROM department WHERE dept_code = :departmentCode)")
                .param("departmentCode", StringValues.required(departmentCode, "departmentCode").trim())
                .query(Boolean.class)
                .single();
        if (!Boolean.TRUE.equals(exists)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid department code.");
        }
    }

    private String normalizeDate(String value, String fieldName, boolean required) {
        String normalized = StringValues.normalize(value);
        if (!StringUtils.hasText(normalized)) {
            if (required) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
            }
            return null;
        }
        String compact = normalized.replace("-", "");
        if (!compact.matches("\\d{8}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be YYYYMMDD.");
        }
        try {
            LocalDate.parse(compact, COMPACT_DATE_FORMATTER);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be YYYYMMDD.");
        }
        return compact;
    }

    private String normalizeDepartmentCode(String value) {
        String normalized = StringValues.normalize(value);
        if (!StringUtils.hasText(normalized) || "All".equalsIgnoreCase(normalized.trim())) {
            return null;
        }
        return normalized.trim();
    }

    private String nullIfBlank(String value) {
        String normalized = StringValues.normalize(value);
        return StringUtils.hasText(normalized) ? normalized.trim() : null;
    }

    private java.time.Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }

    private record MonthlyStatusRow(
            Long id,
            String baseYearMonth,
            Integer employeeCount,
            Integer newHireCount,
            java.time.Instant createdAt,
            String createdId,
            java.time.Instant lastChangedAt,
            String lastChangedId
    ) {
    }
}


