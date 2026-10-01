package com.cheil.cheil_be.application.constructiontype.exception;

/**
 * 공사종류 use case에서 발생한 업무 오류입니다.
 *
 * <p>application 계층은 HTTP 상태를 알 필요가 없으므로 오류 유형만 보관하고,
 * 실제 상태 코드는 inbound web adapter에서 변환합니다.</p>
 */
public class ConstructionTypeApplicationException extends RuntimeException {

    public enum Type {
        BAD_REQUEST,
        CONFLICT,
        NOT_FOUND
    }

    private final Type type;

    public ConstructionTypeApplicationException(Type type, String message) {
        super(message);
        this.type = type;
    }

    public Type type() {
        return type;
    }
}
