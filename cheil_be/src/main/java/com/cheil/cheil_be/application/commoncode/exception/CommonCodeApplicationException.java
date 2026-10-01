package com.cheil.cheil_be.application.commoncode.exception;

/**
 * 공통코드 유스케이스에서 발생하는 업무 예외입니다.
 * HTTP 상태 변환은 inbound adapter가 담당하므로 application 계층은 예외 유형만 전달합니다.
 */
public class CommonCodeApplicationException extends RuntimeException {

    public enum Type {
        BAD_REQUEST,
        CONFLICT,
        NOT_FOUND
    }

    private final Type type;

    public CommonCodeApplicationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public Type type() {
        return type;
    }
}
