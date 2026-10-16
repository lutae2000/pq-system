package com.cheil.batch.common.batch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/** 애플리케이션 시작 시 실행하도록 설정된 배치 Job을 공통 실행기로 실행합니다. */
@Slf4j
@Component
@RequiredArgsConstructor
public class BatchStartupRunner implements ApplicationRunner {

    private final List<StartupBatchJob> startupBatchJobs;
    private final BatchJobRunner batchJobRunner;

    @Override
    public void run(ApplicationArguments args) {
        // 각 업무 Job의 시작 실행 여부는 StartupBatchJob 구현체가 설정값으로 결정합니다.
        startupBatchJobs.stream()
                .filter(StartupBatchJob::runOnStartup)
                .forEach(batchJob -> {
                    log.info("Startup batch job 실행: jobName={}", batchJob.jobName());
                    batchJobRunner.run(batchJob.job(), batchJob.jobName());
                });
    }
}
