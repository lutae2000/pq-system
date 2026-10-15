package com.cheil.batch.common.batch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.parameters.JobParameters;
import org.springframework.batch.core.job.parameters.JobParametersBuilder;
import org.springframework.batch.core.launch.JobOperator;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BatchJobRunner {

    private final JobOperator jobOperator;
    private final BatchMetrics batchMetrics;


    public synchronized void run(Job job, String jobName) {
        Timer.Sample timer = batchMetrics.startTimer();
        batchMetrics.initializeJob(jobName);
        batchMetrics.recordRun(jobName);
        try {
            if (!jobOperator.getRunningExecutions(job.getName()).isEmpty()) {
                log.warn("{} skipped because a previous execution is still running", jobName);
                batchMetrics.recordSkipped(jobName);
                return;
            }

            JobParameters parameters = new JobParametersBuilder()
                    .addLong("scheduledAt", System.currentTimeMillis())
                    .toJobParameters();
            JobExecution execution = jobOperator.start(job, parameters);
            log.info("{} completed: executionId={}, status={}", jobName, execution.getId(), execution.getStatus());
            if (execution.getStatus() == BatchStatus.COMPLETED) {
                batchMetrics.recordSuccess(jobName);
            } else {
                batchMetrics.recordFailure(jobName);
            }
        } catch (Exception exception) {
            batchMetrics.recordFailure(jobName);
            log.error("{} failed", jobName, exception);
        } finally {
            batchMetrics.recordDuration(jobName, timer);
        }
    }
}
