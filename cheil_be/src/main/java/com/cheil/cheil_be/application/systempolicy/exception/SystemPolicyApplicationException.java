package com.cheil.cheil_be.application.systempolicy.exception;

/**
 * 시스템 정책 use case에서 발생하는 업무 예외다.
 * HTTP 상태 변환은 inbound web adapter가 담당한다.
 */
public class SystemPolicyApplicationException extends RuntimeException {

    public enum Type {
        BAD_REQUEST,
        CONFLICT,
        NOT_FOUND
    }

    private final Type type;

    public SystemPolicyApplicationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public Type type() {
        return type;
    }
}
