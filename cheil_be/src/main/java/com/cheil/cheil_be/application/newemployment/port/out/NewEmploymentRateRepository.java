package com.cheil.cheil_be.application.newemployment.port.out;

import java.util.Optional;

import com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployee;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployeeCommand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployeeSearch;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatus;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatusCommand;

public interface NewEmploymentRateRepository {

    Optional<NewEmploymentMonthlyStatus> findMonthlyStatusById(Long id);

    Long upsertMonthlyStatus(NewEmploymentMonthlyStatusCommand command, String actor);

    int updateMonthlyStatus(Long id, NewEmploymentMonthlyStatusCommand command, String actor);

    int deleteMonthlyStatus(Long id);

    Page<NewEmploymentEmployee> findEmployees(NewEmploymentEmployeeSearch search, Pageable pageable);

    Optional<NewEmploymentEmployee> findEmployeeById(Long id);

    Long createEmployee(NewEmploymentEmployeeCommand command, String actor);

    int updateEmployee(Long id, NewEmploymentEmployeeCommand command, String actor);

    int deleteEmployee(Long id);

    boolean departmentExists(String departmentCode);
}
