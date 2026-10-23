package com.cheil.cheil_be.application.systempermission.service;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;
import static com.cheil.cheil_be.application.common.exception.ApplicationException.notFound;
import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.systempermission.model.SystemMenu;
import com.cheil.cheil_be.application.systempermission.model.SystemMenuCommand;
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
    public SystemMenu saveMenu(SystemMenuCommand command) {
        if (command == null) {
            throw badRequest("메뉴 요청 본문이 필요합니다.");
        }

        String menuCode = requiredText(command.menuCode(), "menuCode");
        String menuName = requiredText(command.menuName(), "menuName");
        String menuType = requiredText(command.menuType(), "menuType");

        // 공백만 입력된 선택 필드는 null로 통일해 저장 어댑터와 조회 결과의 의미를 일관되게 한다.
        return repository.save(new SystemMenuCommand(
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

}
