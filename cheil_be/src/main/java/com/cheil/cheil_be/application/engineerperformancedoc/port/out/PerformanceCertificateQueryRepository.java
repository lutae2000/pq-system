package com.cheil.cheil_be.application.engineerperformancedoc.port.out;

import java.util.List;
import java.util.Optional;

public interface PerformanceCertificateQueryRepository {

    List<WorkOverlapTarget> findWorkOverlapTargets(Long bidSeq, String workDutyId);

    Optional<String> findProjectName(Long bidSeq);

    record WorkOverlapTarget(
            String engineerId,
            String contractNo,
            String engineerName
    ) {
    }
}
