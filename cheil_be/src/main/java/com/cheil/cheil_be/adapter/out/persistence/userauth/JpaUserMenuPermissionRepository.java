package com.cheil.cheil_be.adapter.out.persistence.userauth;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface JpaUserMenuPermissionRepository extends JpaRepository<UserMenuPermissionEntity, UserMenuPermissionId> {

    List<UserMenuPermissionEntity> findAllByIdEmployeeNoOrderByIdMenuCodeAsc(String employeeNo);

    void deleteByIdEmployeeNo(String employeeNo);
}
