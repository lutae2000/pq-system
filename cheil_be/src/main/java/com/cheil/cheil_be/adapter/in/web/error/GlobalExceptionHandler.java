package com.cheil.cheil_be.adapter.in.web.error;

import java.time.Instant;

import jakarta.servlet.http.HttpServletRequest;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.bidnotice.exception.BidNoticeApplicationException;
import com.cheil.cheil_be.application.commoncode.exception.CommonCodeApplicationException;
import com.cheil.cheil_be.application.qualificationcriteria.exception.QualificationCriteriaApplicationException;
import com.cheil.cheil_be.application.similarserviceperformance.exception.SimilarServicePerformanceApplicationException;
import com.cheil.cheil_be.application.workoverlap.exception.WorkOverlapApplicationException;
import com.cheil.cheil_be.application.constructiontype.exception.ConstructionTypeApplicationException;
import com.cheil.cheil_be.application.pqparticipatingengineer.exception.PqParticipatingEngineerApplicationException;
import com.cheil.cheil_be.application.newtechnology.exception.NewTechnologyApplicationException;
import com.cheil.cheil_be.application.shinindo.exception.ShinindoApplicationException;
import com.cheil.cheil_be.application.userauth.exception.UserAuthApplicationException;
import com.cheil.cheil_be.application.servicetype.exception.ServiceTypeApplicationException;
import com.cheil.cheil_be.application.systempolicy.exception.SystemPolicyApplicationException;
import com.cheil.cheil_be.application.relatedprojecthistorycondition.exception.RelatedProjectHistoryConditionApplicationException;
import com.cheil.cheil_be.application.serviceperformance.exception.ServicePerformanceApplicationException;
import com.cheil.cheil_be.application.systempermission.exception.SystemPermissionApplicationException;
import com.cheil.cheil_be.application.engineer.exception.EngineerApplicationException;
import com.cheil.cheil_be.common.web.ApiErrorResponse;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatusException(
            ResponseStatusException exception,
            HttpServletRequest request
    ) {
        HttpStatusCode statusCode = exception.getStatusCode();
        String message = hasText(exception.getReason())
                ? exception.getReason()
                : defaultMessage(statusCode);
        return build(statusCode, message, request.getRequestURI());
    }

    @ExceptionHandler(BidNoticeApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handleBidNoticeApplicationException(
            BidNoticeApplicationException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (exception.type()) {
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case CONFLICT -> HttpStatus.CONFLICT;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
        return build(status, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(CommonCodeApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handleCommonCodeApplicationException(
            CommonCodeApplicationException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (exception.type()) {
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case CONFLICT -> HttpStatus.CONFLICT;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
        return build(status, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(QualificationCriteriaApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handleQualificationCriteriaApplicationException(
            QualificationCriteriaApplicationException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (exception.type()) {
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case CONFLICT -> HttpStatus.CONFLICT;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
        return build(status, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(SimilarServicePerformanceApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handleSimilarServicePerformanceApplicationException(
            SimilarServicePerformanceApplicationException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (exception.type()) {
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
        return build(status, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(EngineerApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handleEngineerApplicationException(
            EngineerApplicationException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (exception.type()) {
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case CONFLICT -> HttpStatus.CONFLICT;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
        return build(status, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(WorkOverlapApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handleWorkOverlapApplicationException(
            WorkOverlapApplicationException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (exception.type()) {
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
        return build(status, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(ConstructionTypeApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstructionTypeApplicationException(
            ConstructionTypeApplicationException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (exception.type()) {
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case CONFLICT -> HttpStatus.CONFLICT;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
        return build(status, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(PqParticipatingEngineerApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handlePqParticipatingEngineerApplicationException(
            PqParticipatingEngineerApplicationException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (exception.type()) {
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
        return build(status, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(NewTechnologyApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handleNewTechnologyApplicationException(
            NewTechnologyApplicationException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (exception.type()) {
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case CONFLICT -> HttpStatus.CONFLICT;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
        return build(status, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(ShinindoApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handleShinindoApplicationException(
            ShinindoApplicationException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (exception.type()) {
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case CONFLICT -> HttpStatus.CONFLICT;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
        return build(status, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(UserAuthApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handleUserAuthApplicationException(
            UserAuthApplicationException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (exception.type()) {
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case UNAUTHORIZED -> HttpStatus.UNAUTHORIZED;
            case CONFLICT -> HttpStatus.CONFLICT;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
        return build(status, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(RelatedProjectHistoryConditionApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handleRelatedProjectHistoryConditionApplicationException(
            RelatedProjectHistoryConditionApplicationException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (exception.type()) {
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
        };
        return build(status, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(ServicePerformanceApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handleServicePerformanceApplicationException(
            ServicePerformanceApplicationException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (exception.type()) {
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
        return build(status, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(ServiceTypeApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handleServiceTypeApplicationException(
            ServiceTypeApplicationException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (exception.type()) {
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case CONFLICT -> HttpStatus.CONFLICT;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
        return build(status, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(SystemPolicyApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handleSystemPolicyApplicationException(
            SystemPolicyApplicationException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (exception.type()) {
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case CONFLICT -> HttpStatus.CONFLICT;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
        return build(status, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(SystemPermissionApplicationException.class)
    public ResponseEntity<ApiErrorResponse> handleSystemPermissionApplicationException(
            SystemPermissionApplicationException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (exception.type()) {
            case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
        };
        return build(status, exception.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fieldError -> {
                    if (hasText(fieldError.getDefaultMessage())) {
                        return fieldError.getDefaultMessage();
                    }
                    return fieldError.getField() + " 값이 올바르지 않습니다.";
                })
                .orElse("요청 값이 올바르지 않습니다.");
        return build(HttpStatus.BAD_REQUEST, message, request.getRequestURI());
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingRequestHeaderException(
            MissingRequestHeaderException exception,
            HttpServletRequest request
    ) {
        String message = exception.getHeaderName() + " 헤더가 필요합니다.";
        return build(HttpStatus.BAD_REQUEST, message, request.getRequestURI());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleHttpMessageNotReadableException(
            HttpMessageNotReadableException exception,
            HttpServletRequest request
    ) {
        log.debug("Failed to read request body", exception);
        return build(HttpStatus.BAD_REQUEST, "요청 본문 형식이 올바르지 않습니다.", request.getRequestURI());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException exception,
            HttpServletRequest request
    ) {
        String message = hasText(exception.getMessage()) ? exception.getMessage() : "요청 값이 올바르지 않습니다.";
        return build(HttpStatus.BAD_REQUEST, message, request.getRequestURI());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleException(
            Exception exception,
            HttpServletRequest request
    ) {
        log.error("Unhandled exception", exception);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다.", request.getRequestURI());
    }

    private ResponseEntity<ApiErrorResponse> build(HttpStatusCode statusCode, String message, String path) {
        HttpStatus status = HttpStatus.resolve(statusCode.value());
        HttpStatus resolvedStatus = status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR;
        ApiErrorResponse body = new ApiErrorResponse(
                Instant.now(),
                statusCode.value(),
                resolvedStatus.getReasonPhrase(),
                message,
                path
        );
        return ResponseEntity.status(statusCode)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(body);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String defaultMessage(HttpStatusCode statusCode) {
        if (statusCode.value() == HttpStatus.UNAUTHORIZED.value()) {
            return "인증이 필요합니다.";
        }
        if (statusCode.value() == HttpStatus.FORBIDDEN.value()) {
            return "접근이 거부되었습니다.";
        }
        if (statusCode.value() == HttpStatus.BAD_REQUEST.value()) {
            return "요청이 올바르지 않습니다.";
        }
        return "요청을 처리할 수 없습니다.";
    }
}
