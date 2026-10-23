package com.cheil.cheil_be.application.department.port.out;

import java.util.List;
import java.util.Optional;

import com.cheil.cheil_be.domain.department.Department;

public interface DepartmentRepository {

    List<Department> findAll();

    Optional<Department> findByDeptCode(String deptCode);

    boolean existsByDeptCode(String deptCode);

    Department save(Department department);
}
