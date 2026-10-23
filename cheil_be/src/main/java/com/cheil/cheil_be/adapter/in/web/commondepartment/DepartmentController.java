package com.cheil.cheil_be.adapter.in.web.commondepartment;

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

import com.cheil.cheil_be.application.commondepartment.port.in.CommonDepartmentSearchCondition;
import com.cheil.cheil_be.application.commondepartment.port.in.CommonDepartmentUseCase;

/**
 * 부서 코드 조회 및 관리 API.
 */
@RestController
@RequestMapping("/code/department")
@RequiredArgsConstructor
public class DepartmentController {

    private final CommonDepartmentUseCase departmentUseCase;

    /**
     * 부서 코드 목록을 조회한다.
     */
    @GetMapping
    public ResponseEntity<List<CommonDepartmentResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean useYn
    ) {
        return ResponseEntity.ok(departmentUseCase.findAll(new CommonDepartmentSearchCondition(
                keyword,
                useYn
        )).stream().map(CommonDepartmentResponse::from).toList());
    }

    /**
     * 부서 코드 단건을 조회한다.
     */
    @GetMapping("/{deptCode}")
    public ResponseEntity<CommonDepartmentResponse> get(@PathVariable String deptCode) {
        return ResponseEntity.ok(CommonDepartmentResponse.from(departmentUseCase.findByDeptCode(deptCode)));
    }

    /**
     * 부서 코드를 신규 등록한다.
     */
    @PostMapping
    public ResponseEntity<CommonDepartmentResponse> create(@Valid @RequestBody CommonDepartmentUpsertRequest request) {
        return ResponseEntity.ok(CommonDepartmentResponse.from(departmentUseCase.create(request.toCommand())));
    }

    /**
     * 기존 부서 코드를 수정한다.
     */
    @PutMapping("/{deptCode}")
    public ResponseEntity<CommonDepartmentResponse> update(
            @PathVariable String deptCode,
            @Valid @RequestBody CommonDepartmentUpsertRequest request
    ) {
        return ResponseEntity.ok(CommonDepartmentResponse.from(departmentUseCase.update(deptCode, request.toCommand())));
    }
}
