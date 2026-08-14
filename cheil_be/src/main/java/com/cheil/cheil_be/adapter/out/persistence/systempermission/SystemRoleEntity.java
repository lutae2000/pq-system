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
 * auth_roles 테이블 매핑 엔티티이다.
 */
@Entity
@Table(name = "auth_roles")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@SuperBuilder
public class SystemRoleEntity extends AuditEntity {

    @Id
    @Column(name = "role_code", nullable = false, length = 50)
    private String roleCode;

    @Column(name = "role_name", nullable = false, unique = true, length = 100)
    private String roleName;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "sort_seq", nullable = false)
    private int sortSeq;
}
