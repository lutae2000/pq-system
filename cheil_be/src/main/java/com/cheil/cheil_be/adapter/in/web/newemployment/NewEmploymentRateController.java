package com.cheil.cheil_be.adapter.in.web.newemployment;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployeeSearch;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatus;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatusPivot;
import com.cheil.cheil_be.application.newemployment.port.in.NewEmploymentMonthlyStatusUseCase;
import com.cheil.cheil_be.application.newemployment.port.in.NewEmploymentRateUseCase;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;

/** 신규 고용률의 월별 현황과 대상 직원을 관리하는 API다. */
@RestController
@RequestMapping("/pq/new-employment-rates")
@RequiredArgsConstructor
public class NewEmploymentRateController {

    private final NewEmploymentRateUseCase newEmploymentRateUseCase;
    private final NewEmploymentMonthlyStatusUseCase monthlyStatusUseCase;

    @GetMapping("/monthly-statuses")
    public ResponseEntity<List<NewEmploymentMonthlyStatusResponse>> monthlyStatuses(
            @RequestParam(required = false) String baseYearMonth,
            @RequestParam(required = false) String departmentCode,
            @RequestParam(required = false) String employeeName
    ) {
        // 웹 응답 DTO 변환은 inbound adapter에서 수행하고, application 계층에는 웹 타입을 전달하지 않습니다.
        return ResponseEntity.ok(monthlyStatusUseCase.monthlyStatuses(baseYearMonth).stream().map(this::toResponse).toList());
    }

    @GetMapping("/monthly-statuses/pivot")
    public ResponseEntity<List<NewEmploymentMonthlyStatusPivotResponse>> monthlyStatusPivot(
            @RequestParam(required = false) String baseYearMonth
    ) {
        return ResponseEntity.ok(monthlyStatusUseCase.monthlyStatusPivot(baseYearMonth).stream().map(this::toPivotResponse).toList());
    }

    @GetMapping("/monthly-statuses/pivot/previous-year-same-period")
    public ResponseEntity<List<NewEmploymentMonthlyStatusPivotResponse>> previousYearSamePeriodMonthlyStatusPivot(
            @RequestParam(required = false) String baseYearMonth
    ) {
        return ResponseEntity.ok(monthlyStatusUseCase.previousYearSamePeriodMonthlyStatusPivot(baseYearMonth).stream().map(this::toPivotResponse).toList());
    }

    @GetMapping("/monthly-statuses/{id}")
    public ResponseEntity<NewEmploymentMonthlyStatusResponse> monthlyStatus(@PathVariable Long id) {
        return ResponseEntity.ok(NewEmploymentMonthlyStatusResponse.from(newEmploymentRateUseCase.findMonthlyStatusById(id)));
    }

    @PostMapping("/monthly-statuses")
    public ResponseEntity<NewEmploymentMonthlyStatusResponse> createMonthlyStatus(@RequestBody NewEmploymentMonthlyStatusRequest request) {
        return ResponseEntity.ok(NewEmploymentMonthlyStatusResponse.from(
                newEmploymentRateUseCase.createMonthlyStatus(request.toCommand())
        ));
    }

    @PutMapping("/monthly-statuses/{id}")
    public ResponseEntity<NewEmploymentMonthlyStatusResponse> updateMonthlyStatus(
            @PathVariable Long id,
            @RequestBody NewEmploymentMonthlyStatusRequest request
    ) {
        return ResponseEntity.ok(NewEmploymentMonthlyStatusResponse.from(
                newEmploymentRateUseCase.updateMonthlyStatus(id, request.toCommand())
        ));
    }

    @DeleteMapping("/monthly-statuses/{id}")
    public ResponseEntity<Void> deleteMonthlyStatus(@PathVariable Long id) {
        newEmploymentRateUseCase.deleteMonthlyStatus(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/employees")
    public ResponseEntity<PageResponse<NewEmploymentEmployeeResponse>> employees(
            @RequestParam(required = false) String selectedYearMonth,
            @RequestParam(required = false) String departmentCode,
            @RequestParam(required = false) String employeeName,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        var safePageable = PageRequests.of(pageable);
        var result = newEmploymentRateUseCase.findEmployees(new NewEmploymentEmployeeSearch(
                selectedYearMonth,
                departmentCode,
                employeeName
        ), safePageable);
        return ResponseEntity.ok(PageResponse.from(result, NewEmploymentEmployeeResponse::from));
    }

    @GetMapping("/employees/{id}")
    public ResponseEntity<NewEmploymentEmployeeResponse> employee(@PathVariable Long id) {
        return ResponseEntity.ok(NewEmploymentEmployeeResponse.from(newEmploymentRateUseCase.findEmployeeById(id)));
    }

    @PostMapping("/employees")
    public ResponseEntity<NewEmploymentEmployeeResponse> createEmployee(@RequestBody NewEmploymentEmployeeRequest request) {
        return ResponseEntity.ok(NewEmploymentEmployeeResponse.from(
                newEmploymentRateUseCase.createEmployee(request.toCommand())
        ));
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<NewEmploymentEmployeeResponse> updateEmployee(
            @PathVariable Long id,
            @RequestBody NewEmploymentEmployeeRequest request
    ) {
        return ResponseEntity.ok(NewEmploymentEmployeeResponse.from(
                newEmploymentRateUseCase.updateEmployee(id, request.toCommand())
        ));
    }

    @DeleteMapping("/employees/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        newEmploymentRateUseCase.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    private NewEmploymentMonthlyStatusResponse toResponse(NewEmploymentMonthlyStatus status) {
        return NewEmploymentMonthlyStatusResponse.from(status);
    }

    private NewEmploymentMonthlyStatusPivotResponse toPivotResponse(NewEmploymentMonthlyStatusPivot pivot) {
        return new NewEmploymentMonthlyStatusPivotResponse(pivot.yearMonth(), pivot.employeeCount(), pivot.newHireCount());
    }
}
