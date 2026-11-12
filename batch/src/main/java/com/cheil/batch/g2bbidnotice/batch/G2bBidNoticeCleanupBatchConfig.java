package com.cheil.batch.g2bbidnotice.batch;

import com.cheil.batch.common.batch.BatchMetrics;
import com.cheil.batch.g2bbidnotice.application.port.in.CleanupG2bBidNoticesUseCase;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.Step;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.infrastructure.repeat.RepeatStatus;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
public class G2bBidNoticeCleanupBatchConfig {
    public static final String JOB_NAME = "g2bBidNoticeCleanupJob";

    @Bean
    Job g2bBidNoticeCleanupJob(JobRepository jobRepository, Step g2bBidNoticeCleanupStep, BatchMetrics metrics) {
        metrics.initializeJob(JOB_NAME);
        return new JobBuilder(JOB_NAME, jobRepository).start(g2bBidNoticeCleanupStep).build();
    }

    @Bean
    Step g2bBidNoticeCleanupStep(JobRepository jobRepository, PlatformTransactionManager transactionManager,
                                 CleanupG2bBidNoticesUseCase cleanup, BatchMetrics metrics) {
        metrics.initializeRecords(JOB_NAME, "deletedCandidates");
        metrics.initializeRecords(JOB_NAME, "deletedSyncItems");
        return new StepBuilder("g2bBidNoticeCleanupStep", jobRepository)
                .tasklet((contribution, chunkContext) -> {
                    var result = cleanup.cleanup();
                    contribution.getStepExecution().getExecutionContext().putInt("deletedCandidates", result.candidates());
                    contribution.getStepExecution().getExecutionContext().putInt("deletedSyncItems", result.syncItems());
                    metrics.recordRecords(JOB_NAME, "deletedCandidates", result.candidates());
                    metrics.recordRecords(JOB_NAME, "deletedSyncItems", result.syncItems());
                    return RepeatStatus.FINISHED;
                }, transactionManager).build();
    }
}
