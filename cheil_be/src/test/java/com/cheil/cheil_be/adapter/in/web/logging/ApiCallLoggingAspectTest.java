package com.cheil.cheil_be.adapter.in.web.logging;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import io.micrometer.observation.ObservationRegistry;
import io.micrometer.tracing.Tracer;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.auth.TokenIssueResponse;
import com.cheil.cheil_be.common.security.ServiceAuthentication;
import com.cheil.cheil_be.common.security.ServicePrincipal;
import com.cheil.cheil_be.domain.apilog.ApiCallLogRecord;

import tools.jackson.databind.ObjectMapper;

class ApiCallLoggingAspectTest {

    private final List<ApiCallLogRecord> records = new ArrayList<>();
    private final MockHttpServletRequest request = new MockHttpServletRequest("POST", "/token");
    private final ApiCallLoggingAspect aspect = new ApiCallLoggingAspect(
            records::add,
            new ObjectMapper(),
            new SingleObjectProvider<>(request),
            new SingleObjectProvider<ObservationRegistry>(null),
            new SingleObjectProvider<Tracer>(null),
            Clock.fixed(Instant.parse("2026-06-18T00:00:00Z"), ZoneOffset.UTC)
    );

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void recordsRequestAndMaskedResponsePayload() throws Throwable {
        SecurityContextHolder.getContext().setAuthentication(new ServiceAuthentication(new ServicePrincipal("application")));
        request.setQueryString("keyword=%EB%B6%80%EC%84%9C&page=0");
        request.addHeader("X-Forwarded-For", "10.0.0.1, 10.0.0.2");

        ProceedingJoinPoint joinPoint = joinPointReturning(ResponseEntity.status(HttpStatus.CREATED)
                .body(new TokenIssueResponse(
                        "plain-token-value",
                        "Bearer",
                        1800,
                        Instant.parse("2026-06-18T00:30:00Z"),
                        "application"
                )));

        Object result = aspect.recordApiCall(joinPoint);

        assertThat(result).isInstanceOf(ResponseEntity.class);
        assertThat(records).hasSize(1);
        ApiCallLogRecord record = records.getFirst();
        assertThat(record.httpMethod()).isEqualTo("POST");
        assertThat(record.requestUri()).isEqualTo("/token");
        assertThat(record.queryString()).isEqualTo("keyword=\uBD80\uC11C&page=0");
        assertThat(record.serviceId()).isEqualTo("application");
        assertThat(record.loginId()).isNull();
        assertThat(record.programCode()).isNull();
        assertThat(record.clientIp()).isEqualTo("10.0.0.1");
        assertThat(record.statusCode()).isEqualTo(201);
        assertThat(record.success()).isTrue();
        assertThat(record.responsePayload())
                .contains("\"accessToken\":\"***\"")
                .contains("\"tokenType\":\"Bearer\"");
    }

    @Test
    void recordsExceptionAsFailure() throws Throwable {
        SecurityContextHolder.getContext().setAuthentication(new ServiceAuthentication(new ServicePrincipal("application")));
        ProceedingJoinPoint joinPoint = joinPointThrowing(new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid"));

        assertThatThrownBy(() -> aspect.recordApiCall(joinPoint))
                .isInstanceOf(ResponseStatusException.class);

        assertThat(records).hasSize(1);
        ApiCallLogRecord record = records.getFirst();
        assertThat(record.statusCode()).isEqualTo(400);
        assertThat(record.success()).isFalse();
        assertThat(record.errorMessage()).contains("invalid");
    }

    private ProceedingJoinPoint joinPointReturning(Object result) throws Throwable {
        ProceedingJoinPoint joinPoint = baseJoinPoint();
        when(joinPoint.proceed()).thenReturn(result);
        return joinPoint;
    }

    private ProceedingJoinPoint joinPointThrowing(Throwable throwable) throws Throwable {
        ProceedingJoinPoint joinPoint = baseJoinPoint();
        when(joinPoint.proceed()).thenThrow(throwable);
        return joinPoint;
    }

    private ProceedingJoinPoint baseJoinPoint() {
        ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);
        Signature signature = mock(Signature.class);
        when(signature.toShortString()).thenReturn("AuthTokenController.issue(..)");
        when(joinPoint.getSignature()).thenReturn(signature);
        when(joinPoint.getArgs()).thenReturn(new Object[] { "request-parameter" });
        return joinPoint;
    }

    private record SingleObjectProvider<T>(T value) implements ObjectProvider<T> {

        @Override
        public T getObject(Object... args) {
            return value;
        }

        @Override
        public T getIfAvailable() {
            return value;
        }

        @Override
        public T getIfUnique() {
            return value;
        }

        @Override
        public T getObject() {
            return value;
        }
    }
}
