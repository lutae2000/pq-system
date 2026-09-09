package com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkOverlapDocumentTargetJpaRepository extends JpaRepository<WorkOverlapDocumentTargetEntity, Long> {
    List<WorkOverlapDocumentTargetEntity> findByWorkDutyIdAndBidSeqAndEngineerIdOrderByDisplayOrderAscTargetIdAsc(String workDutyId, Long bidSeq, String engineerId);

    long deleteByWorkDutyIdAndBidSeqAndEngineerIdAndContractNo(String workDutyId, Long bidSeq, String engineerId, String contractNo);
}
