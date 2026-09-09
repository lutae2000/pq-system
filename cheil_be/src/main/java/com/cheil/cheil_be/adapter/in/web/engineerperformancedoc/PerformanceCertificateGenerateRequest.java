package com.cheil.cheil_be.adapter.in.web.engineerperformancedoc;

import java.util.List;
import java.util.Map;

public record PerformanceCertificateGenerateRequest(
        Long bidSeq,
        List<String> engineerIds,
        Map<String, String> engineerNames,
        List<Long> companyPerformanceSeqs,
        String relatedProjectHistoryConditions,
        Boolean includeParticipantList
) {
}
