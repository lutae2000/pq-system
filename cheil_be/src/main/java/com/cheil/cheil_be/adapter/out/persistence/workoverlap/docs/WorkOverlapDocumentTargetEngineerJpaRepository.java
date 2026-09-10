package com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkOverlapDocumentTargetEngineerJpaRepository extends JpaRepository<WorkOverlapDocumentTargetEngineerEntity, Long> {
    List<WorkOverlapDocumentTargetEngineerEntity> findByWorkDutyIdAndBidSeqOrderByDisplayOrderAscTargetIdAsc(String workDutyId, Long bidSeq);
    WorkOverlapDocumentTargetEngineerEntity findByWorkDutyIdAndBidSeqAndEngrId(String workDutyId, Long bidSeq, String engrId);
    long deleteByWorkDutyIdAndBidSeqAndEngrId(String workDutyId, Long bidSeq, String engrId);
}
