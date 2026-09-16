package com.cheil.cheil_be.application.companyperformance.port.out;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceMatchResponse;

import java.util.List;

public interface CompanyPerformanceMatchRepository {
    List<CompanyPerformanceMatchResponse.Candidate> findCandidates();
}
