package com.cheil.cheil_be.application.pqparticipatingengineer.exception;

/**
 * PQ 참여 기술자 use case에서 발생한 업무 오류입니다.
 * HTTP 상태 변환은 application이 아니라 inbound web adapter에서 담당합니다.
 */
public class PqParticipatingEngineerApplicationException extends RuntimeException {

    public enum Type {
        BAD_REQUEST,
        NOT_FOUND
    }

    private final Type type;

    public PqParticipatingEngineerApplicationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public PqParticipatingEngineerApplicationException(Type type, String message, Throwable cause) {
        super(message, cause);
        this.type = type;
    }

    public Type type() {
        return type;
    }
}
