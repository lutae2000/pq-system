package com.cheil.batch.apicalllogcleanup.application.service;

import com.cheil.batch.apicalllogcleanup.application.port.in.CleanupApiCallLogsUseCase;
import com.cheil.batch.apicalllogcleanup.application.port.out.DeleteExpiredApiCallLogsPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ApiCallLogCleanupService implements CleanupApiCallLogsUseCase {
    private final DeleteExpiredApiCallLogsPort deleteExpiredApiCallLogsPort;

    @Override
    public int cleanup(int retentionMonths) {
        if (retentionMonths < 1) {
            throw new IllegalArgumentException("retentionMonths must be at least 1");
        }
        return deleteExpiredApiCallLogsPort.deleteExpired(retentionMonths);
    }
}
