package com.cheil.cheil_be.adapter.out.persistence.systempermission;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;

/**
 * system_menus 테이블 매핑 엔티티이다.
 */
@Entity
@Table(name = "system_menus")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@SuperBuilder
public class SystemMenuEntity extends AuditEntity {

    @Id
    @Column(name = "menu_code", nullable = false, length = 50)
    private String menuCode;

    @Column(name = "menu_name", nullable = false, length = 100)
    private String menuName;

    @Column(name = "parent_menu_code", length = 50)
    private String parentMenuCode;

    @Column(name = "menu_path", length = 255)
    private String menuPath;

    @Column(name = "menu_type", nullable = false, length = 20)
    private String menuType;

    @Column(name = "sort_seq", nullable = false)
    private int sortSeq;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn;

    @Column(name = "visible_yn", nullable = false)
    private boolean visibleYn;

    @Column(name = "description", length = 500)
    private String description;
}
