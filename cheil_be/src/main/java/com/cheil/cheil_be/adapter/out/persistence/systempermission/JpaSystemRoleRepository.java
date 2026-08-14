package com.cheil.cheil_be.adapter.out.persistence.systempermission;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface JpaSystemRoleRepository extends JpaRepository<SystemRoleEntity, String> {

    List<SystemRoleEntity> findAllByOrderBySortSeqAscRoleCodeAsc();

    List<SystemRoleEntity> findAllByUseYnOrderBySortSeqAscRoleCodeAsc(boolean useYn);
}
