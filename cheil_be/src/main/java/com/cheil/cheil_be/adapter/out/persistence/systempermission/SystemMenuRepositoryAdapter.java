package com.cheil.cheil_be.adapter.out.persistence.systempermission;

import java.util.List;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.systempermission.model.SystemMenu;
import com.cheil.cheil_be.application.systempermission.port.in.SaveSystemMenuCommand;
import com.cheil.cheil_be.application.systempermission.port.out.SystemMenuRepository;

/** 시스템 메뉴 Entity와 애플리케이션 모델의 변환 및 JPA 저장을 담당하는 출력 어댑터다. */
@Repository
@RequiredArgsConstructor
public class SystemMenuRepositoryAdapter implements SystemMenuRepository {

    private final JpaSystemMenuRepository repository;

    @Override
    public List<SystemMenu> findAll() {
        return repository.findAllByOrderBySortSeqAscMenuCodeAsc().stream()
                .map(SystemMenuRepositoryAdapter::toModel)
                .toList();
    }

    @Override
    public Optional<SystemMenu> findByCode(String menuCode) {
        return repository.findById(menuCode).map(SystemMenuRepositoryAdapter::toModel);
    }

    @Override
    public SystemMenu save(SaveSystemMenuCommand command) {
        SystemMenuEntity entity = repository.findById(command.menuCode())
                .map(existing -> update(existing, command))
                .orElseGet(() -> repository.save(toEntity(command)));
        return toModel(entity);
    }

    @Override
    public void deleteByCode(String menuCode) {
        repository.deleteById(menuCode);
    }

    private SystemMenuEntity update(SystemMenuEntity entity, SaveSystemMenuCommand command) {
        entity.setMenuName(command.menuName());
        entity.setParentMenuCode(command.parentMenuCode());
        entity.setMenuPath(command.menuPath());
        entity.setMenuType(command.menuType());
        entity.setSortSeq(command.sortSeq());
        entity.setUseYn(command.useYn());
        entity.setVisibleYn(command.visibleYn());
        entity.setDescription(command.description());
        return entity;
    }

    private SystemMenuEntity toEntity(SaveSystemMenuCommand command) {
        return SystemMenuEntity.builder()
                .menuCode(command.menuCode())
                .menuName(command.menuName())
                .parentMenuCode(command.parentMenuCode())
                .menuPath(command.menuPath())
                .menuType(command.menuType())
                .sortSeq(command.sortSeq())
                .useYn(command.useYn())
                .visibleYn(command.visibleYn())
                .description(command.description())
                .build();
    }

    private static SystemMenu toModel(SystemMenuEntity entity) {
        return new SystemMenu(
                entity.getMenuCode(), entity.getMenuName(), entity.getParentMenuCode(), entity.getMenuPath(),
                entity.getMenuType(), entity.getSortSeq(), entity.isUseYn(), entity.isVisibleYn(), entity.getDescription());
    }
}
