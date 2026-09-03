package com.cheil.cheil_be.application.userauth.service;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.userauth.port.in.MenuPermissionQueryUseCase;
import com.cheil.cheil_be.application.userauth.port.in.MenuPermissionResult;
import com.cheil.cheil_be.application.userauth.port.out.MenuPermissionRepository;

@Service
@RequiredArgsConstructor
public class UserMenuPermissionQueryService implements MenuPermissionQueryUseCase {

    private final MenuPermissionRepository menuPermissionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MenuPermissionResult> findEffectivePermissions(String loginId) {
        // fn_user_menu_permissions가 auth_users의 활성 계정 여부와
        // 역할/사용자별 메뉴 권한을 한 번에 계산하므로 사용자 계정을 선조회하지 않는다.
        return menuPermissionRepository.findEffectivePermissions(loginId);
    }
}
