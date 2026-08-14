package com.cheil.cheil_be.adapter.out.persistence.systempermission;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * role_permissions 복합 키이다.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class RolePermissionId implements Serializable {

    @Column(name = "role_code", nullable = false, length = 50)
    private String roleCode;

    @Column(name = "menu_code", nullable = false, length = 50)
    private String menuCode;
}
