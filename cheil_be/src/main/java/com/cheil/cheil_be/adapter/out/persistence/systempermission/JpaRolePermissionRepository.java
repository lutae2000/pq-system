package com.cheil.cheil_be.adapter.out.persistence.systempermission;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface JpaRolePermissionRepository
        extends JpaRepository<RolePermissionEntity, RolePermissionId> {

    List<RolePermissionEntity> findAllByIdRoleCodeOrderByIdMenuCodeAsc(String roleCode);

    void deleteByIdRoleCode(String roleCode);
}
