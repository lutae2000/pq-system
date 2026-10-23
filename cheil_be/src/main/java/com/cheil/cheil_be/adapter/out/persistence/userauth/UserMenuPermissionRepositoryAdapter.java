package com.cheil.cheil_be.adapter.out.persistence.userauth;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.adapter.out.persistence.systempermission.JpaSystemMenuRepository;
import com.cheil.cheil_be.adapter.out.persistence.systempermission.SystemMenuEntity;
import com.cheil.cheil_be.application.userauth.model.UserMenuPermission;
import com.cheil.cheil_be.application.userauth.model.UserMenuPermissionCommand;
import com.cheil.cheil_be.application.userauth.port.out.UserMenuPermissionRepository;

@Repository
@RequiredArgsConstructor
public class UserMenuPermissionRepositoryAdapter implements UserMenuPermissionRepository {

    private final JpaSystemMenuRepository menuRepository;
    private final JpaUserMenuPermissionRepository permissionRepository;

    @Override
    public List<UserMenuPermission> findAll(String loginId) {
        Map<String, UserMenuPermissionEntity> permissions = permissionRepository
                .findAllByIdLoginIdOrderByIdMenuCodeAsc(loginId).stream()
                .collect(Collectors.toMap(item -> item.getId().getMenuCode(), item -> item));
        return menuRepository.findAllByOrderBySortSeqAscMenuCodeAsc().stream()
                .map(menu -> toModel(loginId, menu, permissions.get(menu.getMenuCode())))
                .toList();
    }

    @Override
    public void replaceAll(String loginId, List<UserMenuPermissionCommand> items) {
        permissionRepository.deleteByIdLoginId(loginId);
        items.stream()
                .filter(item -> item.read() || item.create() || item.update() || item.delete())
                .map(item -> UserMenuPermissionEntity.builder()
                        .id(new UserMenuPermissionId(loginId, item.menuCode()))
                        .readYn(item.read())
                        .createYn(item.create())
                        .updateYn(item.update())
                        .deleteYn(item.delete())
                        .build())
                .forEach(permissionRepository::save);
    }

    private UserMenuPermission toModel(String loginId, SystemMenuEntity menu, UserMenuPermissionEntity permission) {
        return new UserMenuPermission(
                loginId, menu.getMenuCode(), menu.getMenuName(), menu.getParentMenuCode(), menu.getMenuPath(),
                menu.getMenuType(), menu.getSortSeq(), menu.isUseYn(), menu.isVisibleYn(), menu.getDescription(),
                permission != null && permission.isReadYn(), permission != null && permission.isCreateYn(),
                permission != null && permission.isUpdateYn(), permission != null && permission.isDeleteYn()
        );
    }
}
