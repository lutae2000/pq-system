package com.cheil.cheil_be.application.relatedprojecthistorycondition.exception;

/** application 오류를 inbound adapter가 HTTP 상태로 변환할 수 있도록 표현한다. */
public class RelatedProjectHistoryConditionApplicationException extends RuntimeException {

    public enum Type { BAD_REQUEST }

    private final Type type;

    public RelatedProjectHistoryConditionApplicationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public RelatedProjectHistoryConditionApplicationException(Type type, String message, Throwable cause) {
        super(message, cause);
        this.type = type;
    }

    public Type type() {
        return type;
    }
}
