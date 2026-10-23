package com.cheil.cheil_be.application.userauth.model;

public record UserMenuPermissionCommand(
        String menuCode,
        boolean read,
        boolean create,
        boolean update,
        boolean delete
) {
}
