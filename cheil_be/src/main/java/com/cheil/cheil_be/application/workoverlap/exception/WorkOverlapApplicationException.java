package com.cheil.cheil_be.application.workoverlap.exception;

/**
 * 업무중복 유스케이스의 업무 예외입니다.
 * HTTP 응답 상태 변환은 web adapter가 담당하고 application은 예외 유형만 전달합니다.
 */
public class WorkOverlapApplicationException extends RuntimeException {

    public enum Type {
        BAD_REQUEST,
        NOT_FOUND
    }

    private final Type type;

    public WorkOverlapApplicationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public Type type() {
        return type;
    }
}
