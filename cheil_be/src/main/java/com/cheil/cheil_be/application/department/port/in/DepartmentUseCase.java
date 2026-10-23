package com.cheil.cheil_be.application.department.port.in;

import java.util.List;

import com.cheil.cheil_be.domain.department.Department;

public interface DepartmentUseCase {

    List<Department> findAll(DepartmentSearchCondition condition);

    Department findByDeptCode(String deptCode);

    Department create(DepartmentUpsertCommand command);

    Department update(String deptCode, DepartmentUpsertCommand command);
}
