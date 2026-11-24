package com.cheil.cheil_be.application.companyperformance.port.out;

import com.cheil.cheil_be.domain.companyperformance.ParticipationContractPeriod;
import java.util.List;
import java.util.Map;

public interface ParticipationContractPeriodRepository {
    Map<Long, ParticipationContractPeriod> findByProjectHistoryIds(List<Long> historyIds);
}
