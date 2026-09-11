package com.cheil.cheil_be.adapter.in.web.workoverlap.docs;

import java.util.List;
import java.util.Map;

public record WorkOverlapHwpxGenerateRequest(
        Long bidSeq,
        String workDutyId,
        Boolean includeParticipantList,
        Map<String, String> mappings,
        List<Map<String, String>> rows,
        List<String> engineerIds,
        String referenceDate
) {
}
