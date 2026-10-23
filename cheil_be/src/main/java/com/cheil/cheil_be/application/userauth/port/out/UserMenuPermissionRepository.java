package com.cheil.cheil_be.application.userauth.port.out;

import java.util.List;

import com.cheil.cheil_be.application.userauth.model.UserMenuPermission;
import com.cheil.cheil_be.application.userauth.model.UserMenuPermissionCommand;

public interface UserMenuPermissionRepository {
    List<UserMenuPermission> findAll(String loginId);
    void replaceAll(String loginId, List<UserMenuPermissionCommand> items);
}
