package com.cheil.cheil_be.application.systempermission.port.in;

import java.util.List;

import com.cheil.cheil_be.application.systempermission.model.RolePermission;
import com.cheil.cheil_be.application.systempermission.model.RolePermissionCommand;
import com.cheil.cheil_be.application.systempermission.model.SystemRole;

public interface SystemPermissionUseCase {
    List<SystemRole> findRoles(Boolean useYn);
    SystemRole findRole(String roleCode);
    SystemRole saveRole(SystemRole role);
    void deleteRole(String roleCode);
    List<RolePermission> findRolePermissions(String roleCode);
    List<RolePermission> saveRolePermissions(String roleCode, List<RolePermissionCommand> items, String lastChangedId);
}
