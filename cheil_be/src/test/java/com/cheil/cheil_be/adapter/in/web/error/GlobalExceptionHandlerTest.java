package com.cheil.cheil_be.adapter.in.web.error;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import com.cheil.cheil_be.application.common.exception.ApplicationErrorType;
import com.cheil.cheil_be.application.common.exception.ApplicationException;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void mapsCommonApplicationErrorsToHttpStatuses() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/test");

        Map<ApplicationErrorType, HttpStatus> expectedStatuses = Map.of(
                ApplicationErrorType.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                ApplicationErrorType.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                ApplicationErrorType.FORBIDDEN, HttpStatus.FORBIDDEN,
                ApplicationErrorType.CONFLICT, HttpStatus.CONFLICT,
                ApplicationErrorType.NOT_FOUND, HttpStatus.NOT_FOUND
        );

        expectedStatuses.forEach((errorType, expectedStatus) -> {
            var response = handler.handleApplicationException(
                    new ApplicationException(errorType, "message"),
                    request
            );

            assertThat(response.getStatusCode()).isEqualTo(expectedStatus);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().message()).isEqualTo("message");
            assertThat(response.getBody().path()).isEqualTo("/test");
        });
    }
}
