package com.cheil.cheil_be.application.engineer.exception;

/**
 * 기술인 관리 유스케이스에서 사용하는 업무 예외입니다.
 * HTTP 상태 코드 변환은 inbound adapter의 예외 처리기가 담당합니다.
 */
public class EngineerApplicationException extends RuntimeException {

    public enum Type {
        BAD_REQUEST,
        CONFLICT,
        NOT_FOUND
    }

    private final Type type;

    public EngineerApplicationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public Type type() {
        return type;
    }
}
