package com.cheil.batch.apicalllogcleanup.application.port.in;

public interface CleanupApiCallLogsUseCase {
    int cleanup(int retentionMonths);
}
