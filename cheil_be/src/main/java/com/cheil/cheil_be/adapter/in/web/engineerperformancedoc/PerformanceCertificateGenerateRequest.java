package com.cheil.cheil_be.adapter.in.web.engineerperformancedoc;

import java.util.List;
import java.util.Map;

import com.cheil.cheil_be.application.engineerperformancedoc.model.PerformanceCertificateCommand;

public record PerformanceCertificateGenerateRequest(
        Long bidSeq,
        List<String> engineerIds,
        Map<String, String> engineerNames,
        List<Long> companyPerformanceSeqs,
        String relatedProjectHistoryConditions,
        Boolean includeParticipantList
) {
    PerformanceCertificateCommand toCommand() {
        return new PerformanceCertificateCommand(
                bidSeq, engineerIds, engineerNames, companyPerformanceSeqs, Boolean.TRUE.equals(includeParticipantList));
    }
}
