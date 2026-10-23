package com.cheil.cheil_be.application.systempermission.port.out;

import java.util.List;
import java.util.Optional;

import com.cheil.cheil_be.application.systempermission.model.SystemMenu;
import com.cheil.cheil_be.application.systempermission.model.SystemMenuCommand;

public interface SystemMenuRepository {

    List<SystemMenu> findAll();

    Optional<SystemMenu> findByCode(String menuCode);

    SystemMenu save(SystemMenuCommand command);

    void deleteByCode(String menuCode);
}
