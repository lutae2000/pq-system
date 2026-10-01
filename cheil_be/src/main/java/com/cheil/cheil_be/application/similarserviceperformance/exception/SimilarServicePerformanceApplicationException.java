package com.cheil.cheil_be.application.similarserviceperformance.exception;

/**
 * 유사용역 수행실적 유스케이스에서 발생하는 업무 예외입니다.
 * HTTP 상태 변환은 inbound adapter가 담당하고 application은 예외 유형만 전달합니다.
 */
public class SimilarServicePerformanceApplicationException extends RuntimeException {

    public enum Type {
        BAD_REQUEST,
        NOT_FOUND
    }

    private final Type type;

    public SimilarServicePerformanceApplicationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public Type type() {
        return type;
    }
}
