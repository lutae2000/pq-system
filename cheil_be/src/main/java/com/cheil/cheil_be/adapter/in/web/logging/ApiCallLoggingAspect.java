package com.cheil.cheil_be.adapter.in.web.logging;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.UUID;

import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationRegistry;
import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerMapping;

import com.cheil.cheil_be.application.apilog.port.out.ApiCallLogRecorder;
import com.cheil.cheil_be.common.logging.SensitiveValueMasker;
import com.cheil.cheil_be.common.security.SecurityHeaders;
import com.cheil.cheil_be.common.security.ServicePrincipal;
import com.cheil.cheil_be.common.web.ClientIpResolver;
import com.cheil.cheil_be.domain.apilog.ApiCallLogRecord;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

/**
 * RestController 호출의 요청 파라미터와 응답 값을 DB 로그로 남기는 AOP입니다.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class ApiCallLoggingAspect {

    private static final int MAX_PAYLOAD_LENGTH = 20_000;
    private static final int MAX_ERROR_MESSAGE_LENGTH = 4_000;

    private final ApiCallLogRecorder apiCallLogRecorder;
    private final ObjectMapper objectMapper;
    private final ObjectProvider<HttpServletRequest> requestProvider;
    private final ObjectProvider<ObservationRegistry> observationRegistryProvider;
    private final ObjectProvider<Tracer> tracerProvider;
    private final Clock clock;

    @Around("within(@org.springframework.web.bind.annotation.RestController *)")
    public Object recordApiCall(ProceedingJoinPoint joinPoint) throws Throwable {
        Instant occurredAt = Instant.now(clock);
        long startedAt = System.nanoTime();
        Object result = null;
        Throwable thrown = null;

        try {
            result = joinPoint.proceed();
            return result;
        } catch (Throwable ex) {
            thrown = ex;
            throw ex;
        } finally {
            HttpServletRequest request = requestProvider.getIfAvailable();
            if (request != null) {
                record(joinPoint, request, result, thrown, occurredAt, startedAt);
            }
        }
    }

    private void record(
            ProceedingJoinPoint joinPoint,
            HttpServletRequest request,
            Object result,
            Throwable thrown,
            Instant occurredAt,
            long startedAt
    ) {
        Integer statusCode = statusCode(result, thrown);
        String serviceId = ServicePrincipal.currentServiceId().orElse(null);
        String loginId = header(request, SecurityHeaders.LOGIN_ID);
        String programCode = header(request, SecurityHeaders.PROGRAM_CODE);
        String clientIp = ClientIpResolver.resolve(request);
        String traceId = currentTraceId();
        String uriPattern = uriPattern(request);
        addTraceAttributes(serviceId, loginId, programCode, clientIp);

        if (thrown != null && statusCode != null && statusCode >= 500) {
            Throwable rootCause = rootCause(thrown);
            log.error(
                    "api_error method={} uri={} uri_pattern={} status={} error_type={} error_message=\"{}\" "
                            + "root_cause_type={} root_cause_message=\"{}\" trace_id={}",
                    request.getMethod(),
                    request.getRequestURI(),
                    uriPattern,
                    statusCode,
                    thrown.getClass().getName(),
                    errorMessage(thrown),
                    rootCause.getClass().getName(),
                    errorMessage(rootCause),
                    traceId,
                    thrown
            );
        }

        apiCallLogRecorder.record(new ApiCallLogRecord(
                UUID.randomUUID(),
                traceId,
                occurredAt,
                request.getMethod(),
                request.getRequestURI(),
                decodeQueryString(request.getQueryString()),
                joinPoint.getSignature().toShortString(),
                serviceId,
                loginId,
                programCode,
                clientIp,
                serializeArguments(joinPoint.getArgs()),
                serializeResponse(result),
                statusCode,
                thrown == null && statusCode != null && statusCode < 400,
                thrown == null ? null : truncate(errorMessage(rootCause(thrown))),
                Duration.ofNanos(System.nanoTime() - startedAt).toMillis()
        ));
    }

    private static Throwable rootCause(Throwable throwable) {
        Throwable current = throwable;
        for (int depth = 0; depth < 32; depth++) {
            Throwable cause = current.getCause();
            if (cause == null || cause == current) {
                break;
            }
            current = cause;
        }
        return current;
    }

    private static String errorMessage(Throwable throwable) {
        String message = throwable.getMessage();
        if (message == null || message.isBlank()) {
            return "(no message)";
        }
        String sanitized = SensitiveValueMasker.mask(message)
                .replace('\r', ' ')
                .replace('\n', ' ')
                .replace('"', '\'');
        return sanitized.length() <= MAX_ERROR_MESSAGE_LENGTH
                ? sanitized
                : sanitized.substring(0, MAX_ERROR_MESSAGE_LENGTH);
    }

    private static String uriPattern(HttpServletRequest request) {
        Object pattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        return pattern == null ? request.getRequestURI() : String.valueOf(pattern);
    }

    private String currentTraceId() {
        Tracer tracer = tracerProvider.getIfAvailable();
        Span span = tracer == null ? null : tracer.currentSpan();
        return span == null ? null : span.context().traceId();
    }

    private void addTraceAttributes(String serviceId, String loginId, String programCode, String clientIp) {
        ObservationRegistry observationRegistry = observationRegistryProvider.getIfAvailable();
        Observation observation = observationRegistry == null ? null : observationRegistry.getCurrentObservation();
        if (observation == null) {
            return;
        }

        addHighCardinalityAttribute(observation, "user.id", loginId);
        addHighCardinalityAttribute(observation, "client.address", clientIp);
        addHighCardinalityAttribute(observation, "app.program_code", programCode);
        addHighCardinalityAttribute(observation, "app.service_id", serviceId);
    }

    private static void addHighCardinalityAttribute(Observation observation, String key, String value) {
        if (value != null && !value.isBlank()) {
            observation.highCardinalityKeyValue(key, value);
        }
    }

    private static String header(HttpServletRequest request, String name) {
        String value = request.getHeader(name);
        return value == null || value.isBlank() ? null : value;
    }

    private Integer statusCode(Object result, Throwable thrown) {
        if (thrown instanceof ResponseStatusException responseStatusException) {
            return responseStatusException.getStatusCode().value();
        }
        if (thrown != null) {
            return 500;
        }
        if (result instanceof ResponseEntity<?> responseEntity) {
            return responseEntity.getStatusCode().value();
        }
        return 200;
    }

    private String serializeArguments(Object[] args) {
        var serializableArgs = Arrays.stream(args)
                .filter(arg -> !(arg instanceof ServletRequest))
                .filter(arg -> !(arg instanceof ServletResponse))
                .filter(arg -> !(arg instanceof Authentication))
                .filter(arg -> !(arg instanceof MultipartFile))
                .filter(arg -> !(arg instanceof InputStream))
                .filter(arg -> !(arg instanceof OutputStream))
                .map(this::safeValue)
                .toList();
        return serialize(serializableArgs);
    }

    private Object safeValue(Object value) {
        if (value == null) {
            return null;
        }
        String typeName = value.getClass().getName();
        if (typeName.startsWith("org.springframework.security.")) {
            return value.getClass().getSimpleName();
        }
        return value;
    }

    private String serializeResponse(Object result) {
        if (result instanceof ResponseEntity<?> responseEntity) {
            return serialize(responseEntity.getBody());
        }
        return serialize(result);
    }

    private String serialize(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return truncate(SensitiveValueMasker.mask(objectMapper.writeValueAsString(value)));
        } catch (JacksonException ex) {
            return truncate(SensitiveValueMasker.mask(String.valueOf(value)));
        }
    }

    private static String truncate(String value) {
        if (value == null || value.length() <= MAX_PAYLOAD_LENGTH) {
            return value;
        }
        return value.substring(0, MAX_PAYLOAD_LENGTH);
    }

    private static String decodeQueryString(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }

        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
