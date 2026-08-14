package com.cheil.cheil_be.adapter.out.persistence.systempolicy;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface JpaSystemPolicyRepository extends JpaRepository<SystemPolicyEntity, String> {

    List<SystemPolicyEntity> findAllByOrderBySortSeqAscPolicyKeyAsc();
}
