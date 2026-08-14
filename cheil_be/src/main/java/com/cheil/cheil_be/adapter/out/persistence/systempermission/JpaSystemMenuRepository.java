package com.cheil.cheil_be.adapter.out.persistence.systempermission;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface JpaSystemMenuRepository extends JpaRepository<SystemMenuEntity, String> {

    List<SystemMenuEntity> findAllByOrderBySortSeqAscMenuCodeAsc();
}
