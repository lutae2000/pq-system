package com.cheil.batch.g2bbidnotice.batch;

import com.cheil.batch.g2bbidnotice.application.model.G2bBidNoticeSyncCommand;
import com.cheil.batch.g2bbidnotice.application.model.G2bBidNoticeSyncResult;
import com.cheil.batch.g2bbidnotice.application.port.in.SyncG2bBidNoticeCandidatesUseCase;
import com.cheil.batch.common.batch.BatchMetrics;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.Step;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.infrastructure.repeat.RepeatStatus;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

import java.time.ZoneId;
import java.time.ZonedDateTime;

@Configuration
@EnableConfigurationProperties(G2bBidNoticeBatchProperties.class)
/** 나라장터 후보 동기화 Job의 Spring Batch Job과 단일 Step을 구성합니다. */
public class G2bBidNoticeBatchConfig {

    public static final String JOB_NAME = "g2bBidNoticeCandidateSyncJob";

    @Bean
    Job g2bBidNoticeCandidateSyncJob(
            JobRepository jobRepository,
            Step g2bBidNoticeCandidateSyncStep,
            BatchMetrics batchMetrics
    ) {
        batchMetrics.initializeJob(JOB_NAME);
        return new JobBuilder(JOB_NAME, jobRepository)
                .start(g2bBidNoticeCandidateSyncStep)
                .build();
    }

    @Bean
    Step g2bBidNoticeCandidateSyncStep(
            JobRepository jobRepository,
            PlatformTransactionManager transactionManager,
            SyncG2bBidNoticeCandidatesUseCase syncUseCase,
            G2bBidNoticeBatchProperties properties,
            BatchMetrics batchMetrics
    ) {
        batchMetrics.initializeRecords(JOB_NAME, "total");
        batchMetrics.initializeRecords(JOB_NAME, "fetched");
        return new StepBuilder("g2bBidNoticeCandidateSyncStep", jobRepository)
                .tasklet((contribution, chunkContext) -> {
                    // 명시적인 조회 기간이 없으면 설정된 시간대의 현재 시각과 lookback을 사용합니다.
                    ZonedDateTime to = ZonedDateTime.now(ZoneId.of(properties.zone()));
                    ZonedDateTime from = properties.resolveFrom(to);
                    to = properties.resolveTo(to);

                    // API 호출, 페이지 순회, 중복 병합, 저장은 동기화 UseCase가 담당합니다.
                    G2bBidNoticeSyncResult result = syncUseCase.sync(new G2bBidNoticeSyncCommand(
                            from,
                            to,
                            properties.regionCodeList(),
                            properties.pageSize(),
                            properties.includeUnrestricted()
                    ));
                    contribution.getStepExecution().getExecutionContext().putInt("totalCount", result.baseTotalCount());
                    contribution.getStepExecution().getExecutionContext().putInt("fetchedCount", result.fetchedCount());
                    batchMetrics.recordRecords(JOB_NAME, "total", result.baseTotalCount());
                    batchMetrics.recordRecords(JOB_NAME, "fetched", result.fetchedCount());
                    return RepeatStatus.FINISHED;
                }, transactionManager)
                .build();
    }
}
