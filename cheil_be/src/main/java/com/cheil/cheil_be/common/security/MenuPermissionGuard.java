package com.cheil.cheil_be.common.security;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.userauth.port.in.MenuPermissionQueryUseCase;
import com.cheil.cheil_be.application.userauth.port.in.MenuPermissionResult;

@Service
@RequiredArgsConstructor
public class MenuPermissionGuard {

    private static final String REQUEST_ATTRIBUTE_PREFIX = MenuPermissionGuard.class.getName() + ".permissions.";

    private final MenuPermissionQueryUseCase menuPermissionQueryUseCase;

    public void require(String menuCode, MenuPermissionAction action) {
        MenuPermissionResult permission = findPermission(menuCode);
        if (!has(permission, action)) {
            throw forbidden();
        }
    }

    public boolean has(String menuCode, MenuPermissionAction action) {
        return has(findPermission(menuCode), action);
    }

    private MenuPermissionResult findPermission(String menuCode) {
        String loginId = CurrentLoginIdResolver.resolve().orElseThrow(MenuPermissionGuard::forbidden);
        Map<String, MenuPermissionResult> permissions = currentPermissions(loginId);
        return permissions.get(menuCode);
    }

    private Map<String, MenuPermissionResult> currentPermissions(String loginId) {
        ServletRequestAttributes attributes = currentRequestAttributes();
        if (attributes == null) {
            return toPermissionMap(menuPermissionQueryUseCase.findEffectivePermissions(loginId));
        }

        HttpServletRequest request = attributes.getRequest();
        String attributeKey = REQUEST_ATTRIBUTE_PREFIX + loginId;
        Object cached = request.getAttribute(attributeKey);
        if (cached instanceof Map<?, ?> cachedPermissions) {
            @SuppressWarnings("unchecked")
            Map<String, MenuPermissionResult> typed = (Map<String, MenuPermissionResult>) cachedPermissions;
            return typed;
        }

        Map<String, MenuPermissionResult> permissions = toPermissionMap(menuPermissionQueryUseCase.findEffectivePermissions(loginId));
        request.setAttribute(attributeKey, permissions);
        return permissions;
    }

    private static Map<String, MenuPermissionResult> toPermissionMap(List<MenuPermissionResult> permissions) {
        Map<String, MenuPermissionResult> map = new HashMap<>();
        for (MenuPermissionResult permission : permissions) {
            if (permission != null && permission.menuCode() != null) {
                map.put(permission.menuCode(), permission);
            }
        }
        return map;
    }

    private static boolean has(MenuPermissionResult permission, MenuPermissionAction action) {
        if (permission == null) {
            return false;
        }
        return switch (action) {
            case READ -> permission.readYn();
            case CREATE -> permission.createYn();
            case UPDATE -> permission.updateYn();
            case DELETE -> permission.deleteYn();
        };
    }

    private static ServletRequestAttributes currentRequestAttributes() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (attributes instanceof ServletRequestAttributes servletRequestAttributes) {
            return servletRequestAttributes;
        }
        return null;
    }

    private static ResponseStatusException forbidden() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "접근 권한이 없습니다.");
    }
}
