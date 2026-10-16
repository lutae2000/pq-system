package com.cheil.batch.common.batch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.parameters.JobParameters;
import org.springframework.batch.core.job.parameters.JobParametersBuilder;
import org.springframework.batch.core.launch.JobOperator;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

/**
 * Spring Batch Job의 공통 실행 진입점입니다.
 *
 * <p>스케줄러와 수동 실행 Controller가 같은 실행 경로를 사용하도록 하며,
 * 실행 중복 확인, 실행 파라미터 생성, 메트릭 기록, 예외 처리를 한 곳에서 담당합니다.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BatchJobRunner {

    private final JobOperator jobOperator;
    private final BatchMetrics batchMetrics;

    /**
     * 지정한 Job을 한 번 실행합니다.
     *
     * <p>메서드의 {@code synchronized}는 동일한 애플리케이션 인스턴스 안에서
     * 스케줄 실행과 수동 실행이 동시에 진입하는 것을 막습니다. 여러 인스턴스 사이의
     * 중복 실행은 Spring Batch JobRepository의 실행 상태 확인과 업무별 분산 락이 담당합니다.</p>
     *
     * @param job 실행할 Spring Batch Job
     * @param jobName 메트릭과 로그에 사용할 업무별 Job 이름
     * @return 실행 완료, 이미 실행 중, 실행 실패 중 하나의 결과
     */
    public synchronized BatchJobRunStatus run(Job job, String jobName) {
        // Job 전체 실행 시간을 측정하므로, 정상 종료와 예외 종료 모두 finally에서 기록합니다.
        Timer.Sample timer = batchMetrics.startTimer();
        batchMetrics.initializeJob(jobName);
        batchMetrics.recordRun(jobName);
        try {
            // 다른 인스턴스나 이전 실행이 아직 끝나지 않았으면 새 Job을 시작하지 않습니다.
            if (!jobOperator.getRunningExecutions(job.getName()).isEmpty()) {
                log.warn("{} skipped because a previous execution is still running", jobName);
                batchMetrics.recordSkipped(jobName);
                return BatchJobRunStatus.SKIPPED;
            }

            // 실행 시각을 JobParameter로 넣어 같은 Job의 재실행을 서로 다른 실행으로 구분합니다.
            JobParameters parameters = new JobParametersBuilder()
                    .addLong("scheduledAt", System.currentTimeMillis())
                    .toJobParameters();
            JobExecution execution = jobOperator.start(job, parameters);
            log.info("{} completed: executionId={}, status={}", jobName, execution.getId(), execution.getStatus());

            // JobOperator가 반환한 최종 상태를 공통 실행 결과로 변환합니다.
            if (execution.getStatus() == BatchStatus.COMPLETED) {
                batchMetrics.recordSuccess(jobName);
                return BatchJobRunStatus.COMPLETED;
            } else {
                batchMetrics.recordFailure(jobName);
                return BatchJobRunStatus.FAILED;
            }
        } catch (Exception exception) {
            // 실행 중 예외는 호출자에게 다시 던지지 않고 실패 상태와 원인을 로그로 남깁니다.
            // Controller 호출과 스케줄 실행이 동일한 방식으로 결과를 처리할 수 있도록 합니다.
            batchMetrics.recordFailure(jobName);
            log.error("{} failed", jobName, exception);
            return BatchJobRunStatus.FAILED;
        } finally {
            // 중복 실행으로 건너뛴 경우를 포함해 모든 실행 시도의 소요 시간을 기록합니다.
            batchMetrics.recordDuration(jobName, timer);
        }
    }
}
