package com.cheil.batch.common.batch;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.parameters.JobParametersBuilder;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

/** Spring Batch Job의 실행, 상태 판정, 메트릭 기록과 선택적 분산 락을 공통 처리합니다. */
@Slf4j
@Component
@RequiredArgsConstructor
public class BatchJobRunner {

    private static final String LOCK_KEY_PREFIX = "batch:lock:";
    private static final DefaultRedisScript<Long> RELEASE_LOCK_SCRIPT = new DefaultRedisScript<>(
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
            Long.class
    );

    private final JobOperator jobOperator;
    private final StringRedisTemplate valkeyTemplate;
    private final BatchMetrics batchMetrics;

    public BatchRunStatus run(Job job) {
        return run(job, null);
    }

    public BatchRunStatus runWithLock(Job job, Duration lockTtl) {
        if (lockTtl == null || lockTtl.isZero() || lockTtl.isNegative()) {
            throw new IllegalArgumentException("lockTtl must be positive");
        }
        return run(job, lockTtl);
    }

    private BatchRunStatus run(Job job, Duration lockTtl) {
        String jobName = job.getName();
        Timer.Sample timer = batchMetrics.startTimer();
        batchMetrics.recordRun(jobName);

        String lockKey = LOCK_KEY_PREFIX + jobName;
        String lockValue = UUID.randomUUID().toString();
        boolean lockAcquired = false;
        try {
            if (lockTtl != null) {
                lockAcquired = Boolean.TRUE.equals(
                        valkeyTemplate.opsForValue().setIfAbsent(lockKey, lockValue, lockTtl));
                if (!lockAcquired) {
                    log.warn("{} skipped because the distributed lock already exists", jobName);
                    batchMetrics.recordSkipped(jobName);
                    return BatchRunStatus.SKIPPED;
                }
            }

            JobExecution execution = jobOperator.start(job, new JobParametersBuilder()
                    .addLong("scheduledAt", System.currentTimeMillis())
                    .toJobParameters());
            log.info("{} completed: executionId={}, status={}", jobName, execution.getId(), execution.getStatus());
            if (execution.getStatus() == BatchStatus.COMPLETED) {
                batchMetrics.recordSuccess(jobName);
                return BatchRunStatus.COMPLETED;
            }
            batchMetrics.recordFailure(jobName);
            return BatchRunStatus.FAILED;
        } catch (Exception exception) {
            log.error("{} failed", jobName, exception);
            batchMetrics.recordFailure(jobName);
            return BatchRunStatus.FAILED;
        } finally {
            batchMetrics.recordDuration(jobName, timer);
            if (lockAcquired) {
                releaseLock(lockKey, lockValue, jobName);
            }
        }
    }

    private void releaseLock(String lockKey, String lockValue, String jobName) {
        try {
            valkeyTemplate.execute(RELEASE_LOCK_SCRIPT, List.of(lockKey), lockValue);
        } catch (RuntimeException exception) {
            log.error("{} distributed lock release failed", jobName, exception);
        }
    }
}
