package com.cheil.cheil_be.adapter.out.persistence.userauth;

interface MenuPermissionProjection {

    String getMenuCode();

    String getMenuName();

    String getParentMenuCode();

    String getMenuPath();

    String getMenuType();

    int getSortSeq();

    boolean isUseYn();

    boolean isVisibleYn();

    boolean isReadYn();

    boolean isCreateYn();

    boolean isUpdateYn();

    boolean isDeleteYn();
}
