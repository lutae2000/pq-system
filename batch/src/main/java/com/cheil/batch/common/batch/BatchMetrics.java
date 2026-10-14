package com.cheil.batch.common.batch;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

@Component
public class BatchMetrics {

    private final MeterRegistry meterRegistry;

    public BatchMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public Timer.Sample startTimer() {
        return Timer.start(meterRegistry);
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

    public void recordDuration(String jobName, Timer.Sample sample) {
        sample.stop(Timer.builder("batch.job.duration")
                .description("Batch job execution duration")
                .tag("job", jobName)
                .register(meterRegistry));
    }

    public void recordRecords(String jobName, String recordType, long count) {
        if (count <= 0) {
            return;
        }
        counter("batch.job.records", jobName, recordType).increment(count);
    }

    private Counter counter(String name, String jobName, String type) {
        return Counter.builder(name)
                .description("Batch job execution metric")
                .tag("job", jobName)
                .tag("type", type)
                .register(meterRegistry);
    }
}
