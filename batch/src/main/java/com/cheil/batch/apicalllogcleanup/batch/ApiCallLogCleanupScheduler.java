package com.cheil.batch.apicalllogcleanup.batch;

import com.cheil.batch.common.batch.BatchMetrics;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.parameters.JobParametersBuilder;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** API 호출 로그 보관 기간 정리 Job을 정해진 주기로 실행합니다. */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApiCallLogCleanupScheduler {

    private final Job apiCallLogCleanupJob;
    private final JobOperator jobOperator;
    private final BatchMetrics batchMetrics;

    @Value("${batch.cleanup.api-call-logs.enabled:true}")
    private boolean enabled;

    @Scheduled(cron = "${batch.cleanup.api-call-logs.cron}", zone = "${batch.cleanup.api-call-logs.zone:Asia/Seoul}")
    public void run() {
        if (!enabled) {
            log.debug("api_call_logs cleanup is disabled");
            return;
        }

        Timer.Sample timer = batchMetrics.startTimer();
        batchMetrics.recordRun(ApiCallLogCleanupBatchConfig.JOB_NAME);
        try {
            JobExecution execution = jobOperator.start(apiCallLogCleanupJob, new JobParametersBuilder()
                    .addLong("scheduledAt", System.currentTimeMillis())
                    .toJobParameters());
            if (execution.getStatus() != BatchStatus.COMPLETED) {
                log.error("{} failed: executionId={}, status={}", apiCallLogCleanupJob.getName(), execution.getId(), execution.getStatus());
                batchMetrics.recordFailure(ApiCallLogCleanupBatchConfig.JOB_NAME);
            } else {
                batchMetrics.recordSuccess(ApiCallLogCleanupBatchConfig.JOB_NAME);
            }
        } catch (Exception exception) {
            log.error("{} failed", apiCallLogCleanupJob.getName(), exception);
            batchMetrics.recordFailure(ApiCallLogCleanupBatchConfig.JOB_NAME);
        } finally {
            batchMetrics.recordDuration(ApiCallLogCleanupBatchConfig.JOB_NAME, timer);
        }
    }
}
