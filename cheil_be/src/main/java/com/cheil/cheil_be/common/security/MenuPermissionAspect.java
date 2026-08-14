package com.cheil.cheil_be.common.security;

import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
@RequiredArgsConstructor
public class MenuPermissionAspect {

    private final MenuPermissionGuard menuPermissionGuard;

    @Around("@within(menuProtected)")
    public Object requireMenuPermission(ProceedingJoinPoint joinPoint, MenuProtected menuProtected) throws Throwable {
        menuPermissionGuard.require(menuProtected.menuCode(), actionFromRequest());
        return joinPoint.proceed();
    }

    private static MenuPermissionAction actionFromRequest() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (!(attributes instanceof ServletRequestAttributes servletRequestAttributes)) {
            throw forbidden();
        }

        HttpServletRequest request = servletRequestAttributes.getRequest();
        String method = request.getMethod();
        if ("GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method)) {
            return MenuPermissionAction.READ;
        }
        if ("POST".equalsIgnoreCase(method)) {
            return MenuPermissionAction.CREATE;
        }
        if ("PUT".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method)) {
            return MenuPermissionAction.UPDATE;
        }
        if ("DELETE".equalsIgnoreCase(method)) {
            return MenuPermissionAction.DELETE;
        }
        throw forbidden();
    }

    private static org.springframework.web.server.ResponseStatusException forbidden() {
        return new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "접근 권한이 없습니다.");
    }
}
