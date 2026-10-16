package com.cheil.batch.apicalllogcleanup.batch;

import com.cheil.batch.common.batch.BatchMetrics;
import com.cheil.batch.apicalllogcleanup.application.port.in.CleanupApiCallLogsUseCase;
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
/** API 호출 로그 삭제를 Spring Batch Job과 Step으로 구성합니다. */
public class ApiCallLogCleanupBatchConfig {

    private static final String JOB_NAME = "apiCallLogCleanupJob";

    @Bean
    Job apiCallLogCleanupJob(
            JobRepository jobRepository,
            Step apiCallLogCleanupStep,
            BatchMetrics batchMetrics
    ) {
        // Job 이름은 메트릭, 로그, Spring Batch 메타데이터에서 동일하게 사용합니다.
        batchMetrics.initializeJob(JOB_NAME);
        return new JobBuilder(JOB_NAME, jobRepository)
                .start(apiCallLogCleanupStep)
                .build();
    }

    @Bean
    Step apiCallLogCleanupStep(
            JobRepository jobRepository,
            PlatformTransactionManager transactionManager,
            CleanupApiCallLogsUseCase cleanupUseCase,
            @Value("${batch.cleanup.api-call-logs.retention-months:3}") int retentionMonths,
            BatchMetrics batchMetrics
    ) {
        batchMetrics.initializeRecords(JOB_NAME, "deleted");
        return new StepBuilder("apiCallLogCleanupStep", jobRepository)
                .tasklet((contribution, chunkContext) -> {
                    // 보관 기간 판단과 삭제 SQL은 application/output adapter 계층이 담당합니다.
                    int deletedCount = cleanupUseCase.cleanup(retentionMonths);
                    contribution.getStepExecution().getExecutionContext().putInt("deletedCount", deletedCount);
                    batchMetrics.recordRecords(JOB_NAME, "deleted", deletedCount);
                    return RepeatStatus.FINISHED;
                }, transactionManager)
                .build();
    }
}
