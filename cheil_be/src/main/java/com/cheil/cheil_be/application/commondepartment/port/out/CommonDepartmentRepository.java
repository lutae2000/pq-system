package com.cheil.cheil_be.application.commondepartment.port.out;

import java.util.List;
import java.util.Optional;

import com.cheil.cheil_be.domain.commondepartment.Department;

public interface CommonDepartmentRepository {

    List<Department> findAll();

    Optional<Department> findByDeptCode(String deptCode);

    boolean existsByDeptCode(String deptCode);

    Department save(Department department);
}
