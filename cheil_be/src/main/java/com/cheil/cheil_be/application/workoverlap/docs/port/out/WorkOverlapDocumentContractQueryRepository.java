package com.cheil.cheil_be.application.workoverlap.docs.port.out;

import com.cheil.cheil_be.application.workoverlap.docs.model.WorkOverlapDocumentContractRow;

import java.util.List;

public interface WorkOverlapDocumentContractQueryRepository {

    List<WorkOverlapDocumentContractRow> findAvailable(
            String engineerId,
            Long bidSeq,
            String workDutyId,
            String referenceDate,
            int remainingDays
    );

    List<WorkOverlapDocumentContractRow> findSaved(
            String engineerId,
            Long bidSeq,
            String workDutyId,
            String referenceDate,
            int remainingDays
    );
}
