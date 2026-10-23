package com.cheil.cheil_be.adapter.out.persistence.newemployment;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployee;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployeeCommand;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployeeSearch;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatus;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatusCommand;
import com.cheil.cheil_be.application.newemployment.port.out.NewEmploymentRateRepository;

@Repository
@RequiredArgsConstructor
public class JdbcNewEmploymentRateRepository implements NewEmploymentRateRepository {

    private static final String GLOBAL_DEPARTMENT_CODE = "ALL";
    private static final String EMPLOYEE_SELECT = """
            SELECT employee.id,
                   employee.base_year_month,
                   employee.employee_no,
                   employee.employee_name,
                   employee.birth_date,
                   employee.hire_date,
                   employee.department_code,
                   COALESCE(department.dept_name, employee.department_code) AS department_name,
                   employee.job_category,
                   employee.remark,
                   employee.created_at,
                   employee.created_id,
                   employee.last_changed_at,
                   employee.last_changed_id
            FROM new_employment_employees employee
            LEFT JOIN department ON department.dept_code = employee.department_code
            """;
    private static final String EMPLOYEE_SEARCH_WHERE = """
            WHERE (CAST(:selectedYearMonth AS VARCHAR) IS NULL
                   OR REPLACE(employee.base_year_month, '-', '') = CAST(:selectedYearMonth AS VARCHAR))
              AND (CAST(:departmentCode AS VARCHAR) IS NULL
                   OR employee.department_code = CAST(:departmentCode AS VARCHAR))
              AND (CAST(:employeeName AS VARCHAR) IS NULL
                   OR LOWER(employee.employee_name) LIKE CAST(:employeeName AS VARCHAR))
            """;

    private final JdbcClient jdbcClient;

    @Override
    public Optional<NewEmploymentMonthlyStatus> findMonthlyStatusById(Long id) {
        return jdbcClient.sql("""
                        SELECT id, base_year_month, employee_count,
                               COALESCE(new_hire_count, 0) AS new_hire_count,
                               created_at, created_id, last_changed_at, last_changed_id
                        FROM new_employment_monthly_counts
                        WHERE id = :id AND department_code = :departmentCode
                        """)
                .param("id", id)
                .param("departmentCode", GLOBAL_DEPARTMENT_CODE)
                .query((rs, rowNum) -> mapMonthlyStatus(rs))
                .optional();
    }

    @Override
    public Long upsertMonthlyStatus(NewEmploymentMonthlyStatusCommand command, String actor) {
        return jdbcClient.sql("""
                        INSERT INTO new_employment_monthly_counts (
                            base_year_month, department_code, employee_count, new_hire_count,
                            created_id, last_changed_id
                        )
                        VALUES (:baseYearMonth, :departmentCode, :employeeCount, :newHireCount, :actor, :actor)
                        ON CONFLICT (base_year_month, department_code) DO UPDATE
                        SET employee_count = EXCLUDED.employee_count,
                            new_hire_count = EXCLUDED.new_hire_count,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = EXCLUDED.last_changed_id
                        RETURNING id
                        """)
                .param("baseYearMonth", command.baseYearMonth())
                .param("departmentCode", GLOBAL_DEPARTMENT_CODE)
                .param("employeeCount", command.employeeCount())
                .param("newHireCount", command.newHireCount())
                .param("actor", actor)
                .query(Long.class)
                .single();
    }

    @Override
    public int updateMonthlyStatus(Long id, NewEmploymentMonthlyStatusCommand command, String actor) {
        return jdbcClient.sql("""
                        UPDATE new_employment_monthly_counts
                        SET base_year_month = :baseYearMonth,
                            employee_count = :employeeCount,
                            new_hire_count = :newHireCount,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE id = :id AND department_code = :departmentCode
                        """)
                .param("id", id)
                .param("baseYearMonth", command.baseYearMonth())
                .param("employeeCount", command.employeeCount())
                .param("newHireCount", command.newHireCount())
                .param("departmentCode", GLOBAL_DEPARTMENT_CODE)
                .param("actor", actor)
                .update();
    }

    @Override
    public int deleteMonthlyStatus(Long id) {
        return jdbcClient.sql("""
                        DELETE FROM new_employment_monthly_counts
                        WHERE id = :id AND department_code = :departmentCode
                        """)
                .param("id", id)
                .param("departmentCode", GLOBAL_DEPARTMENT_CODE)
                .update();
    }

    @Override
    public Page<NewEmploymentEmployee> findEmployees(
            NewEmploymentEmployeeSearch search, Pageable pageable) {
        List<NewEmploymentEmployee> content = bindEmployeeSearch(
                jdbcClient.sql(EMPLOYEE_SELECT + EMPLOYEE_SEARCH_WHERE + """
                        ORDER BY employee.base_year_month DESC, employee.hire_date DESC,
                                 employee.employee_name, employee.id DESC
                        LIMIT :limit OFFSET :offset
                        """), search)
                .param("limit", pageable.getPageSize())
                .param("offset", pageable.getOffset())
                .query((rs, rowNum) -> mapEmployee(rs))
                .list();

        Long total = bindEmployeeSearch(
                jdbcClient.sql("SELECT COUNT(*) FROM new_employment_employees employee " + EMPLOYEE_SEARCH_WHERE),
                search
        ).query(Long.class).single();
        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    @Override
    public Optional<NewEmploymentEmployee> findEmployeeById(Long id) {
        return jdbcClient.sql(EMPLOYEE_SELECT + "WHERE employee.id = :id")
                .param("id", id)
                .query((rs, rowNum) -> mapEmployee(rs))
                .optional();
    }

    @Override
    public Long createEmployee(NewEmploymentEmployeeCommand command, String actor) {
        return jdbcClient.sql("""
                        INSERT INTO new_employment_employees (
                            base_year_month, employee_no, employee_name, birth_date, hire_date,
                            department_code, job_category, remark, created_id, last_changed_id
                        )
                        VALUES (
                            :baseYearMonth, :employeeNo, :employeeName, :birthDate, :hireDate,
                            :departmentCode, :jobCategory, :remark, :actor, :actor
                        )
                        RETURNING id
                        """)
                .param("baseYearMonth", command.baseYearMonth())
                .param("employeeNo", command.employeeNo())
                .param("employeeName", command.employeeName())
                .param("birthDate", command.birthDate())
                .param("hireDate", command.hireDate())
                .param("departmentCode", command.departmentCode())
                .param("jobCategory", command.jobCategory())
                .param("remark", command.remark())
                .param("actor", actor)
                .query(Long.class)
                .single();
    }

    @Override
    public int updateEmployee(Long id, NewEmploymentEmployeeCommand command, String actor) {
        return jdbcClient.sql("""
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
                .param("baseYearMonth", command.baseYearMonth())
                .param("employeeNo", command.employeeNo())
                .param("employeeName", command.employeeName())
                .param("birthDate", command.birthDate())
                .param("hireDate", command.hireDate())
                .param("departmentCode", command.departmentCode())
                .param("jobCategory", command.jobCategory())
                .param("remark", command.remark())
                .param("actor", actor)
                .update();
    }

    @Override
    public int deleteEmployee(Long id) {
        return jdbcClient.sql("DELETE FROM new_employment_employees WHERE id = :id")
                .param("id", id)
                .update();
    }

    @Override
    public boolean departmentExists(String departmentCode) {
        Boolean exists = jdbcClient.sql("SELECT EXISTS (SELECT 1 FROM department WHERE dept_code = :departmentCode)")
                .param("departmentCode", departmentCode)
                .query(Boolean.class)
                .single();
        return Boolean.TRUE.equals(exists);
    }

    private JdbcClient.StatementSpec bindEmployeeSearch(
            JdbcClient.StatementSpec statement,
            NewEmploymentEmployeeSearch search
    ) {
        String employeeName = search.employeeName() == null
                ? null
                : "%" + search.employeeName().toLowerCase(Locale.ROOT) + "%";
        return statement
                .param("selectedYearMonth", search.selectedYearMonth())
                .param("departmentCode", search.departmentCode())
                .param("employeeName", employeeName);
    }

    private NewEmploymentMonthlyStatus mapMonthlyStatus(ResultSet rs) throws SQLException {
        return new NewEmploymentMonthlyStatus(
                rs.getLong("id"), rs.getString("base_year_month"),
                rs.getObject("employee_count", Integer.class),
                rs.getObject("new_hire_count", Integer.class),
                instant(rs.getTimestamp("created_at")), rs.getString("created_id"),
                instant(rs.getTimestamp("last_changed_at")), rs.getString("last_changed_id")
        );
    }

    private NewEmploymentEmployee mapEmployee(ResultSet rs) throws SQLException {
        return new NewEmploymentEmployee(
                rs.getLong("id"), rs.getString("base_year_month"), rs.getString("employee_no"),
                rs.getString("employee_name"), rs.getString("birth_date"), rs.getString("hire_date"),
                rs.getString("department_code"), rs.getString("department_name"),
                rs.getString("job_category"), rs.getString("remark"),
                instant(rs.getTimestamp("created_at")), rs.getString("created_id"),
                instant(rs.getTimestamp("last_changed_at")), rs.getString("last_changed_id")
        );
    }

    private Instant instant(Timestamp value) {
        return value == null ? null : value.toInstant();
    }
}
