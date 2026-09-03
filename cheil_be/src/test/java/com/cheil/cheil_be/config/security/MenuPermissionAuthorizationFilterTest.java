package com.cheil.cheil_be.config.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import jakarta.servlet.FilterChain;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import com.cheil.cheil_be.application.userauth.port.in.MenuPermissionQueryUseCase;
import tools.jackson.databind.ObjectMapper;

class MenuPermissionAuthorizationFilterTest {

    private static final AppSecurityProperties PROPERTIES = new AppSecurityProperties(
            new AppSecurityProperties.Token("test", "0123456789abcdef0123456789abcdef", Duration.ofHours(1)),
            null,
            Map.of(),
            new AppSecurityProperties.Filter(
                    List.of(), List.of(), List.of("/pq/bid-notice/*", "/auth/users", "/file-attachments")),
            null);

    @Test
    void allowsAuthenticatedReadForDashboardBidNoticeDetail() throws Exception {
        MenuPermissionQueryUseCase permissions = mock(MenuPermissionQueryUseCase.class);
        FilterChain chain = mock(FilterChain.class);
        var filter = new MenuPermissionAuthorizationFilter(permissions, PROPERTIES, new ObjectMapper(), Clock.systemUTC());
        var request = request("GET", "/api/pq/bid-notice/20261072");
        var response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verifyNoInteractions(permissions);
    }

    @Test
    void allowsAuthenticatedReadForUserReferenceList() throws Exception {
        FilterChain chain = mock(FilterChain.class);
        var request = request("GET", "/api/auth/users");
        var response = new MockHttpServletResponse();

        filter().doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(response.getStatus()).isEqualTo(HttpStatus.OK.value());
    }

    @Test
    void allowsAuthenticatedReadForFileAttachments() throws Exception {
        FilterChain chain = mock(FilterChain.class);
        var request = request("GET", "/api/file-attachments");
        request.setParameter("ownerId", "20261072");
        request.setParameter("ownerType", "BID_NOTICE");
        var response = new MockHttpServletResponse();

        filter().doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(response.getStatus()).isEqualTo(HttpStatus.OK.value());
    }

    @Test
    void stillRequiresMenuPermissionForBidNoticeMutation() throws Exception {
        MenuPermissionQueryUseCase permissions = mock(MenuPermissionQueryUseCase.class);
        FilterChain chain = mock(FilterChain.class);
        var request = request("POST", "/api/pq/bid-notice/20261072");
        var response = new MockHttpServletResponse();

        new MenuPermissionAuthorizationFilter(permissions, PROPERTIES, new ObjectMapper(), Clock.systemUTC())
                .doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
        verifyNoInteractions(chain);
    }

    private static MenuPermissionAuthorizationFilter filter() {
        return new MenuPermissionAuthorizationFilter(
                mock(MenuPermissionQueryUseCase.class), PROPERTIES, new ObjectMapper(), Clock.systemUTC());
    }

    private static MockHttpServletRequest request(String method, String uri) {
        var request = new MockHttpServletRequest(method, uri);
        request.setAttribute("loginId", "stleekm");
        return request;
    }
}
