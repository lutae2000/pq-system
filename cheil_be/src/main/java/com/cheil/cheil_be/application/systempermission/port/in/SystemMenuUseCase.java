package com.cheil.cheil_be.application.systempermission.port.in;

import java.util.List;

import com.cheil.cheil_be.application.systempermission.model.SystemMenu;
import com.cheil.cheil_be.application.systempermission.model.SystemMenuCommand;

public interface SystemMenuUseCase {

    List<SystemMenu> findMenus();

    SystemMenu findMenu(String menuCode);

    SystemMenu saveMenu(SystemMenuCommand command);

    void deleteMenu(String menuCode);
}
