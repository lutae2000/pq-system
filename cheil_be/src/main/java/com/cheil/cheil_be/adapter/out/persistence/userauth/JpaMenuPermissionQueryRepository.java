package com.cheil.cheil_be.adapter.out.persistence.userauth;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.cheil.cheil_be.adapter.out.persistence.systempermission.SystemMenuEntity;

interface JpaMenuPermissionQueryRepository extends Repository<SystemMenuEntity, String> {

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
