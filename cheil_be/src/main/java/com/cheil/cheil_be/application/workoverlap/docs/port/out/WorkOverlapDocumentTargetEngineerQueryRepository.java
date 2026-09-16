package com.cheil.cheil_be.application.workoverlap.docs.port.out;

import com.cheil.cheil_be.application.workoverlap.docs.WorkOverlapDocumentTargetEngineerData;

import java.util.List;

public interface WorkOverlapDocumentTargetEngineerQueryRepository {

    List<WorkOverlapDocumentTargetEngineerData> find(
            Long bidSeq,
            String workDutyId,
            String keyword
    );
}
