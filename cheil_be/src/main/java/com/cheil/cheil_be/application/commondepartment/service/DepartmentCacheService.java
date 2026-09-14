package com.cheil.cheil_be.application.commondepartment.service;

import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.cheil.cheil_be.domain.commondepartment.Department;

@Service
@RequiredArgsConstructor
public class DepartmentCacheService {

    @Cacheable(
            cacheNames = "departments",
            key = "T(com.cheil.cheil_be.common.cache.DepartmentCacheKeys).departments()"
    )
    public List<Department> getOrLoadAll(Supplier<List<Department>> dbLoader) {
        return dbLoader.get();
    }

    @Cacheable(cacheNames = "departmentByCode", key = "#deptCode")
    public Optional<Department> getOrLoadByDeptCode(
            String deptCode,
            Supplier<Optional<Department>> dbLoader
    ) {
        return dbLoader.get();
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = "departmentByCode", key = "#department.deptCode()", condition = "#department != null"),
            @CacheEvict(
                    cacheNames = "departments",
                    key = "T(com.cheil.cheil_be.common.cache.DepartmentCacheKeys).departments()"
            )
    })
    public void refreshAfterCommit(Department department, Supplier<List<Department>> dbLoader) {
        // A write invalidates both views. The next read repopulates them from the database.
    }
}
