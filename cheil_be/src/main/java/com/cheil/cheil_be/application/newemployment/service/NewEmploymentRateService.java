package com.cheil.cheil_be.application.newemployment.service;

import static com.cheil.cheil_be.application.common.validation.InputValues.basicDate;
import static com.cheil.cheil_be.application.common.validation.InputValues.nonNegative;
import static com.cheil.cheil_be.application.common.validation.InputValues.optionalText;
import static com.cheil.cheil_be.application.common.validation.InputValues.requiredPositive;
import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;
import static com.cheil.cheil_be.application.common.validation.InputValues.yearMonth;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployee;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployeeCommand;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployeeSearch;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatus;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatusCommand;
import com.cheil.cheil_be.application.newemployment.port.in.NewEmploymentRateUseCase;
import com.cheil.cheil_be.application.newemployment.port.out.NewEmploymentRateRepository;

@Service
@RequiredArgsConstructor
public class NewEmploymentRateService implements NewEmploymentRateUseCase {

    private static final int EMPLOYEE_NO_MAX_LENGTH = 30;
    private static final int EMPLOYEE_NAME_MAX_LENGTH = 100;
    private static final int DEPARTMENT_CODE_MAX_LENGTH = 30;
    private static final int JOB_CATEGORY_MAX_LENGTH = 100;
    private static final int REMARK_MAX_LENGTH = 1000;

    private final NewEmploymentRateRepository repository;
    private final CurrentActorPort currentActorPort;

    @Override
    @Transactional(readOnly = true)
    public NewEmploymentMonthlyStatus findMonthlyStatusById(Long id) {
        requiredPositive(id, "id");
        return repository.findMonthlyStatusById(id)
                .orElseThrow(() -> ApplicationException.notFound("신규 고용률 정보를 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public NewEmploymentMonthlyStatus createMonthlyStatus(NewEmploymentMonthlyStatusCommand command) {
        NewEmploymentMonthlyStatusCommand normalized = normalize(command);
        Long id = repository.upsertMonthlyStatus(normalized, currentActorPort.currentActor());
        return findMonthlyStatusById(id);
    }

    @Override
    @Transactional
    public NewEmploymentMonthlyStatus updateMonthlyStatus(Long id, NewEmploymentMonthlyStatusCommand command) {
        requiredPositive(id, "id");
        NewEmploymentMonthlyStatusCommand normalized = normalize(command);
        if (repository.updateMonthlyStatus(id, normalized, currentActorPort.currentActor()) != 1) {
            throw ApplicationException.notFound("신규 고용률 정보를 찾을 수 없습니다.");
        }
        return findMonthlyStatusById(id);
    }

    @Override
    @Transactional
    public void deleteMonthlyStatus(Long id) {
        requiredPositive(id, "id");
        if (repository.deleteMonthlyStatus(id) != 1) {
            throw ApplicationException.notFound("신규 고용률 정보를 찾을 수 없습니다.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NewEmploymentEmployee> findEmployees(
            NewEmploymentEmployeeSearch search, Pageable pageable) {
        if (search == null || pageable == null) {
            throw ApplicationException.badRequest("조회 조건과 페이지 정보는 필수입니다.");
        }
        String departmentCode = trimToNull(search.departmentCode());
        if ("All".equalsIgnoreCase(departmentCode)) {
            departmentCode = null;
        }
        return repository.findEmployees(new NewEmploymentEmployeeSearch(
                yearMonth(search.selectedYearMonth(), "selectedYearMonth", false),
                departmentCode,
                trimToNull(search.employeeName())
        ), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public NewEmploymentEmployee findEmployeeById(Long id) {
        requiredPositive(id, "id");
        return repository.findEmployeeById(id)
                .orElseThrow(() -> ApplicationException.notFound("신규 고용자 정보를 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public NewEmploymentEmployee createEmployee(NewEmploymentEmployeeCommand command) {
        NewEmploymentEmployeeCommand normalized = normalize(command);
        ensureDepartmentExists(normalized.departmentCode());
        Long id = repository.createEmployee(normalized, currentActorPort.currentActor());
        return findEmployeeById(id);
    }

    @Override
    @Transactional
    public NewEmploymentEmployee updateEmployee(Long id, NewEmploymentEmployeeCommand command) {
        requiredPositive(id, "id");
        NewEmploymentEmployeeCommand normalized = normalize(command);
        ensureDepartmentExists(normalized.departmentCode());
        if (repository.updateEmployee(id, normalized, currentActorPort.currentActor()) != 1) {
            throw ApplicationException.notFound("신규 고용자 정보를 찾을 수 없습니다.");
        }
        return findEmployeeById(id);
    }

    @Override
    @Transactional
    public void deleteEmployee(Long id) {
        requiredPositive(id, "id");
        if (repository.deleteEmployee(id) != 1) {
            throw ApplicationException.notFound("신규 고용자 정보를 찾을 수 없습니다.");
        }
    }

    private NewEmploymentMonthlyStatusCommand normalize(NewEmploymentMonthlyStatusCommand command) {
        if (command == null) {
            throw ApplicationException.badRequest("요청 본문은 필수입니다.");
        }
        return new NewEmploymentMonthlyStatusCommand(
                storageMonth(command.baseYearMonth()),
                defaultCount(command.employeeCount(), "employeeCount"),
                defaultCount(command.newHireCount(), "newHireCount")
        );
    }

    private NewEmploymentEmployeeCommand normalize(NewEmploymentEmployeeCommand command) {
        if (command == null) {
            throw ApplicationException.badRequest("요청 본문은 필수입니다.");
        }
        return new NewEmploymentEmployeeCommand(
                storageMonth(command.baseYearMonth()),
                optionalText(command.employeeNo(), EMPLOYEE_NO_MAX_LENGTH, "employeeNo"),
                requiredText(command.employeeName(), EMPLOYEE_NAME_MAX_LENGTH, "employeeName"),
                basicDate(command.birthDate(), "birthDate", false),
                basicDate(command.hireDate(), "hireDate", true),
                requiredText(command.departmentCode(), DEPARTMENT_CODE_MAX_LENGTH, "departmentCode"),
                optionalText(command.jobCategory(), JOB_CATEGORY_MAX_LENGTH, "jobCategory"),
                optionalText(command.remark(), REMARK_MAX_LENGTH, "remark")
        );
    }

    private String storageMonth(String value) {
        String compact = yearMonth(value, "baseYearMonth", true);
        return compact.substring(0, 4) + "-" + compact.substring(4, 6);
    }

    private int defaultCount(Integer value, String fieldName) {
        Integer normalized = nonNegative(value, fieldName);
        return normalized == null ? 0 : normalized;
    }

    private void ensureDepartmentExists(String departmentCode) {
        if (!repository.departmentExists(departmentCode)) {
            throw ApplicationException.badRequest("존재하지 않는 부서 코드입니다.");
        }
    }
}
