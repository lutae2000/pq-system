package com.cheil.cheil_be.adapter.in.web.engineerperformancedoc;

import java.util.List;
import java.util.Map;

public record HwpxGenerateRequest(
        Long bidSeq,
        List<String> engineerIds,
        String relatedProjectHistoryConditions,
        Map<String, String> mappings
) {
}
