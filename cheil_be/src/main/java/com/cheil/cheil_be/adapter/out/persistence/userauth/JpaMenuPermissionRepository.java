package com.cheil.cheil_be.adapter.out.persistence.userauth;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.userauth.port.in.MenuPermissionResult;
import com.cheil.cheil_be.application.userauth.port.out.MenuPermissionRepository;

@Repository
@RequiredArgsConstructor
public class JpaMenuPermissionRepository implements MenuPermissionRepository {

    private final JpaMenuPermissionQueryRepository queryRepository;

    @Override
    public List<MenuPermissionResult> findEffectivePermissions(String loginId) {
        return queryRepository.findEffectivePermissionProjections(loginId).stream()
                .map(JpaMenuPermissionRepository::toResult)
                .toList();
    }

    private static MenuPermissionResult toResult(MenuPermissionProjection projection) {
        return new MenuPermissionResult(
                projection.getMenuCode(),
                projection.getMenuName(),
                projection.getParentMenuCode(),
                projection.getMenuPath(),
                projection.getMenuType(),
                projection.getSortSeq(),
                projection.isUseYn(),
                projection.isVisibleYn(),
                projection.isReadYn(),
                projection.isCreateYn(),
                projection.isUpdateYn(),
                projection.isDeleteYn()
        );
    }
}
