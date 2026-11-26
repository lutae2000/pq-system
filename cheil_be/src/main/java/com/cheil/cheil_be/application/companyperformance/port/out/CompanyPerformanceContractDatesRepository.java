package com.cheil.cheil_be.application.companyperformance.port.out;

import com.cheil.cheil_be.domain.companyperformance.ContractPeriodDates;
import java.util.Collection;
import java.util.List;
import java.util.Map;

public interface CompanyPerformanceContractDatesRepository {
    Map<Long, List<ContractPeriodDates>> findContractDatesByPerformanceSeqs(Collection<Long> seqs);
}
