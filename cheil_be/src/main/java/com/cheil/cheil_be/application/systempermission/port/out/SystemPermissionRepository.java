package com.cheil.cheil_be.application.systempermission.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.cheil.cheil_be.application.systempermission.model.RolePermission;
import com.cheil.cheil_be.application.systempermission.model.RolePermissionCommand;
import com.cheil.cheil_be.application.systempermission.model.SystemRole;

public interface SystemPermissionRepository {
    List<SystemRole> findRoles(Boolean useYn);
    Optional<SystemRole> findRole(String roleCode);
    SystemRole saveRole(SystemRole role);
    void deleteRole(String roleCode);
    List<RolePermission> findRolePermissions(String roleCode);
    void saveRolePermissions(String roleCode, List<RolePermissionCommand> items, String actor, Instant changedAt);
}
