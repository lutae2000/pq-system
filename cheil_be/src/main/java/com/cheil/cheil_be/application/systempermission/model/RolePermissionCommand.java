package com.cheil.cheil_be.application.systempermission.model;

public record RolePermissionCommand(
        String menuCode,
        boolean read,
        boolean create,
        boolean update,
        boolean delete
) {
}
