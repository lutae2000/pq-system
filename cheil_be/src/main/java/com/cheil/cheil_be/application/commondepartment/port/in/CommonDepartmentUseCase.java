package com.cheil.cheil_be.application.commondepartment.port.in;

import java.util.List;

import com.cheil.cheil_be.domain.commondepartment.Department;

public interface CommonDepartmentUseCase {

    List<Department> findAll(CommonDepartmentSearchCondition condition);

    Department findByDeptCode(String deptCode);

    Department create(CommonDepartmentUpsertCommand command);

    Department update(String deptCode, CommonDepartmentUpsertCommand command);
}
