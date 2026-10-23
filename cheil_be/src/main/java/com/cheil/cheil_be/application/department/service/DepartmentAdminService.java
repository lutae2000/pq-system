package com.cheil.cheil_be.application.department.service;

import java.time.Clock;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.common.validation.InputValues;
import com.cheil.cheil_be.application.department.port.in.DepartmentSearchCondition;
import com.cheil.cheil_be.application.department.port.in.DepartmentUpsertCommand;
import com.cheil.cheil_be.application.department.port.in.DepartmentUseCase;
import com.cheil.cheil_be.application.department.port.out.DepartmentRepository;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.department.Department;

@Service
@RequiredArgsConstructor
public class DepartmentAdminService implements DepartmentUseCase {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private final DepartmentRepository departmentRepository;
    private final DepartmentCacheService departmentCacheService;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<Department> findAll(DepartmentSearchCondition condition) {
        String keyword = condition == null ? "" : StringValues.normalize(condition.keyword()).toLowerCase(Locale.ROOT);
        Boolean useYn = condition == null ? null : condition.useYn();

        return departmentCacheService.getOrLoadAll(departmentRepository::findAll).stream()
                .filter(item -> matchesKeyword(item, keyword))
                .filter(item -> useYn == null || useYn == item.useYn())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Department findByDeptCode(String deptCode) {
        String normalizedDeptCode = InputValues.requiredText(deptCode, "deptCode");
        return departmentCacheService.getOrLoadByDeptCode(
                        normalizedDeptCode,
                        () -> departmentRepository.findByDeptCode(normalizedDeptCode))
                .orElseThrow(() -> ApplicationException.notFound("부서를 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public Department create(DepartmentUpsertCommand command) {
        InputValues.requireNonNull(command, "요청 본문은 필수입니다.");
        String deptCode = command.deptCode();
        if (departmentRepository.existsByDeptCode(deptCode)) {
            throw ApplicationException.conflict("이미 존재하는 부서 코드입니다.");
        }
        Department saved = departmentRepository.save(command.toDomain(null, Instant.now(clock)));
        departmentCacheService.refreshAfterCommit(saved, departmentRepository::findAll);
        return saved;
    }

    @Override
    @Transactional
    public Department update(String deptCode, DepartmentUpsertCommand command) {
        InputValues.requireNonNull(command, "요청 본문은 필수입니다.");
        String normalizedDeptCode = InputValues.requiredText(deptCode, "deptCode");
        Department existing = departmentRepository.findByDeptCode(normalizedDeptCode)
                .orElseThrow(() -> ApplicationException.notFound("부서를 찾을 수 없습니다."));

        String requestedDeptCode = StringValues.normalize(command.deptCode());
        if (!requestedDeptCode.isBlank() && !normalizedDeptCode.equals(requestedDeptCode)) {
            throw ApplicationException.badRequest("path deptCode와 body deptCode가 일치해야 합니다.");
        }
        Department saved = departmentRepository.save(command.toDomain(existing, Instant.now(clock)));
        departmentCacheService.refreshAfterCommit(saved, departmentRepository::findAll);
        return saved;
    }

    private static boolean matchesKeyword(Department item, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }

        return StringValues.containsIgnoreCase(item.deptCode(), keyword)
                || StringValues.containsIgnoreCase(item.deptName(), keyword)
                || StringValues.containsIgnoreCase(item.deptDiv(), keyword)
                || StringValues.containsIgnoreCase(item.projDiv(), keyword)
                || StringValues.containsIgnoreCase(item.headquarterCode(), keyword)
                || StringValues.containsIgnoreCase(item.inputDutyId(), keyword)
                || StringValues.containsIgnoreCase(item.chgDutyId(), keyword)
                || StringValues.containsIgnoreCase(item.sortSeq(), keyword)
                || StringValues.containsIgnoreCase(item.costDept(), keyword)
                || StringValues.containsIgnoreCase(item.terminateDate() == null ? "" : item.terminateDate().format(DATE_FORMATTER), keyword)
                || StringValues.containsIgnoreCase(item.inputDate() == null ? "" : item.inputDate().toString(), keyword)
                || StringValues.containsIgnoreCase(item.chgDate() == null ? "" : item.chgDate().toString(), keyword);
    }

}
