package com.cheil.batch.common.batch;

/** 공통 배치 실행 결과입니다. */
public enum BatchJobRunStatus {
    /** Job이 정상 완료되었습니다. */
    COMPLETED,
    /** Job 실행 중 오류가 발생했습니다. */
    FAILED,
    /** 이미 실행 중인 Job이 있어 실행을 건너뛰었습니다. */
    SKIPPED
}
