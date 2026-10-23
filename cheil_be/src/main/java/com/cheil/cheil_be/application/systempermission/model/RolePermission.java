package com.cheil.cheil_be.application.systempermission.model;

import java.time.Instant;

public record RolePermission(
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
