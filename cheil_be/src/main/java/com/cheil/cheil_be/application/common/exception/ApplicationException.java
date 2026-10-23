package com.cheil.cheil_be.application.common.exception;

import java.util.Objects;

public class ApplicationException extends RuntimeException {

    private final ApplicationErrorType errorType;

    public ApplicationException(ApplicationErrorType errorType, String message) {
        super(message);
        this.errorType = Objects.requireNonNull(errorType, "errorType");
    }

    public ApplicationException(ApplicationErrorType errorType, String message, Throwable cause) {
        super(message, cause);
        this.errorType = Objects.requireNonNull(errorType, "errorType");
    }

    public ApplicationErrorType errorType() {
        return errorType;
    }

    public static ApplicationException badRequest(String message) {
        return new ApplicationException(ApplicationErrorType.BAD_REQUEST, message);
    }

    public static ApplicationException badRequest(String message, Throwable cause) {
        return new ApplicationException(ApplicationErrorType.BAD_REQUEST, message, cause);
    }

    public static ApplicationException unauthorized(String message) {
        return new ApplicationException(ApplicationErrorType.UNAUTHORIZED, message);
    }

    public static ApplicationException forbidden(String message) {
        return new ApplicationException(ApplicationErrorType.FORBIDDEN, message);
    }

    public static ApplicationException conflict(String message) {
        return new ApplicationException(ApplicationErrorType.CONFLICT, message);
    }

    public static ApplicationException notFound(String message) {
        return new ApplicationException(ApplicationErrorType.NOT_FOUND, message);
    }
}
