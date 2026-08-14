package com.cheil.cheil_be.application.commondepartment.service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.commondepartment.port.in.CommonDepartmentSearchCondition;
import com.cheil.cheil_be.application.commondepartment.port.in.CommonDepartmentUpsertCommand;
import com.cheil.cheil_be.application.commondepartment.port.out.CommonDepartmentRepository;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.commondepartment.Department;

@Service
@RequiredArgsConstructor
public class DepartmentAdminService {

    private static final int DEPT_CODE_MAX_LENGTH = 20;
    private static final int DEPT_NAME_MAX_LENGTH = 100;
    private static final int DEPT_DIV_MAX_LENGTH = 10;
    private static final int PROJ_DIV_MAX_LENGTH = 10;
    private static final int HEADQUARTER_CODE_MAX_LENGTH = 20;
    private static final int INPUT_DUTY_ID_MAX_LENGTH = 20;
    private static final int CHG_DUTY_ID_MAX_LENGTH = 20;
    private static final int SORT_SEQ_MAX_LENGTH = 10;
    private static final int COST_DEPT_MAX_LENGTH = 20;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter BASIC_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    private final CommonDepartmentRepository commonDepartmentRepository;
    private final DepartmentCacheService departmentCacheService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<Department> findAll(CommonDepartmentSearchCondition condition) {
        String keyword = StringValues.normalize(condition.keyword()).toLowerCase(Locale.ROOT);

        return departmentCacheService.getOrLoadAll(commonDepartmentRepository::findAll).stream()
                .filter(item -> matchesKeyword(item, keyword))
                .filter(item -> matchesBoolean(condition.useYn(), item.useYn()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Department findByDeptCode(String deptCode) {
        String normalizedDeptCode = StringValues.required(deptCode, "deptCode");
        return departmentCacheService.getOrLoadByDeptCode(
                        normalizedDeptCode,
                        () -> commonDepartmentRepository.findByDeptCode(normalizedDeptCode))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "부서를 찾을 수 없습니다."));
    }

    @Transactional
    public Department create(CommonDepartmentUpsertCommand command) {
        String deptCode = StringValues.required(command.deptCode(), "deptCode");
        if (commonDepartmentRepository.existsByDeptCode(deptCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 부서 코드입니다.");
        }

        String deptName = StringValues.required(command.deptName(), "deptName");
        String deptDiv = StringValues.required(command.deptDiv(), "deptDiv");
        String projDiv = StringValues.required(command.projDiv(), "projDiv");
        String headquarterCode = StringValues.required(command.headquarterCode(), "headquarterCode");
        String inputDutyId = StringValues.optional(command.inputDutyId(), "admin");
        String chgDutyId = StringValues.optional(command.chgDutyId(), "admin");
        String sortSeq = StringValues.required(command.sortSeq(), "sortSeq");
        String costDept = StringValues.normalize(command.costDept());

        validateLengths(deptCode, deptName, deptDiv, projDiv, headquarterCode, inputDutyId, chgDutyId, sortSeq, costDept);

        Instant now = Instant.now(clock);
        Department created = new Department(
                deptCode,
                deptName,
                deptDiv,
                projDiv,
                normalizeBoolean(command.useYn(), true),
                parseLocalDate(command.terminateDate()),
                headquarterCode,
                inputDutyId,
                now,
                chgDutyId,
                now,
                sortSeq,
                normalizeBoolean(command.mhYn(), false),
                costDept
        );
        Department saved = commonDepartmentRepository.save(created);
        departmentCacheService.refreshAfterCommit(saved, commonDepartmentRepository::findAll);
        return saved;
    }

    @Transactional
    public Department update(String deptCode, CommonDepartmentUpsertCommand command) {
        String normalizedDeptCode = StringValues.required(deptCode, "deptCode");
        Department existing = commonDepartmentRepository.findByDeptCode(normalizedDeptCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "부서를 찾을 수 없습니다."));

        String requestedDeptCode = StringValues.normalize(command.deptCode());
        if (!requestedDeptCode.isBlank() && !normalizedDeptCode.equals(requestedDeptCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "path deptCode와 body deptCode가 일치해야 합니다.");
        }

        String deptName = StringValues.required(command.deptName(), "deptName");
        String deptDiv = StringValues.required(command.deptDiv(), "deptDiv");
        String projDiv = StringValues.required(command.projDiv(), "projDiv");
        String headquarterCode = StringValues.required(command.headquarterCode(), "headquarterCode");
        String inputDutyId = StringValues.optional(command.inputDutyId(), existing.inputDutyId());
        String chgDutyId = StringValues.optional(command.chgDutyId(), existing.chgDutyId());
        String sortSeq = StringValues.required(command.sortSeq(), "sortSeq");
        String costDept = StringValues.normalize(command.costDept());

        validateLengths(normalizedDeptCode, deptName, deptDiv, projDiv, headquarterCode, inputDutyId, chgDutyId, sortSeq, costDept);

        Instant now = Instant.now(clock);
        Department updated = new Department(
                normalizedDeptCode,
                deptName,
                deptDiv,
                projDiv,
                normalizeBoolean(command.useYn(), existing.useYn()),
                parseLocalDate(command.terminateDate()),
                headquarterCode,
                inputDutyId,
                existing.inputDate(),
                chgDutyId,
                now,
                sortSeq,
                normalizeBoolean(command.mhYn(), existing.mhYn()),
                costDept
        );
        Department saved = commonDepartmentRepository.save(updated);
        departmentCacheService.refreshAfterCommit(saved, commonDepartmentRepository::findAll);
        return saved;
    }

    private void validateLengths(
            String deptCode,
            String deptName,
            String deptDiv,
            String projDiv,
            String headquarterCode,
            String inputDutyId,
            String chgDutyId,
            String sortSeq,
            String costDept
    ) {
        StringValues.validateMaxLength(deptCode, DEPT_CODE_MAX_LENGTH, "deptCode");
        StringValues.validateMaxLength(deptName, DEPT_NAME_MAX_LENGTH, "deptName");
        StringValues.validateMaxLength(deptDiv, DEPT_DIV_MAX_LENGTH, "deptDiv");
        StringValues.validateMaxLength(projDiv, PROJ_DIV_MAX_LENGTH, "projDiv");
        StringValues.validateMaxLength(headquarterCode, HEADQUARTER_CODE_MAX_LENGTH, "headquarterCode");
        StringValues.validateMaxLength(inputDutyId, INPUT_DUTY_ID_MAX_LENGTH, "inputDutyId");
        StringValues.validateMaxLength(chgDutyId, CHG_DUTY_ID_MAX_LENGTH, "chgDutyId");
        StringValues.validateMaxLength(sortSeq, SORT_SEQ_MAX_LENGTH, "sortSeq");
        StringValues.validateMaxLength(costDept, COST_DEPT_MAX_LENGTH, "costDept");
    }

    private static boolean matchesKeyword(Department item, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }

        return contains(item.deptCode(), keyword)
                || contains(item.deptName(), keyword)
                || contains(item.deptDiv(), keyword)
                || contains(item.projDiv(), keyword)
                || contains(item.headquarterCode(), keyword)
                || contains(item.inputDutyId(), keyword)
                || contains(item.chgDutyId(), keyword)
                || contains(item.sortSeq(), keyword)
                || contains(item.costDept(), keyword)
                || contains(item.terminateDate() == null ? "" : item.terminateDate().format(DATE_FORMATTER), keyword)
                || contains(item.inputDate() == null ? "" : item.inputDate().toString(), keyword)
                || contains(item.chgDate() == null ? "" : item.chgDate().toString(), keyword);
    }

    private static boolean matchesBoolean(Boolean expected, boolean actual) {
        return expected == null || expected == actual;
    }

    private static boolean normalizeBoolean(Boolean value, boolean fallback) {
        return value == null ? fallback : value;
    }

    private static LocalDate parseLocalDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim();
        if (normalized.matches("\\d{8}")) {
            return LocalDate.parse(normalized, BASIC_DATE_FORMATTER);
        }
        return LocalDate.parse(normalized, DATE_FORMATTER);
    }

    private static boolean contains(String value, String keyword) {
        return value != null && StringValues.containsIgnoreCase(value, keyword);
    }
}
