package com.cheil.cheil_be.adapter.out.persistence.systempermission;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.systempermission.model.RolePermission;
import com.cheil.cheil_be.application.systempermission.model.RolePermissionCommand;
import com.cheil.cheil_be.application.systempermission.model.SystemRole;
import com.cheil.cheil_be.application.systempermission.port.out.SystemPermissionRepository;

@Repository
@RequiredArgsConstructor
public class SystemPermissionRepositoryAdapter implements SystemPermissionRepository {

    private final JpaSystemMenuRepository menuRepository;
    private final JpaSystemRoleRepository roleRepository;
    private final JpaRolePermissionRepository permissionRepository;

    @Override
    public List<SystemRole> findRoles(Boolean useYn) {
        List<SystemRoleEntity> entities = useYn == null
                ? roleRepository.findAllByOrderBySortSeqAscRoleCodeAsc()
                : roleRepository.findAllByUseYnOrderBySortSeqAscRoleCodeAsc(useYn);
        return entities.stream().map(this::toRole).toList();
    }

    @Override
    public Optional<SystemRole> findRole(String roleCode) {
        return roleRepository.findById(roleCode).map(this::toRole);
    }

    @Override
    public SystemRole saveRole(SystemRole role) {
        SystemRoleEntity entity = roleRepository.findById(role.roleCode())
                .orElseGet(() -> SystemRoleEntity.builder().roleCode(role.roleCode()).build());
        entity.setRoleName(role.roleName());
        entity.setUseYn(role.useYn());
        entity.setSortSeq(role.sortSeq());
        entity.setDescription(role.description());
        return toRole(roleRepository.save(entity));
    }

    @Override
    public void deleteRole(String roleCode) {
        roleRepository.deleteById(roleCode);
    }

    @Override
    public List<RolePermission> findRolePermissions(String roleCode) {
        Map<String, RolePermissionEntity> permissions = permissionRepository
                .findAllByIdRoleCodeOrderByIdMenuCodeAsc(roleCode).stream()
                .collect(Collectors.toMap(item -> item.getId().getMenuCode(), item -> item));
        return menuRepository.findAllByOrderBySortSeqAscMenuCodeAsc().stream()
                .map(menu -> toPermission(roleCode, menu, permissions.get(menu.getMenuCode())))
                .toList();
    }

    @Override
    public void saveRolePermissions(
            String roleCode,
            List<RolePermissionCommand> items,
            String actor,
            Instant changedAt
    ) {
        for (RolePermissionCommand item : items) {
            RolePermissionId id = new RolePermissionId(roleCode, item.menuCode());
            RolePermissionEntity entity = permissionRepository.findById(id)
                    .orElseGet(() -> RolePermissionEntity.builder()
                            .id(id)
                            .createdAt(changedAt)
                            .createdId(actor)
                            .build());
            entity.setReadYn(item.read());
            entity.setCreateYn(item.create());
            entity.setUpdateYn(item.update());
            entity.setDeleteYn(item.delete());
            entity.setLastChangedAt(changedAt);
            entity.setLastChangedId(actor);
            permissionRepository.save(entity);
        }
    }

    private SystemRole toRole(SystemRoleEntity entity) {
        return new SystemRole(entity.getRoleCode(), entity.getRoleName(), entity.isUseYn(),
                entity.getSortSeq(), entity.getDescription());
    }

    private RolePermission toPermission(String roleCode, SystemMenuEntity menu, RolePermissionEntity permission) {
        return new RolePermission(
                roleCode, menu.getMenuCode(), menu.getMenuName(), menu.getParentMenuCode(), menu.getMenuPath(),
                menu.getMenuType(), menu.getSortSeq(), menu.isUseYn(), menu.isVisibleYn(), menu.getDescription(),
                permission != null && permission.isReadYn(), permission != null && permission.isCreateYn(),
                permission != null && permission.isUpdateYn(), permission != null && permission.isDeleteYn(),
                permission == null ? null : permission.getCreatedAt(),
                permission == null ? null : permission.getCreatedId(),
                permission == null ? null : permission.getLastChangedAt(),
                permission == null ? null : permission.getLastChangedId()
        );
    }
}
