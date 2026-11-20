package com.cheil.cheil_be.application.userauth.model;

public record UserMenuPermission(
        String employeeNo,
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
        boolean delete
) {
}
