package com.cheil.cheil_be.common.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

class AuditActorResolverTest {

    @AfterEach
    void clearRequest() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void usesValidatedEmployeeNumberInsteadOfLoginIdHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(SecurityHeaders.LOGIN_ID, "login-id");
        request.setAttribute("employeeNo", "150801");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        assertThat(AuditActorResolver.resolve()).isEqualTo("150801");
    }
}
