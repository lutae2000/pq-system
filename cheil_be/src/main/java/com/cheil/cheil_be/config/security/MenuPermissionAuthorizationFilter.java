package com.cheil.cheil_be.config.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.cheil.cheil_be.application.userauth.port.in.MenuPermissionQueryUseCase;
import com.cheil.cheil_be.application.userauth.port.in.MenuPermissionResult;
import com.cheil.cheil_be.common.security.SecurityHeaders;
import com.cheil.cheil_be.common.security.ServicePrincipal;
import com.cheil.cheil_be.common.web.ApiErrorResponse;
import tools.jackson.databind.ObjectMapper;

/**
 * 인증된 사용자의 메뉴 권한을 요청 단위로 검증하는 공통 필터입니다.
 *
 * <p>프론트엔드가 전달한 x-program-code는 식별자로만 사용하며, 실제 허용 여부는
 * JWT에서 검증된 loginId와 DB의 실효 메뉴 권한을 대조해 결정합니다. 따라서 브라우저
 * localStorage 또는 요청 헤더의 메뉴 코드를 변경해도 권한 상승으로 이어지지 않습니다.</p>
 *
 * <p>대시보드처럼 특정 메뉴에 귀속되지 않는 API는 application.yaml의
 * authenticated-only-paths에 등록하며, 이 경우 JWT 로그인 여부만 확인합니다.</p>
 *
 * <p>이 필터는 JWT 인증 필터 다음에 실행됩니다. 따라서 여기서는 사용자 계정을 다시
 * 조회해 로그인 여부를 확인하지 않고, 인증 필터가 request attribute에 넣은 loginId로
 * 실효 권한만 조회합니다. 계정 조회를 다시 수행하면 동일 요청에서 auth_users를 중복
 * 조회하게 되고, 사용자 전체 컬럼까지 읽을 수 있으므로 권한 검증 목적에 맞지 않습니다.</p>
 */
@Component
@ConditionalOnBean(MenuPermissionQueryUseCase.class)
@RequiredArgsConstructor
public class MenuPermissionAuthorizationFilter extends OncePerRequestFilter {

    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();
    private static final String FORBIDDEN_MESSAGE = "해당 메뉴에 대한 권한이 없습니다.";

    private final MenuPermissionQueryUseCase menuPermissionQueryUseCase;
    private final AppSecurityProperties appSecurityProperties;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || ServicePrincipal.SERVER_SERVICE_ID.equals(request.getHeader(SecurityHeaders.SERVICE_ID))
                || isConfiguredPath(appSecurityProperties.filter().excludedPaths(), path)
                || isConfiguredPath(appSecurityProperties.filter().loginExcludedPaths(), path);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Object loginIdAttribute = request.getAttribute("loginId");
        if (!(loginIdAttribute instanceof String loginId) || !StringUtils.hasText(loginId)) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        if (isAuthenticatedOnlyRequest(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String menuCode = request.getHeader(SecurityHeaders.PROGRAM_CODE);
        // 요청 헤더의 메뉴 코드는 어떤 권한을 검사할지 지정할 뿐이다.
        // 허용 여부는 DB 함수가 계산한 역할 권한과 사용자별 예외 권한으로 판단한다.
        MenuPermissionResult permission = StringUtils.hasText(menuCode)
                ? menuPermissionQueryUseCase.findEffectivePermissions(loginId).stream()
                .filter(item -> menuCode.trim().equals(item.menuCode()))
                .findFirst()
                .orElse(null)
                : null;

        if (permission == null || !permission.useYn() || !hasPermission(permission, request.getMethod())) {
            // 메뉴가 없거나 비활성화되었거나 HTTP method에 해당하는 권한이 없으면
            // 리소스 핸들러에 진입시키지 않고 즉시 403을 반환한다.
            writeForbidden(response, path);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static boolean isConfiguredPath(java.util.List<String> patterns, String requestPath) {
        String normalizedRequestPath = requestPath.startsWith("/api/") ? requestPath.substring(4) : requestPath;
        return patterns.stream().anyMatch(pattern -> PATH_MATCHER.match(pattern, requestPath)
                || PATH_MATCHER.match(pattern, normalizedRequestPath));
    }

    private boolean isAuthenticatedOnlyPath(String requestPath) {
        String normalizedRequestPath = requestPath.startsWith("/api/") ? requestPath.substring(4) : requestPath;
        return appSecurityProperties.filter().authenticatedOnlyPaths().stream()
                .anyMatch(pattern -> PATH_MATCHER.match(pattern, requestPath)
                        || PATH_MATCHER.match(pattern, normalizedRequestPath));
    }

    private boolean isAuthenticatedOnlyRequest(HttpServletRequest request) {
        return (HttpMethod.GET.matches(request.getMethod()) || HttpMethod.HEAD.matches(request.getMethod()))
                && isAuthenticatedOnlyPath(request.getRequestURI());
    }

    private static boolean hasPermission(MenuPermissionResult permission, String method) {
        if (HttpMethod.GET.matches(method) || HttpMethod.HEAD.matches(method)) {
            return permission.readYn();
        }
        if (HttpMethod.POST.matches(method)) {
            return permission.createYn();
        }
        if (HttpMethod.PUT.matches(method) || HttpMethod.PATCH.matches(method)) {
            return permission.updateYn();
        }
        if (HttpMethod.DELETE.matches(method)) {
            return permission.deleteYn();
        }
        return false;
    }

    private void writeForbidden(HttpServletResponse response, String path) throws IOException {
        var body = new ApiErrorResponse(
                Instant.now(clock),
                HttpServletResponse.SC_FORBIDDEN,
                "Forbidden",
                FORBIDDEN_MESSAGE,
                path
        );
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
