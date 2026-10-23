package com.cheil.cheil_be.adapter.in.web.department;

import java.util.List;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.department.port.in.DepartmentSearchCondition;
import com.cheil.cheil_be.application.department.port.in.DepartmentUseCase;

/**
 * 부서 코드 조회 및 관리 API.
 */
@RestController
@RequestMapping("/code/department")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentUseCase departmentUseCase;

    /**
     * 부서 코드 목록을 조회한다.
     */
    @GetMapping
    public ResponseEntity<List<DepartmentResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean useYn
    ) {
        return ResponseEntity.ok(departmentUseCase.findAll(new DepartmentSearchCondition(
                keyword,
                useYn
        )).stream().map(DepartmentResponse::from).toList());
    }

    /**
     * 부서 코드 단건을 조회한다.
     */
    @GetMapping("/{deptCode}")
    public ResponseEntity<DepartmentResponse> get(@PathVariable String deptCode) {
        return ResponseEntity.ok(DepartmentResponse.from(departmentUseCase.findByDeptCode(deptCode)));
    }

    /**
     * 부서 코드를 신규 등록한다.
     */
    @PostMapping
    public ResponseEntity<DepartmentResponse> create(@Valid @RequestBody DepartmentUpsertRequest request) {
        return ResponseEntity.ok(DepartmentResponse.from(departmentUseCase.create(request.toCommand())));
    }

    /**
     * 기존 부서 코드를 수정한다.
     */
    @PutMapping("/{deptCode}")
    public ResponseEntity<DepartmentResponse> update(
            @PathVariable String deptCode,
            @Valid @RequestBody DepartmentUpsertRequest request
    ) {
        return ResponseEntity.ok(DepartmentResponse.from(departmentUseCase.update(deptCode, request.toCommand())));
    }
}
