package com.cheil.cheil_be.application.workoverlap.docs.port.out;

import java.util.List;
import com.cheil.cheil_be.application.workoverlap.docs.model.WorkOverlapDocumentTarget;

public interface WorkOverlapDocumentTargetRepository {
    List<WorkOverlapDocumentTarget> find(String workDutyId, Long bidSeq, String engineerId);
    List<WorkOverlapDocumentTarget> replace(String workDutyId, Long bidSeq, String engineerId, List<WorkOverlapDocumentTarget> targets);
    void delete(String workDutyId, Long bidSeq, String engineerId, String contractNo);
}
