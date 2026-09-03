package com.cheil.cheil_be.adapter.out.persistence.userauth;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.cheil.cheil_be.adapter.out.persistence.systempermission.SystemMenuEntity;

interface JpaMenuPermissionQueryRepository extends Repository<SystemMenuEntity, String> {

    /**
     * 로그인 사용자의 실효 메뉴 권한을 조회한다.
     *
     * <p>DB 함수가 활성 사용자만 대상으로 역할 권한과 사용자별 권한을 병합하므로,
     * 애플리케이션에서 auth_users를 별도로 조회할 필요가 없다.</p>
     */
    @Query(
            value = """
                    SELECT
                        menu_code AS menuCode,
                        menu_name AS menuName,
                        parent_menu_code AS parentMenuCode,
                        menu_path AS menuPath,
                        menu_type AS menuType,
                        sort_seq AS sortSeq,
                        use_yn AS useYn,
                        visible_yn AS visibleYn,
                        read_yn AS readYn,
                        create_yn AS createYn,
                        update_yn AS updateYn,
                        delete_yn AS deleteYn
                    FROM fn_user_menu_permissions(:loginId)
                    """,
            nativeQuery = true
    )
    List<MenuPermissionProjection> findEffectivePermissionProjections(
            @Param("loginId") String loginId
    );
}
