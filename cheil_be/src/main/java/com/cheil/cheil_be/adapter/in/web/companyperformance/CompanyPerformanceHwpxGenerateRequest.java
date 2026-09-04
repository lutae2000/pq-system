package com.cheil.cheil_be.adapter.in.web.companyperformance;

import java.util.List;
import java.util.Map;

public record CompanyPerformanceHwpxGenerateRequest(
        Long bidSeq,
        List<Long> companyPerformanceSeqs,
        Map<String, String> mappings
) {
}
