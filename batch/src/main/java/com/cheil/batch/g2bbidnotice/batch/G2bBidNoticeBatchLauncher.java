package com.cheil.batch.g2bbidnotice.batch;

import com.cheil.batch.g2bbidnotice.application.model.BatchRunStatus;
import com.cheil.batch.g2bbidnotice.application.port.in.RunG2bBidNoticeBatchUseCase;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.parameters.JobParametersBuilder;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.redis.core.StringRedisTemplate;
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
    private final JobOperator jobOperator;
    private final G2bBidNoticeBatchProperties properties;
    private final StringRedisTemplate valkeyTemplate;

    private static final String RELEASE_LOCK_SCRIPT = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

    @Override
    public void run(ApplicationArguments args) {
        if (properties.enabled() && properties.runOnStartup()) {
            log.info("Startup batch job 실행: jobName={}", g2bBidNoticeCandidateSyncJob.getName());
            runWithLock();
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

        runWithLock();
    }

    @Override
    public BatchRunStatus runOnDemand() {
        // Controller의 수동 실행도 스케줄 실행과 동일한 분산 락 경로를 사용합니다.
        return runWithLock();
    }

    private BatchRunStatus runWithLock() {
        String lockValue = UUID.randomUUID().toString();
        String lockKey = "batch:lock:" + g2bBidNoticeCandidateSyncJob.getName();
        // Valkey TTL은 비정상 종료로 락 해제가 누락되어도 영구 정지가 되지 않도록 합니다.
        Boolean acquired = valkeyTemplate.opsForValue().setIfAbsent(lockKey, lockValue, properties.lockTtl());
        if (!Boolean.TRUE.equals(acquired)) {
            log.warn("{} skipped because the distributed lock already exists", g2bBidNoticeCandidateSyncJob.getName());
            return BatchRunStatus.SKIPPED;
        }
        try {
            JobExecution execution = jobOperator.start(g2bBidNoticeCandidateSyncJob, new JobParametersBuilder()
                    .addLong("scheduledAt", System.currentTimeMillis())
                    .toJobParameters());
            log.info("{} completed: executionId={}, status={}", g2bBidNoticeCandidateSyncJob.getName(), execution.getId(), execution.getStatus());
            return execution.getStatus() == BatchStatus.COMPLETED
                    ? BatchRunStatus.COMPLETED
                    : BatchRunStatus.FAILED;
        } catch (Exception exception) {
            log.error("{} failed", g2bBidNoticeCandidateSyncJob.getName(), exception);
            return BatchRunStatus.FAILED;
        } finally {
            // 내가 획득한 락인지 확인하는 Lua 스크립트로 다른 실행자의 락 삭제를 방지합니다.
            valkeyTemplate.execute(
                    new org.springframework.data.redis.core.script.DefaultRedisScript<>(RELEASE_LOCK_SCRIPT, Long.class),
                    java.util.List.of(lockKey),
                    lockValue
            );
        }
    }
}
