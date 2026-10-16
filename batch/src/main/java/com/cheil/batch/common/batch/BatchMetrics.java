package com.cheil.batch.common.batch;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

@Component
/** 모든 배치 Job의 실행 횟수, 결과, 처리 건수와 소요 시간을 Micrometer로 기록합니다. */
public class BatchMetrics {

    private final MeterRegistry meterRegistry;

    public BatchMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public Timer.Sample startTimer() {
        return Timer.start(meterRegistry);
    }

    public void initializeJob(String jobName) {
        // Counter와 Timer를 미리 등록해 실행 전에도 메트릭 이름이 노출되도록 합니다.
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

    public void recordDuration(String jobName, Timer.Sample sample) {
        sample.stop(Timer.builder("batch.job.duration")
                .description("Batch job execution duration")
                .tag("job", jobName)
                .register(meterRegistry));
    }

    public void recordRecords(String jobName, String recordType, long count) {
        // 음수 건수는 기록하지 않아 삭제·조회 결과의 잘못된 값이 메트릭에 반영되지 않게 합니다.
        Counter records = counter("batch.job.records", jobName, recordType);
        if (count > 0) {
            records.increment(count);
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
