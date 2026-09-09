package com.cheil.cheil_be.adapter.out.persistence.workoverlap.contract;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface WorkOverlapContractJpaRepository extends JpaRepository<WorkOverlapContractEntity, String>, JpaSpecificationExecutor<WorkOverlapContractEntity> {

    @Query(value = "SELECT nextval('work_overlap_contracts_contract_no_seq')", nativeQuery = true)
    long nextContractNoSequenceValue();
}
