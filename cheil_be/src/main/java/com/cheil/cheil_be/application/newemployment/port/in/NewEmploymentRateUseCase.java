package com.cheil.cheil_be.application.newemployment.port.in;

import com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployee;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployeeCommand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployeeSearch;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatus;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatusCommand;

public interface NewEmploymentRateUseCase {

    NewEmploymentMonthlyStatus findMonthlyStatusById(Long id);

    NewEmploymentMonthlyStatus createMonthlyStatus(NewEmploymentMonthlyStatusCommand command);

    NewEmploymentMonthlyStatus updateMonthlyStatus(Long id, NewEmploymentMonthlyStatusCommand command);

    void deleteMonthlyStatus(Long id);

    Page<NewEmploymentEmployee> findEmployees(NewEmploymentEmployeeSearch search, Pageable pageable);

    NewEmploymentEmployee findEmployeeById(Long id);

    NewEmploymentEmployee createEmployee(NewEmploymentEmployeeCommand command);

    NewEmploymentEmployee updateEmployee(Long id, NewEmploymentEmployeeCommand command);

    void deleteEmployee(Long id);
}
