package com.cheil.cheil_be.application.shinindo.exception;

/** 신인도 유스케이스 오류이며 HTTP 상태 변환은 inbound adapter가 담당합니다. */
public class ShinindoApplicationException extends RuntimeException {
    public enum Type { BAD_REQUEST, NOT_FOUND, CONFLICT }

    private final Type type;

    public ShinindoApplicationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public Type type() { return type; }
}
