package com.cheil.cheil_be.application.userauth.port.in;

public record MenuPermissionResult(
        String menuCode,
        String menuName,
        String parentMenuCode,
        String menuPath,
        String menuType,
        int sortSeq,
        boolean useYn,
        boolean visibleYn,
        boolean readYn,
        boolean createYn,
        boolean updateYn,
        boolean deleteYn
) {
}
