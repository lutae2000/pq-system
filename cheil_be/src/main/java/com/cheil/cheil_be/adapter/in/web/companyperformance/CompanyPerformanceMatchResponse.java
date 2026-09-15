package com.cheil.cheil_be.adapter.in.web.companyperformance;

import java.util.List;

public record CompanyPerformanceMatchResponse(
        String sourceJobName,
        List<Candidate> candidates
) {
    public record Candidate(
            Long seq,
            String jobName,
            boolean jobOwnYn,
            double similarity,
            String summary,
            String orderClient,
            String jobType,
            Long contractAmt,
            String remark
    ) {
    }
}
