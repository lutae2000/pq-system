package com.cheil.cheil_be.application.systempermission.model;

/** 시스템 메뉴 관리 유스케이스에서 사용하는 애플리케이션 모델이다. JPA Entity를 웹 계층에 노출하지 않는다. */
public record SystemMenu(
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
