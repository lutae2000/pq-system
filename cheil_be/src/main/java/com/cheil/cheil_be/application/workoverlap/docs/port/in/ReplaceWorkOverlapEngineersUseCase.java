package com.cheil.cheil_be.application.workoverlap.docs.port.in;

import com.cheil.cheil_be.application.workoverlap.docs.WorkOverlapDocumentTargetEngineerData;
import com.cheil.cheil_be.application.workoverlap.docs.model.WorkOverlapEngineerSelection;
import java.util.List;

public interface ReplaceWorkOverlapEngineersUseCase {
    List<WorkOverlapDocumentTargetEngineerData> replace(Long bidSeq, String workDutyId, List<WorkOverlapEngineerSelection> engineers);
}
