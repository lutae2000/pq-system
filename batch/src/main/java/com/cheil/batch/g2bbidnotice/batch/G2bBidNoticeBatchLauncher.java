package com.cheil.batch.g2bbidnotice.batch;

import com.cheil.batch.common.batch.BatchJobRunner;
import com.cheil.batch.common.batch.BatchJobRunStatus;
import com.cheil.batch.common.batch.StartupBatchJob;
import java.time.Duration;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.batch.core.job.Job;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 나라장터 입찰공고 Job의 정기 실행과 개발용 기동 실행 설정을 담당합니다.
 */
@Slf4j
@Component
public class G2bBidNoticeBatchLauncher implements StartupBatchJob {

    private final Job job;
    private final BatchJobRunner batchJobRunner;
    private final G2bBidNoticeBatchProperties properties;
    private final StringRedisTemplate valkeyTemplate;

    private static final String LOCK_KEY = "batch:lock:g2bBidNoticeCandidateSyncJob";
    private static final Duration LOCK_TTL = Duration.ofMinutes(1);
    private static final String RELEASE_LOCK_SCRIPT = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

    public G2bBidNoticeBatchLauncher(
            @Qualifier("g2bBidNoticeCandidateSyncJob") Job job,
            BatchJobRunner batchJobRunner,
            G2bBidNoticeBatchProperties properties,
            StringRedisTemplate valkeyTemplate
    ) {
        this.job = job;
        this.batchJobRunner = batchJobRunner;
        this.properties = properties;
        this.valkeyTemplate = valkeyTemplate;
    }

    @Scheduled(
            cron = "${batch.g2b.bid-notice.cron}",
            zone = "${batch.g2b.bid-notice.zone:Asia/Seoul}"
    )
    public void runOnSchedule() {
        if (!properties.enabled()) {
            log.debug("나라장터 용역 입찰공고 정기 배치가 비활성화되어 있습니다.");
            return;
        }

        runWithLock();
    }

    public BatchJobRunStatus runOnDemand() {
        return runWithLock();
    }

    private BatchJobRunStatus runWithLock() {
        String lockValue = UUID.randomUUID().toString();
        Boolean acquired = valkeyTemplate.opsForValue().setIfAbsent(LOCK_KEY, lockValue, LOCK_TTL);
        if (!Boolean.TRUE.equals(acquired)) {
            log.warn("{} skipped because the distributed lock already exists", jobName());
            return BatchJobRunStatus.SKIPPED;
        }
        try {
            return batchJobRunner.run(job, jobName());
        } finally {
            valkeyTemplate.execute(
                    new org.springframework.data.redis.core.script.DefaultRedisScript<>(RELEASE_LOCK_SCRIPT, Long.class),
                    java.util.List.of(LOCK_KEY),
                    lockValue
            );
        }
    }

    @Override
    public String jobName() {
        return G2bBidNoticeBatchConfig.JOB_NAME;
    }

    @Override
    public Job job() {
        return job;
    }

    @Override
    public boolean runOnStartup() {
        return properties.enabled() && properties.runOnStartup();
    }
}
