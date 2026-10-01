package com.cheil.cheil_be.application.systempermission.port.in;

import java.util.List;

import com.cheil.cheil_be.application.systempermission.model.SystemMenu;

public interface SystemMenuUseCase {

    List<SystemMenu> findMenus();

    SystemMenu findMenu(String menuCode);

    SystemMenu saveMenu(SaveSystemMenuCommand command);

    void deleteMenu(String menuCode);
}
