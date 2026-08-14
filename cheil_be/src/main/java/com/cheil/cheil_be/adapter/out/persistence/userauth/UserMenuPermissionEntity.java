package com.cheil.cheil_be.adapter.out.persistence.userauth;

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

@Entity
@Table(name = "user_menu_permissions")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class UserMenuPermissionEntity {

    @EmbeddedId
    private UserMenuPermissionId id;

    @Column(name = "read_yn", nullable = false)
    private boolean readYn;

    @Column(name = "create_yn", nullable = false)
    private boolean createYn;

    @Column(name = "update_yn", nullable = false)
    private boolean updateYn;

    @Column(name = "delete_yn", nullable = false)
    private boolean deleteYn;
}
