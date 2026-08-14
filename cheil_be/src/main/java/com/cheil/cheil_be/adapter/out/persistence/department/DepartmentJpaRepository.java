package com.cheil.cheil_be.adapter.out.persistence.department;

import java.util.List;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.commondepartment.port.out.CommonDepartmentRepository;
import com.cheil.cheil_be.domain.commondepartment.Department;

@Repository
@RequiredArgsConstructor
public class DepartmentJpaRepository implements CommonDepartmentRepository {

    private final JpaDepartmentRepository jpaDepartmentRepository;

    @Override
    public List<Department> findAll() {
        return jpaDepartmentRepository.findAll().stream()
                .map(DepartmentEntity::toDomain)
                .toList();
    }

    @Override
    public Optional<Department> findByDeptCode(String deptCode) {
        return jpaDepartmentRepository.findById(deptCode).map(DepartmentEntity::toDomain);
    }

    @Override
    public boolean existsByDeptCode(String deptCode) {
        return jpaDepartmentRepository.existsById(deptCode);
    }

    @Override
    @Transactional
    public Department save(Department department) {
        return jpaDepartmentRepository.findById(department.deptCode())
                .map(existing -> {
                    existing.updateFrom(department);
                    return existing.toDomain();
                })
                .orElseGet(() -> jpaDepartmentRepository.save(DepartmentEntity.from(department)).toDomain());
    }
}
