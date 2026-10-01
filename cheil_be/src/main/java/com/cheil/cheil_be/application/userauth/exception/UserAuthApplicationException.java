package com.cheil.cheil_be.application.userauth.exception;

/** 사용자 인증 유스케이스 오류입니다. HTTP 상태 변환은 inbound adapter가 담당합니다. */
public class UserAuthApplicationException extends RuntimeException {
    public enum Type { BAD_REQUEST, UNAUTHORIZED, CONFLICT, NOT_FOUND }

    private final Type type;

    public UserAuthApplicationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public Type type() { return type; }
}
