package com.cheil.batch.apicalllogcleanup.application.port.out;

public interface DeleteExpiredApiCallLogsPort {
    int deleteExpired(int retentionMonths);
}
