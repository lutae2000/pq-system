package com.cheil.cheil_be.adapter.in.web.systempermission;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.adapter.out.persistence.systempermission.SystemMenuEntity;
import com.cheil.cheil_be.adapter.out.persistence.systempermission.SystemRoleEntity;
import com.cheil.cheil_be.application.systempermission.service.SystemPermissionAdminService;

@RestController
@RequestMapping("/system/permissions")
@RequiredArgsConstructor
public class SystemPermissionController {

    private final SystemPermissionAdminService systemPermissionAdminService;

    /**
     * 메뉴 목록을 조회한다.
     */
    @GetMapping("/menus")
    public ResponseEntity<List<SystemMenuResponse>> listMenus() {
        return ResponseEntity.ok(systemPermissionAdminService.findMenus().stream().map(SystemMenuResponse::from).toList());
    }

    /**
     * 메뉴 단건을 조회한다.
     */
    @GetMapping("/menus/{menuCode}")
    public ResponseEntity<SystemMenuResponse> getMenu(@PathVariable String menuCode) {
        return ResponseEntity.ok(SystemMenuResponse.from(systemPermissionAdminService.findMenu(menuCode)));
    }

    /**
     * 메뉴를 신규 저장한다.
     */
    @PostMapping("/menus")
    public ResponseEntity<SystemMenuResponse> createMenu(@RequestBody SystemMenuUpsertRequest request) {
        return ResponseEntity.ok(SystemMenuResponse.from(systemPermissionAdminService.saveMenu(request.toEntity())));
    }

    /**
     * 기존 메뉴를 수정한다.
     */
    @PutMapping("/menus/{menuCode}")
    public ResponseEntity<SystemMenuResponse> updateMenu(
            @PathVariable String menuCode,
            @RequestBody SystemMenuUpsertRequest request
    ) {
        return ResponseEntity.ok(SystemMenuResponse.from(systemPermissionAdminService.saveMenu(request.toEntity(menuCode))));
    }

    /**
     * 메뉴를 삭제한다.
     */
    @DeleteMapping("/menus/{menuCode}")
    public ResponseEntity<Void> deleteMenu(@PathVariable String menuCode) {
        systemPermissionAdminService.deleteMenu(menuCode);
        return ResponseEntity.noContent().build();
    }

    /**
     * 역할 목록을 조회한다.
     */
    @GetMapping("/roles")
    public ResponseEntity<List<SystemRoleResponse>> listRoles(
            @RequestParam(name = "use_yn", required = false) Boolean useYn
    ) {
        return ResponseEntity.ok(systemPermissionAdminService.findRoles(useYn).stream().map(SystemRoleResponse::from).toList());
    }

    /**
     * 역할 단건을 조회한다.
     */
    @GetMapping("/roles/{roleCode}")
    public ResponseEntity<SystemRoleResponse> getRole(@PathVariable String roleCode) {
        return ResponseEntity.ok(SystemRoleResponse.from(systemPermissionAdminService.findRole(roleCode)));
    }

    /**
     * 역할을 신규 저장한다.
     */
    @PostMapping("/roles")
    public ResponseEntity<SystemRoleResponse> createRole(@RequestBody SystemRoleUpsertRequest request) {
        return ResponseEntity.ok(SystemRoleResponse.from(systemPermissionAdminService.saveRole(request.toEntity())));
    }

    /**
     * 기존 역할을 수정한다.
     */
    @PutMapping("/roles/{roleCode}")
    public ResponseEntity<SystemRoleResponse> updateRole(
            @PathVariable String roleCode,
            @RequestBody SystemRoleUpsertRequest request
    ) {
        return ResponseEntity.ok(SystemRoleResponse.from(systemPermissionAdminService.saveRole(request.toEntity(roleCode))));
    }

    /**
     * 역할을 삭제한다.
     */
    @DeleteMapping("/roles/{roleCode}")
    public ResponseEntity<Void> deleteRole(@PathVariable String roleCode) {
        systemPermissionAdminService.deleteRole(roleCode);
        return ResponseEntity.noContent().build();
    }

    /**
     * 역할에 연결된 메뉴 권한을 조회한다.
     */
    @GetMapping("/roles/{roleCode}/menu-permissions")
    public ResponseEntity<List<RoleMenuPermissionResponse>> listRolePermissions(@PathVariable String roleCode) {
        return ResponseEntity.ok(systemPermissionAdminService.findRolePermissions(roleCode).stream()
                .map(RoleMenuPermissionResponse::from)
                .toList());
    }

    /**
     * 역할의 메뉴 권한을 저장한다.
     */
    @PutMapping("/roles/{roleCode}/menu-permissions")
    public ResponseEntity<List<RoleMenuPermissionResponse>> saveRolePermissions(
            @PathVariable String roleCode,
            @RequestBody RoleMenuPermissionUpsertRequest request
    ) {
        return ResponseEntity.ok(systemPermissionAdminService.saveRolePermissions(roleCode, request.items(), request.lastChangedId()).stream()
                .map(RoleMenuPermissionResponse::from)
                .toList());
    }

    public record SystemMenuUpsertRequest(
            String menuCode,
            String menuName,
            String parentMenuCode,
            String menuPath,
            String menuType,
            Integer sortSeq,
            Boolean useYn,
            Boolean visibleYn,
            String description
    ) {
        SystemMenuEntity toEntity() {
            return toEntity(menuCode);
        }

        SystemMenuEntity toEntity(String resolvedMenuCode) {
            return SystemMenuEntity.builder()
                    .menuCode(resolvedMenuCode)
                    .menuName(menuName)
                    .parentMenuCode(parentMenuCode)
                    .menuPath(menuPath)
                    .menuType(menuType)
                    .sortSeq(sortSeq == null ? 0 : sortSeq)
                    .useYn(useYn != null && useYn)
                    .visibleYn(visibleYn == null || visibleYn)
                    .description(description)
                    .build();
        }
    }

    public record SystemMenuResponse(
            String menuCode,
            String menuName,
            String parentMenuCode,
            String menuPath,
            String menuType,
            int sortSeq,
            boolean useYn,
            boolean visibleYn,
            String description
    ) {
        static SystemMenuResponse from(SystemMenuEntity entity) {
            return new SystemMenuResponse(
                    entity.getMenuCode(),
                    entity.getMenuName(),
                    entity.getParentMenuCode(),
                    entity.getMenuPath(),
                    entity.getMenuType(),
                    entity.getSortSeq(),
                    entity.isUseYn(),
                    entity.isVisibleYn(),
                    entity.getDescription()
            );
        }
    }

    public record SystemRoleUpsertRequest(
            String roleCode,
            String roleName,
            Boolean useYn,
            Integer sortSeq,
            String description
    ) {
        SystemRoleEntity toEntity() {
            return toEntity(roleCode);
        }

        SystemRoleEntity toEntity(String resolvedRoleCode) {
            return SystemRoleEntity.builder()
                    .roleCode(resolvedRoleCode)
                    .roleName(roleName)
                    .useYn(useYn != null && useYn)
                    .sortSeq(sortSeq == null ? 0 : sortSeq)
                    .description(description)
                    .build();
        }
    }

    public record SystemRoleResponse(
            String roleCode,
            String roleName,
            boolean useYn,
            int sortSeq,
            String description
    ) {
        static SystemRoleResponse from(SystemRoleEntity entity) {
            return new SystemRoleResponse(
                    entity.getRoleCode(),
                    entity.getRoleName(),
                    entity.isUseYn(),
                    entity.getSortSeq(),
                    entity.getDescription()
            );
        }
    }

    public record RoleMenuPermissionUpsertRequest(
            List<SystemPermissionAdminService.RolePermissionUpsertItem> items,
            String lastChangedId
    ) {
    }

    public record RoleMenuPermissionResponse(
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
            String createdAt,
            String createdId,
            String lastChangedAt,
            String lastChangedId
    ) {
        static RoleMenuPermissionResponse from(SystemPermissionAdminService.RolePermissionView view) {
            return new RoleMenuPermissionResponse(
                    view.roleCode(),
                    view.menuCode(),
                    view.menuName(),
                    view.parentMenuCode(),
                    view.menuPath(),
                    view.menuType(),
                    view.sortSeq(),
                    view.useYn(),
                    view.visibleYn(),
                    view.description(),
                    view.read(),
                    view.create(),
                    view.update(),
                    view.delete(),
                    view.createdAt() == null ? null : view.createdAt().toString(),
                    view.createdId(),
                    view.lastChangedAt() == null ? null : view.lastChangedAt().toString(),
                    view.lastChangedId()
            );
        }
    }
}
