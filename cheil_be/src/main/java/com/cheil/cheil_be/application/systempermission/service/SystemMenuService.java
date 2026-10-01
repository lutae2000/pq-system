package com.cheil.cheil_be.application.systempermission.service;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.systempermission.exception.SystemPermissionApplicationException;
import com.cheil.cheil_be.application.systempermission.model.SystemMenu;
import com.cheil.cheil_be.application.systempermission.port.in.SaveSystemMenuCommand;
import com.cheil.cheil_be.application.systempermission.port.in.SystemMenuUseCase;
import com.cheil.cheil_be.application.systempermission.port.out.SystemMenuRepository;

/** 메뉴 입력값 검증과 메뉴 유스케이스 흐름만 조정하며 저장 기술은 출력 포트에 위임한다. */
@Service
@RequiredArgsConstructor
public class SystemMenuService implements SystemMenuUseCase {

    private final SystemMenuRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<SystemMenu> findMenus() {
        return repository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public SystemMenu findMenu(String menuCode) {
        String normalizedCode = requiredText(menuCode, "menuCode");
        return repository.findByCode(normalizedCode)
                .orElseThrow(() -> notFound("메뉴를 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public SystemMenu saveMenu(SaveSystemMenuCommand command) {
        if (command == null) {
            throw badRequest("메뉴 요청 본문이 필요합니다.");
        }

        String menuCode = requiredText(command.menuCode(), "menuCode");
        String menuName = requiredText(command.menuName(), "menuName");
        String menuType = requiredText(command.menuType(), "menuType");

        // 공백만 입력된 선택 필드는 null로 통일해 저장 어댑터와 조회 결과의 의미를 일관되게 한다.
        return repository.save(new SaveSystemMenuCommand(
                menuCode,
                menuName,
                trimToNull(command.parentMenuCode()),
                trimToNull(command.menuPath()),
                menuType,
                command.sortSeq(),
                command.useYn(),
                command.visibleYn(),
                trimToNull(command.description())));
    }

    @Override
    @Transactional
    public void deleteMenu(String menuCode) {
        String normalizedCode = requiredText(menuCode, "menuCode");
        if (repository.findByCode(normalizedCode).isEmpty()) {
            throw notFound("메뉴를 찾을 수 없습니다.");
        }
        repository.deleteByCode(normalizedCode);
    }

    private String requiredText(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            throw badRequest(fieldName + "은(는) 필수입니다.");
        }
        return value.trim();
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private SystemPermissionApplicationException badRequest(String message) {
        return new SystemPermissionApplicationException(SystemPermissionApplicationException.Type.BAD_REQUEST, message);
    }

    private SystemPermissionApplicationException notFound(String message) {
        return new SystemPermissionApplicationException(SystemPermissionApplicationException.Type.NOT_FOUND, message);
    }
}
