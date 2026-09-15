package com.cheil.cheil_be.adapter.in.web.companyperformance;

import java.util.List;

public record CompanyPerformanceMatchRequest(
        List<String> jobNames,
        Double threshold
) {
}
