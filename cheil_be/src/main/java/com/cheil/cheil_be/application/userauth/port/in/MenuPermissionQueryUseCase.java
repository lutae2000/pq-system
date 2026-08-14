package com.cheil.cheil_be.application.userauth.port.in;

import java.util.List;

public interface MenuPermissionQueryUseCase {

    List<MenuPermissionResult> findEffectivePermissions(String loginId);
}
