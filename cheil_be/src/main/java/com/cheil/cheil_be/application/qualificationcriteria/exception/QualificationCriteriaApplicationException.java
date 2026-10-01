package com.cheil.cheil_be.application.qualificationcriteria.exception;

/**
 * 적격심사 기준 유스케이스에서 발생하는 업무 예외입니다.
 * HTTP 상태 변환은 inbound adapter가 담당하고 application은 예외 유형만 제공합니다.
 */
public class QualificationCriteriaApplicationException extends RuntimeException {

    public enum Type {
        BAD_REQUEST,
        CONFLICT,
        NOT_FOUND
    }

    private final Type type;

    public QualificationCriteriaApplicationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public Type type() {
        return type;
    }
}
