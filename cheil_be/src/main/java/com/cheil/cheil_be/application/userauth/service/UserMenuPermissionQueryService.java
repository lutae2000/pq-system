package com.cheil.cheil_be.application.userauth.service;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.userauth.port.in.MenuPermissionQueryUseCase;
import com.cheil.cheil_be.application.userauth.port.in.MenuPermissionResult;
import com.cheil.cheil_be.application.userauth.port.out.MenuPermissionRepository;
import com.cheil.cheil_be.application.userauth.port.out.UserAccountRepository;
import com.cheil.cheil_be.domain.userauth.UserAccount;

@Service
@RequiredArgsConstructor
public class UserMenuPermissionQueryService implements MenuPermissionQueryUseCase {

    private final UserAccountRepository userAccountRepository;
    private final MenuPermissionRepository menuPermissionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MenuPermissionResult> findEffectivePermissions(String loginId) {
        UserAccount userAccount = userAccountRepository.findByLoginId(loginId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found."));

        return menuPermissionRepository.findEffectivePermissions(userAccount.loginId());
    }
}
