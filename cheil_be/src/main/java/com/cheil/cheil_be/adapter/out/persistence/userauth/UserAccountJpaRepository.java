package com.cheil.cheil_be.adapter.out.persistence.userauth;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

interface UserAccountJpaRepository extends JpaRepository<UserAccountEntity, String> {

    Optional<UserAccountEntity> findByEmployeeNo(String employeeNo);

    Optional<UserAccountEntity> findByLoginId(String loginId);

    boolean existsByEmployeeNo(String employeeNo);

    boolean existsByLoginId(String loginId);
}
