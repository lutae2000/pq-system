package com.cheil.cheil_be.application.companyperformance.port.out;

import java.util.List;
import java.util.Map;

public interface CompanyPerformanceHwpxDataRepository {
    Map<Long, String> findContractPeriods(List<Long> performanceSeqs);

    Map<Long, String> findJobRatios(List<Long> performanceSeqs);

    Map<String, String> findJobTypeNames(List<String> jobTypeCodes);
}
