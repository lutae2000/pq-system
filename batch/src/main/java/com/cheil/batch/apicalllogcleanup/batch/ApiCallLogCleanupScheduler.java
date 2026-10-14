package com.cheil.batch.apicalllogcleanup.batch;

import com.cheil.batch.common.batch.BatchJobRunner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.job.Job;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApiCallLogCleanupScheduler {

    private final Job apiCallLogCleanupJob;
    private final BatchJobRunner batchJobRunner;

    @Value("${batch.cleanup.api-call-logs.enabled:true}")
    private boolean enabled;

    @Scheduled(cron = "${batch.cleanup.api-call-logs.cron}", zone = "${batch.cleanup.api-call-logs.zone:Asia/Seoul}")
    public void run() {
        if (!enabled) {
            log.debug("api_call_logs cleanup is disabled");
            return;
        }
        batchJobRunner.run(apiCallLogCleanupJob, "apiCallLogCleanupJob");
    }
}
