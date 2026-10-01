package com.cheil.cheil_be.application.newtechnology.exception;

/** 신기술 application 유스케이스 오류입니다. HTTP 상태 해석은 inbound adapter가 담당합니다. */
public class NewTechnologyApplicationException extends RuntimeException {
    public enum Type { BAD_REQUEST, NOT_FOUND, CONFLICT }

    private final Type type;

    public NewTechnologyApplicationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public Type type() { return type; }
}
