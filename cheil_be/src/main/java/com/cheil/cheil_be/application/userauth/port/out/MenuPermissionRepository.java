package com.cheil.cheil_be.application.userauth.port.out;

import java.util.List;

import com.cheil.cheil_be.application.userauth.port.in.MenuPermissionResult;

public interface MenuPermissionRepository {

    List<MenuPermissionResult> findEffectivePermissions(String loginId);
}
