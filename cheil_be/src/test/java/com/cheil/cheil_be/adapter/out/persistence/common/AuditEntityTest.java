package com.cheil.cheil_be.adapter.out.persistence.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.cheil.cheil_be.common.security.SecurityHeaders;
import com.cheil.cheil_be.common.security.ServiceAuthentication;
import com.cheil.cheil_be.common.security.ServicePrincipal;

class AuditEntityTest {

    @AfterEach
    void cleanup() {
        RequestContextHolder.resetRequestAttributes();
        SecurityContextHolder.clearContext();
    }

    @Test
    void onCreateUsesLoginIdHeaderAsAuditActor() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/menus");
        request.addHeader(SecurityHeaders.LOGIN_ID, "user-123");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        TestAuditEntity entity = new TestAuditEntity();
        entity.create();

        assertThat(entity.createdId).isEqualTo("user-123");
        assertThat(entity.lastChangedId).isEqualTo("user-123");
        assertThat(entity.createdAt).isNotNull();
        assertThat(entity.lastChangedAt).isNotNull();
    }

    @Test
    void onUpdateFallsBackToServicePrincipalWhenLoginIdHeaderMissing() {
        SecurityContextHolder.getContext().setAuthentication(
                new ServiceAuthentication(new ServicePrincipal("application"))
        );

        TestAuditEntity entity = new TestAuditEntity();
        entity.createdId = "existing-user";
        entity.createdAt = Instant.parse("2026-06-18T00:00:00Z");

        entity.update();

        assertThat(entity.createdId).isEqualTo("existing-user");
        assertThat(entity.lastChangedId).isEqualTo("application");
        assertThat(entity.lastChangedAt).isNotNull();
    }

    private static final class TestAuditEntity extends AuditEntity {

        void create() {
            onCreate();
        }

        void update() {
            onUpdate();
        }
    }
}
