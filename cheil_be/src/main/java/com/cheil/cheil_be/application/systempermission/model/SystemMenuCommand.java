package com.cheil.cheil_be.application.systempermission.model;

public record SystemMenuCommand(
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
}
