package com.cheil.batch.g2bbidnotice.batch;

import com.cheil.batch.common.batch.BatchJobRunner;
import com.cheil.batch.common.batch.BatchRunStatus;
import com.cheil.batch.g2bbidnotice.application.port.in.RunG2bBidNoticeBatchUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.job.Job;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 나라장터 입찰공고 Job의 정기 실행과 개발용 기동 실행 설정을 담당합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class G2bBidNoticeBatchLauncher implements ApplicationRunner, RunG2bBidNoticeBatchUseCase {

    private final Job g2bBidNoticeCandidateSyncJob;
    private final G2bBidNoticeBatchProperties properties;
    private final BatchJobRunner batchJobRunner;

    @Override
    public void run(ApplicationArguments args) {
        if (properties.enabled() && properties.runOnStartup()) {
            log.info("Startup batch job 실행: jobName={}", g2bBidNoticeCandidateSyncJob.getName());
            batchJobRunner.runWithLock(g2bBidNoticeCandidateSyncJob, properties.lockTtl());
        }
    }

    @Scheduled(
            cron = "${batch.g2b.bid-notice.cron}",
            zone = "${batch.g2b.bid-notice.zone:Asia/Seoul}"
    )
    public void runOnSchedule() {
        // 스케줄 실행은 enabled가 false인 환경에서 호출 자체를 건너뜁니다.
        if (!properties.enabled()) {
            log.debug("나라장터 용역 입찰공고 정기 배치가 비활성화되어 있습니다.");
            return;
        }

        batchJobRunner.runWithLock(g2bBidNoticeCandidateSyncJob, properties.lockTtl());
    }

    @Override
    public BatchRunStatus runOnDemand() {
        // Controller의 수동 실행도 스케줄 실행과 동일한 분산 락 경로를 사용합니다.
        return batchJobRunner.runWithLock(g2bBidNoticeCandidateSyncJob, properties.lockTtl());
    }
}
