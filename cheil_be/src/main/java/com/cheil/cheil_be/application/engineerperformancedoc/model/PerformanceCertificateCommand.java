package com.cheil.cheil_be.application.engineerperformancedoc.model;

import java.util.List;
import java.util.Map;

public record PerformanceCertificateCommand(
        Long bidSeq,
        List<String> engineerIds,
        Map<String, String> engineerNames,
        List<Long> companyPerformanceSeqs,
        boolean includeParticipantList
) {
}
