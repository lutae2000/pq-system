package com.cheil.cheil_be.config.security;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.cheil.cheil_be.application.apilog.port.out.ApiCallLogRecorder;
import com.cheil.cheil_be.common.logging.SensitiveValueMasker;
import com.cheil.cheil_be.common.security.SecurityHeaders;
import com.cheil.cheil_be.common.security.ServiceAuthentication;
import com.cheil.cheil_be.common.security.ServicePrincipal;
import com.cheil.cheil_be.common.web.ClientIpResolver;
import com.cheil.cheil_be.common.web.ApiErrorResponse;
import com.cheil.cheil_be.domain.apilog.ApiCallLogRecord;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
public class ServiceHeaderAuthenticationFilter extends OncePerRequestFilter {

    private static final String UNAUTHORIZED_MESSAGE = "유효한 x-service-id와 x-api-key 헤더가 필요합니다.";
    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    private final ServiceCredentialRegistry credentialRegistry;
    private final AppSecurityProperties appSecurityProperties;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final ObjectProvider<ApiCallLogRecorder> apiCallLogRecorderProvider;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || isPublicFileDownload(request, path)
                || appSecurityProperties.filter().excludedPaths().stream().anyMatch(pattern -> PATH_MATCHER.match(pattern, path));
    }

    private static boolean isPublicFileDownload(HttpServletRequest request, String path) {
        return "GET".equalsIgnoreCase(request.getMethod()) && PATH_MATCHER.match("/files/**", path);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        long startedAt = System.nanoTime();
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String serviceId = request.getHeader(SecurityHeaders.SERVICE_ID);
        String apiKey = request.getHeader(SecurityHeaders.API_KEY);

        if (ServicePrincipal.SERVER_SERVICE_ID.equals(serviceId)) {
            SecurityContextHolder.getContext().setAuthentication(new ServiceAuthentication(new ServicePrincipal(serviceId)));
            filterChain.doFilter(request, response);
            return;
        }

        if (!StringUtils.hasText(serviceId) || !StringUtils.hasText(apiKey)) {
            SecurityContextHolder.clearContext();
            String responseBody = writeUnauthorized(response, request.getRequestURI());
            recordUnauthorized(request, serviceId, responseBody, startedAt);
            return;
        }

        var integration = credentialRegistry.authenticate(serviceId, apiKey);

        if (integration.isEmpty()) {
            SecurityContextHolder.clearContext();
            String responseBody = writeUnauthorized(response, request.getRequestURI());
            recordUnauthorized(request, serviceId, responseBody, startedAt);
            return;
        }

        SecurityContextHolder.getContext().setAuthentication(
                new ServiceAuthentication(new ServicePrincipal(integration.get().serviceId()))
        );
        filterChain.doFilter(request, response);
    }

    private String writeUnauthorized(HttpServletResponse response, String path) throws IOException {
        var body = new ApiErrorResponse(
                Instant.now(clock),
                HttpServletResponse.SC_UNAUTHORIZED,
                "Unauthorized",
                UNAUTHORIZED_MESSAGE,
                path
        );
        String responseBody = objectMapper.writeValueAsString(body);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(responseBody);
        return responseBody;
    }

    private void recordUnauthorized(
            HttpServletRequest request,
            String serviceId,
            String responseBody,
            long startedAt
    ) {
        ApiCallLogRecorder recorder = apiCallLogRecorderProvider.getIfAvailable();
        if (recorder == null) {
            return;
        }

        recorder.record(new ApiCallLogRecord(
                UUID.randomUUID(),
                Instant.now(clock),
                request.getMethod(),
                request.getRequestURI(),
                request.getQueryString(),
                "ServiceHeaderAuthenticationFilter",
                serviceId,
                header(request, SecurityHeaders.LOGIN_ID),
                header(request, SecurityHeaders.PROGRAM_CODE),
                ClientIpResolver.resolve(request),
                null,
                SensitiveValueMasker.mask(responseBody),
                HttpServletResponse.SC_UNAUTHORIZED,
                false,
                UNAUTHORIZED_MESSAGE,
                Duration.ofNanos(System.nanoTime() - startedAt).toMillis()
        ));
    }

    private static String header(HttpServletRequest request, String name) {
        String value = request.getHeader(name);
        return value == null || value.isBlank() ? null : value;
    }

}
