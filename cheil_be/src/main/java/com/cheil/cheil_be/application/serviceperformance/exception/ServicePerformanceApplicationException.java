package com.cheil.cheil_be.application.serviceperformance.exception;

/** 용역실적 유스케이스 오류를 inbound adapter가 HTTP 상태로 변환할 수 있도록 표현한다. */
public class ServicePerformanceApplicationException extends RuntimeException {

    public enum Type { BAD_REQUEST, NOT_FOUND }

    private final Type type;

    public ServicePerformanceApplicationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public Type type() {
        return type;
    }
}
