package com.cheil.batch.apicalllogcleanup;

import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.Step;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.infrastructure.repeat.RepeatStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
public class ApiCallLogCleanupBatchConfig {

    private static final String JOB_NAME = "apiCallLogCleanupJob";

    @Bean
    Job apiCallLogCleanupJob(JobRepository jobRepository, Step apiCallLogCleanupStep) {
        return new JobBuilder(JOB_NAME, jobRepository)
                .start(apiCallLogCleanupStep)
                .build();
    }

    @Bean
    Step apiCallLogCleanupStep(
            JobRepository jobRepository,
            PlatformTransactionManager transactionManager,
            ApiCallLogCleanupMapper apiCallLogCleanupMapper,
            @Value("${batch.cleanup.api-call-logs.retention-months:3}") int retentionMonths
    ) {
        if (retentionMonths < 1) {
            throw new IllegalArgumentException("batch.cleanup.api-call-logs.retention-months must be at least 1");
        }

        return new StepBuilder("apiCallLogCleanupStep", jobRepository)
                .tasklet((contribution, chunkContext) -> {
                    int deletedCount = apiCallLogCleanupMapper.deleteExpiredApiCallLogs(retentionMonths);
                    contribution.getStepExecution().getExecutionContext().putInt("deletedCount", deletedCount);
                    return RepeatStatus.FINISHED;
                }, transactionManager)
                .build();
    }
}
