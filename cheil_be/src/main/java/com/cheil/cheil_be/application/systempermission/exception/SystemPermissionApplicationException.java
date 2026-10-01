package com.cheil.cheil_be.application.systempermission.exception;

/** 시스템 권한 유스케이스의 실패 원인을 웹 계층의 HTTP 타입과 분리해 전달한다. */
public class SystemPermissionApplicationException extends RuntimeException {

    public enum Type {
        BAD_REQUEST,
        NOT_FOUND
    }

    private final Type type;

    public SystemPermissionApplicationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public Type type() {
        return type;
    }
}
