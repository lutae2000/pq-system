package com.cheil.batch.common.batch;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

/** 배치 실행 시간과 처리 건수를 Grafana가 사용하는 Micrometer 메트릭으로 기록합니다. */
@Component
public class BatchMetrics {

    private final MeterRegistry meterRegistry;

    public BatchMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public Timer.Sample startTimer() {
        return Timer.start(meterRegistry);
    }

    public void initializeJob(String jobName) {
        counter("batch.job.runs", jobName, "run");
        counter("batch.job.success", jobName, "success");
        counter("batch.job.failure", jobName, "failure");
        counter("batch.job.skipped", jobName, "skipped");
        Timer.builder("batch.job.duration")
                .description("Batch job execution duration")
                .tag("job", jobName)
                .register(meterRegistry);
    }

    public void initializeRecords(String jobName, String recordType) {
        counter("batch.job.records", jobName, recordType);
    }

    public void recordRun(String jobName) {
        counter("batch.job.runs", jobName, "run").increment();
    }

    public void recordSuccess(String jobName) {
        counter("batch.job.success", jobName, "success").increment();
    }

    public void recordFailure(String jobName) {
        counter("batch.job.failure", jobName, "failure").increment();
    }

    public void recordSkipped(String jobName) {
        counter("batch.job.skipped", jobName, "skipped").increment();
    }

    public void recordDuration(String jobName, Timer.Sample timer) {
        timer.stop(Timer.builder("batch.job.duration")
                .description("Batch job execution duration")
                .tag("job", jobName)
                .register(meterRegistry));
    }

    public void recordRecords(String jobName, String recordType, long count) {
        if (count > 0) {
            counter("batch.job.records", jobName, recordType).increment(count);
        }
    }

    private Counter counter(String name, String jobName, String type) {
        return Counter.builder(name)
                .description("Batch job execution metric")
                .tag("job", jobName)
                .tag("type", type)
                .register(meterRegistry);
    }
}
