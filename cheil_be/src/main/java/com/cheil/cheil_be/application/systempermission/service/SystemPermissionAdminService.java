package com.cheil.cheil_be.application.systempermission.service;

import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.systempermission.model.RolePermission;
import com.cheil.cheil_be.application.systempermission.model.RolePermissionCommand;
import com.cheil.cheil_be.application.systempermission.model.SystemRole;
import com.cheil.cheil_be.application.systempermission.port.in.SystemPermissionUseCase;
import com.cheil.cheil_be.application.systempermission.port.out.SystemPermissionRepository;

@Service
@Transactional
@RequiredArgsConstructor
public class SystemPermissionAdminService implements SystemPermissionUseCase {

    private final SystemPermissionRepository repository;
    private final CurrentActorPort currentActorPort;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<SystemRole> findRoles(Boolean useYn) {
        return repository.findRoles(useYn);
    }

    @Override
    @Transactional(readOnly = true)
    public SystemRole findRole(String roleCode) {
        String code = requiredText(roleCode, "roleCode");
        return repository.findRole(code)
                .orElseThrow(() -> ApplicationException.notFound("역할을 찾을 수 없습니다."));
    }

    @Override
    public SystemRole saveRole(SystemRole role) {
        if (role == null) {
            throw ApplicationException.badRequest("role is required");
        }
        return repository.saveRole(new SystemRole(
                requiredText(role.roleCode(), "roleCode"),
                requiredText(role.roleName(), "roleName"),
                role.useYn(),
                role.sortSeq(),
                trimToNull(role.description())
        ));
    }

    @Override
    public void deleteRole(String roleCode) {
        repository.deleteRole(findRole(roleCode).roleCode());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RolePermission> findRolePermissions(String roleCode) {
        String code = findRole(roleCode).roleCode();
        return repository.findRolePermissions(code);
    }

    @Override
    public List<RolePermission> saveRolePermissions(
            String roleCode,
            List<RolePermissionCommand> items,
            String lastChangedId
    ) {
        String code = findRole(roleCode).roleCode();
        if (items == null) {
            throw ApplicationException.badRequest("permission items are required");
        }
        List<RolePermissionCommand> normalized = items.stream()
                .filter(item -> item != null && item.menuCode() != null && !item.menuCode().isBlank())
                .map(item -> new RolePermissionCommand(item.menuCode().trim(), item.read(), item.create(), item.update(), item.delete()))
                .toList();
        String actor = trimToNull(lastChangedId);
        repository.saveRolePermissions(code, normalized,
                actor == null ? currentActorPort.currentActor() : actor, Instant.now(clock));
        return repository.findRolePermissions(code);
    }
}
