package com.cheil.batch.common.batch;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;

import io.micrometer.core.instrument.Timer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.parameters.JobParameters;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

class BatchJobRunnerTest {

    private final JobOperator jobOperator = mock(JobOperator.class);
    private final StringRedisTemplate valkeyTemplate = mock(StringRedisTemplate.class);
    private final BatchMetrics batchMetrics = mock(BatchMetrics.class);
    private final Job job = mock(Job.class);
    private final Timer.Sample timer = mock(Timer.Sample.class);

    private BatchJobRunner runner;

    @BeforeEach
    void setUp() {
        runner = new BatchJobRunner(jobOperator, valkeyTemplate, batchMetrics);
        when(job.getName()).thenReturn("testJob");
        when(batchMetrics.startTimer()).thenReturn(timer);
    }

    @Test
    void recordsCompletedJobExecution() throws Exception {
        JobExecution execution = mock(JobExecution.class);
        when(execution.getStatus()).thenReturn(BatchStatus.COMPLETED);
        when(jobOperator.start(eq(job), any(JobParameters.class))).thenReturn(execution);

        assertThat(runner.run(job)).isEqualTo(BatchRunStatus.COMPLETED);

        verify(batchMetrics).recordRun("testJob");
        verify(batchMetrics).recordSuccess("testJob");
        verify(batchMetrics).recordDuration("testJob", timer);
    }

    @Test
    void skipsExecutionWhenDistributedLockExists() throws Exception {
        @SuppressWarnings("unchecked")
        ValueOperations<String, String> valueOperations = mock(ValueOperations.class);
        Duration lockTtl = Duration.ofMinutes(10);
        when(valkeyTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("batch:lock:testJob"), anyString(), eq(lockTtl)))
                .thenReturn(false);

        assertThat(runner.runWithLock(job, lockTtl)).isEqualTo(BatchRunStatus.SKIPPED);

        verify(jobOperator, never()).start(any(Job.class), any(JobParameters.class));
        verify(batchMetrics).recordSkipped("testJob");
        verify(batchMetrics).recordDuration("testJob", timer);
    }
}
