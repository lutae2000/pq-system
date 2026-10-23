package com.cheil.cheil_be.application.commondepartment.service;

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
import com.cheil.cheil_be.application.commondepartment.port.in.CommonDepartmentSearchCondition;
import com.cheil.cheil_be.application.commondepartment.port.in.CommonDepartmentUpsertCommand;
import com.cheil.cheil_be.application.commondepartment.port.in.CommonDepartmentUseCase;
import com.cheil.cheil_be.application.commondepartment.port.out.CommonDepartmentRepository;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.commondepartment.Department;

@Service
@RequiredArgsConstructor
public class DepartmentAdminService implements CommonDepartmentUseCase {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private final CommonDepartmentRepository commonDepartmentRepository;
    private final DepartmentCacheService departmentCacheService;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<Department> findAll(CommonDepartmentSearchCondition condition) {
        String keyword = condition == null ? "" : StringValues.normalize(condition.keyword()).toLowerCase(Locale.ROOT);
        Boolean useYn = condition == null ? null : condition.useYn();

        return departmentCacheService.getOrLoadAll(commonDepartmentRepository::findAll).stream()
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
                        () -> commonDepartmentRepository.findByDeptCode(normalizedDeptCode))
                .orElseThrow(() -> ApplicationException.notFound("부서를 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public Department create(CommonDepartmentUpsertCommand command) {
        InputValues.requireNonNull(command, "요청 본문은 필수입니다.");
        String deptCode = command.deptCode();
        if (commonDepartmentRepository.existsByDeptCode(deptCode)) {
            throw ApplicationException.conflict("이미 존재하는 부서 코드입니다.");
        }
        Department saved = commonDepartmentRepository.save(command.toDomain(null, Instant.now(clock)));
        departmentCacheService.refreshAfterCommit(saved, commonDepartmentRepository::findAll);
        return saved;
    }

    @Override
    @Transactional
    public Department update(String deptCode, CommonDepartmentUpsertCommand command) {
        InputValues.requireNonNull(command, "요청 본문은 필수입니다.");
        String normalizedDeptCode = InputValues.requiredText(deptCode, "deptCode");
        Department existing = commonDepartmentRepository.findByDeptCode(normalizedDeptCode)
                .orElseThrow(() -> ApplicationException.notFound("부서를 찾을 수 없습니다."));

        String requestedDeptCode = StringValues.normalize(command.deptCode());
        if (!requestedDeptCode.isBlank() && !normalizedDeptCode.equals(requestedDeptCode)) {
            throw ApplicationException.badRequest("path deptCode와 body deptCode가 일치해야 합니다.");
        }
        Department saved = commonDepartmentRepository.save(command.toDomain(existing, Instant.now(clock)));
        departmentCacheService.refreshAfterCommit(saved, commonDepartmentRepository::findAll);
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
