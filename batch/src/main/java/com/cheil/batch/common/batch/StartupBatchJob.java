package com.cheil.batch.common.batch;

import org.springframework.batch.core.job.Job;

/**
 * 개발 또는 운영 점검 시 애플리케이션 기동과 함께 한 번 실행할 수 있는 배치 작업 계약입니다.
 * 새 배치가 이 인터페이스를 구현하면 공통 기동 실행기가 작업을 자동으로 찾아 실행합니다.
 */
public interface StartupBatchJob {

    String jobName();

    Job job();

    boolean runOnStartup();
}
