package com.cheil.batch.common.batch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.parameters.JobParameters;
import org.springframework.batch.core.job.parameters.JobParametersBuilder;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BatchJobRunner {

    private final JobOperator jobOperator;

    public void run(Job job, String jobName) {
        try {
            JobParameters parameters = new JobParametersBuilder()
                    .addLong("scheduledAt", System.currentTimeMillis())
                    .toJobParameters();
            JobExecution execution = jobOperator.start(job, parameters);
            log.info("{} finished: executionId={}, status={}", jobName, execution.getId(), execution.getStatus());
        } catch (Exception exception) {
            log.error("{} failed", jobName, exception);
        }
    }
}
