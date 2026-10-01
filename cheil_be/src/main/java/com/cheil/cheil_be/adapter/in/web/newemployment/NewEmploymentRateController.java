package com.cheil.cheil_be.adapter.in.web.newemployment;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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

import com.cheil.cheil_be.application.newemployment.service.NewEmploymentRateService;
import com.cheil.cheil_be.application.newemployment.port.in.NewEmploymentMonthlyStatus;
import com.cheil.cheil_be.application.newemployment.port.in.NewEmploymentMonthlyStatusPivot;
import com.cheil.cheil_be.application.newemployment.port.in.NewEmploymentMonthlyStatusUseCase;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;

@RestController
@RequestMapping("/pq/new-employment-rates")
@RequiredArgsConstructor
public class NewEmploymentRateController {

    private final NewEmploymentRateService newEmploymentRateService;
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
        return ResponseEntity.ok(newEmploymentRateService.findMonthlyStatusById(id));
    }

    @PostMapping("/monthly-statuses")
    public ResponseEntity<NewEmploymentMonthlyStatusResponse> createMonthlyStatus(@RequestBody NewEmploymentMonthlyStatusRequest request) {
        return ResponseEntity.ok(newEmploymentRateService.createMonthlyStatus(request));
    }

    @PutMapping("/monthly-statuses/{id}")
    public ResponseEntity<NewEmploymentMonthlyStatusResponse> updateMonthlyStatus(
            @PathVariable Long id,
            @RequestBody NewEmploymentMonthlyStatusRequest request
    ) {
        return ResponseEntity.ok(newEmploymentRateService.updateMonthlyStatus(id, request));
    }

    @DeleteMapping("/monthly-statuses/{id}")
    public ResponseEntity<Void> deleteMonthlyStatus(@PathVariable Long id) {
        newEmploymentRateService.deleteMonthlyStatus(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/employees")
    public ResponseEntity<PageResponse<NewEmploymentEmployeeResponse>> employees(
            @RequestParam(required = false) String selectedYearMonth,
            @RequestParam(required = false) String departmentCode,
            @RequestParam(required = false) String employeeName,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Page<NewEmploymentEmployeeResponse> result = newEmploymentRateService.findEmployees(
                selectedYearMonth,
                departmentCode,
                employeeName,
                PageRequests.of(page, size)
        );
        return ResponseEntity.ok(PageResponse.from(result));
    }

    @GetMapping("/employees/{id}")
    public ResponseEntity<NewEmploymentEmployeeResponse> employee(@PathVariable Long id) {
        return ResponseEntity.ok(newEmploymentRateService.findEmployeeById(id));
    }

    @PostMapping("/employees")
    public ResponseEntity<NewEmploymentEmployeeResponse> createEmployee(@RequestBody NewEmploymentEmployeeRequest request) {
        return ResponseEntity.ok(newEmploymentRateService.createEmployee(request));
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<NewEmploymentEmployeeResponse> updateEmployee(
            @PathVariable Long id,
            @RequestBody NewEmploymentEmployeeRequest request
    ) {
        return ResponseEntity.ok(newEmploymentRateService.updateEmployee(id, request));
    }

    @DeleteMapping("/employees/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        newEmploymentRateService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    private NewEmploymentMonthlyStatusResponse toResponse(NewEmploymentMonthlyStatus status) {
        return new NewEmploymentMonthlyStatusResponse(
                status.id(), status.baseYearMonth(), status.employeeCount(), status.newHireCount(),
                status.createdAt(), status.createdId(), status.lastChangedAt(), status.lastChangedId()
        );
    }

    private NewEmploymentMonthlyStatusPivotResponse toPivotResponse(NewEmploymentMonthlyStatusPivot pivot) {
        return new NewEmploymentMonthlyStatusPivotResponse(pivot.yearMonth(), pivot.employeeCount(), pivot.newHireCount());
    }
}
