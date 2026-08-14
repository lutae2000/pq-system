package com.cheil.cheil_be.adapter.out.persistence.systempermission;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * role_permissions 테이블 매핑 엔티티이다.
 */
@Entity
@Table(name = "role_permissions")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class RolePermissionEntity {

    @EmbeddedId
    private RolePermissionId id;

    @Column(name = "read_yn", nullable = false)
    private boolean readYn;

    @Column(name = "create_yn", nullable = false)
    private boolean createYn;

    @Column(name = "update_yn", nullable = false)
    private boolean updateYn;

    @Column(name = "delete_yn", nullable = false)
    private boolean deleteYn;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "created_id", length = 100, nullable = false)
    private String createdId;

    @Column(name = "last_changed_at", nullable = false)
    private Instant lastChangedAt;

    @Column(name = "last_changed_id", length = 100, nullable = false)
    private String lastChangedId;
}
