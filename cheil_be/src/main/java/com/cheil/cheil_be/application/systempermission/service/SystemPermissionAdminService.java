package com.cheil.cheil_be.application.systempermission.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.adapter.out.persistence.systempermission.JpaSystemMenuRepository;
import com.cheil.cheil_be.adapter.out.persistence.systempermission.JpaRolePermissionRepository;
import com.cheil.cheil_be.adapter.out.persistence.systempermission.JpaSystemRoleRepository;
import com.cheil.cheil_be.adapter.out.persistence.systempermission.SystemMenuEntity;
import com.cheil.cheil_be.adapter.out.persistence.systempermission.SystemRoleEntity;
import com.cheil.cheil_be.adapter.out.persistence.systempermission.RolePermissionEntity;
import com.cheil.cheil_be.adapter.out.persistence.systempermission.RolePermissionId;
import com.cheil.cheil_be.common.security.AuditActorResolver;

@Service
@Transactional
@RequiredArgsConstructor
public class SystemPermissionAdminService {

    private final JpaSystemMenuRepository systemMenuRepository;
    private final JpaSystemRoleRepository systemRoleRepository;
    private final JpaRolePermissionRepository rolePermissionRepository;

    @Transactional(readOnly = true)
    public List<SystemMenuEntity> findMenus() {
        return systemMenuRepository.findAllByOrderBySortSeqAscMenuCodeAsc();
    }

    @Transactional(readOnly = true)
    public SystemMenuEntity findMenu(String menuCode) {
        requireText(menuCode, "menuCode");
        return systemMenuRepository.findById(menuCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "메뉴를 찾을 수 없습니다."));
    }

    public SystemMenuEntity saveMenu(SystemMenuEntity request) {
        requireText(request.getMenuCode(), "menuCode");
        requireText(request.getMenuName(), "menuName");
        requireText(request.getMenuType(), "menuType");

        return systemMenuRepository.findById(request.getMenuCode())
                .map(existing -> {
                    existing.setMenuName(request.getMenuName().trim());
                    existing.setParentMenuCode(trimToNull(request.getParentMenuCode()));
                    existing.setMenuPath(trimToNull(request.getMenuPath()));
                    existing.setMenuType(request.getMenuType().trim());
                    existing.setSortSeq(request.getSortSeq());
                    existing.setUseYn(request.isUseYn());
                    existing.setVisibleYn(request.isVisibleYn());
                    existing.setDescription(trimToNull(request.getDescription()));
                    return existing;
                })
                .orElseGet(() -> systemMenuRepository.save(request));
    }

    public void deleteMenu(String menuCode) {
        requireText(menuCode, "menuCode");
        if (!systemMenuRepository.existsById(menuCode)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "메뉴를 찾을 수 없습니다.");
        }
        systemMenuRepository.deleteById(menuCode);
    }

    @Transactional(readOnly = true)
    public List<SystemRoleEntity> findRoles(Boolean useYn) {
        if (useYn == null) {
            return systemRoleRepository.findAllByOrderBySortSeqAscRoleCodeAsc();
        }

        return systemRoleRepository.findAllByUseYnOrderBySortSeqAscRoleCodeAsc(useYn);
    }

    @Transactional(readOnly = true)
    public SystemRoleEntity findRole(String roleCode) {
        requireText(roleCode, "roleCode");
        return systemRoleRepository.findById(roleCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "역할을 찾을 수 없습니다."));
    }

    public SystemRoleEntity saveRole(SystemRoleEntity request) {
        requireText(request.getRoleCode(), "roleCode");
        requireText(request.getRoleName(), "roleName");

        return systemRoleRepository.findById(request.getRoleCode())
                .map(existing -> {
                    existing.setRoleName(request.getRoleName().trim());
                    existing.setUseYn(request.isUseYn());
                    existing.setDescription(trimToNull(request.getDescription()));
                    existing.setSortSeq(request.getSortSeq());
                    return existing;
                })
                .orElseGet(() -> systemRoleRepository.save(request));
    }

    public void deleteRole(String roleCode) {
        requireText(roleCode, "roleCode");
        if (!systemRoleRepository.existsById(roleCode)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "역할을 찾을 수 없습니다.");
        }
        systemRoleRepository.deleteById(roleCode);
    }

    @Transactional(readOnly = true)
    public List<RolePermissionView> findRolePermissions(String roleCode) {
        requireText(roleCode, "roleCode");
        findRole(roleCode);

        List<SystemMenuEntity> menus = findMenus();
        Map<String, RolePermissionEntity> permissionByMenu = rolePermissionRepository
                .findAllByIdRoleCodeOrderByIdMenuCodeAsc(roleCode)
                .stream()
                .collect(Collectors.toMap(item -> item.getId().getMenuCode(), item -> item));

        List<RolePermissionView> views = new ArrayList<>();
        for (SystemMenuEntity menu : menus) {
            RolePermissionEntity permission = permissionByMenu.get(menu.getMenuCode());
            views.add(new RolePermissionView(
                    roleCode,
                    menu.getMenuCode(),
                    menu.getMenuName(),
                    menu.getParentMenuCode(),
                    menu.getMenuPath(),
                    menu.getMenuType(),
                    menu.getSortSeq(),
                    menu.isUseYn(),
                    menu.isVisibleYn(),
                    menu.getDescription(),
                    permission != null && permission.isReadYn(),
                    permission != null && permission.isCreateYn(),
                    permission != null && permission.isUpdateYn(),
                    permission != null && permission.isDeleteYn(),
                    permission != null ? permission.getCreatedAt() : null,
                    permission != null ? permission.getCreatedId() : null,
                    permission != null ? permission.getLastChangedAt() : null,
                    permission != null ? permission.getLastChangedId() : null
            ));
        }

        return views.stream()
                .sorted(Comparator.comparingInt(RolePermissionView::sortSeq).thenComparing(RolePermissionView::menuCode))
                .toList();
    }

    public List<RolePermissionView> saveRolePermissions(String roleCode, List<RolePermissionUpsertItem> items, String lastChangedId) {
        requireText(roleCode, "roleCode");
        findRole(roleCode);

        String actor = AuditActorResolver.resolve(trimToNull(lastChangedId));
        Instant now = Instant.now();

        for (RolePermissionUpsertItem item : items) {
            if (!StringUtils.hasText(item.menuCode())) {
                continue;
            }
            String menuCode = item.menuCode().trim();
            RolePermissionId id = new RolePermissionId(roleCode, menuCode);
            RolePermissionEntity entity = rolePermissionRepository.findById(id)
                    .orElseGet(() -> RolePermissionEntity.builder()
                            .id(id)
                            .createdAt(now)
                            .createdId(actor)
                            .build());

            if (entity.getCreatedAt() == null) {
                entity.setCreatedAt(now);
            }
            if (!StringUtils.hasText(entity.getCreatedId())) {
                entity.setCreatedId(actor);
            }

            entity.setReadYn(item.read());
            entity.setCreateYn(item.create());
            entity.setUpdateYn(item.update());
            entity.setDeleteYn(item.delete());
            entity.setLastChangedAt(now);
            entity.setLastChangedId(actor);
            rolePermissionRepository.save(entity);
        }

        return findRolePermissions(roleCode);
    }

    private static void requireText(String value, String field) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + "는 필수입니다.");
        }
    }

    private static String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    public record RolePermissionUpsertItem(
            String menuCode,
            boolean read,
            boolean create,
            boolean update,
            boolean delete
    ) {
    }

    public record RolePermissionView(
            String roleCode,
            String menuCode,
            String menuName,
            String parentMenuCode,
            String menuPath,
            String menuType,
            int sortSeq,
            boolean useYn,
            boolean visibleYn,
            String description,
            boolean read,
            boolean create,
            boolean update,
            boolean delete,
            Instant createdAt,
            String createdId,
            Instant lastChangedAt,
            String lastChangedId
    ) {
    }
}
