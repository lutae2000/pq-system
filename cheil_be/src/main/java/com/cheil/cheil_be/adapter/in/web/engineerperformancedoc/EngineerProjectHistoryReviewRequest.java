package com.cheil.cheil_be.adapter.in.web.engineerperformancedoc;

import java.util.Map;

public record EngineerProjectHistoryReviewRequest(
        Long bidSeq,
        String engineerId,
        Integer sourceSeq,
        Map<String, Object> sourceRow
) {
}
