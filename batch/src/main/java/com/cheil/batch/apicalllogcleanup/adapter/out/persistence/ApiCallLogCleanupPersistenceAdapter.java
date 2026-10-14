package com.cheil.batch.apicalllogcleanup.adapter.out.persistence;

import com.cheil.batch.apicalllogcleanup.application.port.out.DeleteExpiredApiCallLogsPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ApiCallLogCleanupPersistenceAdapter implements DeleteExpiredApiCallLogsPort {

    private final ApiCallLogCleanupMapper mapper;

    @Override
    public int deleteExpired(int retentionMonths) {
        return mapper.deleteExpiredApiCallLogs(retentionMonths);
    }
}
