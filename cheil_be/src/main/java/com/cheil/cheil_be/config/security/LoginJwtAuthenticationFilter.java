package com.cheil.cheil_be.config.security;

import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.nio.charset.StandardCharsets;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.cheil.cheil_be.application.userauth.port.in.ValidateLoginSessionCommand;
import com.cheil.cheil_be.application.userauth.port.in.ValidateLoginSessionUseCase;
import com.cheil.cheil_be.application.userauth.service.LoginAccessTokenService;
import com.cheil.cheil_be.common.web.ApiErrorResponse;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
public class LoginJwtAuthenticationFilter extends OncePerRequestFilter {

    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();
    private static final String UNAUTHORIZED_MESSAGE = "Invalid or expired login token.";

    private final LoginAccessTokenService loginAccessTokenService;
    private final ValidateLoginSessionUseCase validateLoginSessionUseCase;
    private final AppSecurityProperties appSecurityProperties;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || appSecurityProperties.filter().excludedPaths().stream().anyMatch(pattern -> PATH_MATCHER.match(pattern, path))
                || appSecurityProperties.filter().loginExcludedPaths().stream().anyMatch(pattern -> PATH_MATCHER.match(pattern, path));
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (!StringUtils.hasText(authorization)) {
            writeUnauthorized(response, request.getRequestURI());
            return;
        }

        try {
            var token = loginAccessTokenService.parse(authorization);
            validateLoginSessionUseCase.validate(new ValidateLoginSessionCommand(token.loginId(), token.sessionId()));
            request.setAttribute("loginId", token.loginId());
            request.setAttribute("loginSessionId", token.sessionId());
            filterChain.doFilter(request, response);
        } catch (RuntimeException ex) {
            writeUnauthorized(response, request.getRequestURI());
        }
    }

    private void writeUnauthorized(HttpServletResponse response, String path) throws IOException {
        var body = new ApiErrorResponse(
                Instant.now(clock),
                HttpServletResponse.SC_UNAUTHORIZED,
                "Unauthorized",
                UNAUTHORIZED_MESSAGE,
                path
        );
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
