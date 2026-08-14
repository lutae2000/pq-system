package com.cheil.cheil_be.adapter.out.persistence.userauth;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;
import com.cheil.cheil_be.domain.userauth.UserAccount;

/**
 * auth_users 테이블 매핑 엔티티이다.
 */
@Entity
@Table(name = "auth_users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@SuperBuilder
class UserAccountEntity extends AuditEntity {

    @Id
    @Column(name = "login_id", nullable = false, unique = true, length = 100)
    private String loginId;

    @Column(name = "employee_no", nullable = false, unique = true, length = 20)
    private String employeeNo;

    @Column(name = "user_name", nullable = false, length = 100)
    private String userName;

    @Column(name = "user_password", nullable = false, length = 255)
    private String userPassword;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn;

    @Column(name = "group_code", nullable = false, length = 20)
    private String groupCode;

    @Column(name = "dept_code", nullable = false, length = 20)
    private String deptCode;

    @Column(name = "login_dt")
    private Instant loginDt;

    @Column(name = "recent_ip_addr", length = 64)
    private String recentIpAddr;

    @Column(name = "password_reset_dt", length = 8)
    private String passwordResetDt;

    @Column(name = "password_reset", nullable = false)
    private boolean passwordReset;

    @Column(name = "pic_yn", nullable = false)
    private boolean picYn;

    @Column(name = "wrong_password_count", nullable = false)
    private int wrongPasswordCount;

    @Column(name = "email", length = 255)
    private String email;

    static UserAccountEntity from(UserAccount userAccount) {
        return UserAccountEntity.builder()
                .loginId(userAccount.loginId())
                .employeeNo(userAccount.employeeNo())
                .userName(userAccount.userName())
                .userPassword(userAccount.userPassword())
                .useYn(userAccount.useYn())
                .groupCode(userAccount.groupCode())
                .deptCode(userAccount.deptCode())
                .loginDt(userAccount.loginDt())
                .recentIpAddr(userAccount.recentIpAddr())
                .passwordResetDt(userAccount.passwordResetDt())
                .passwordReset(userAccount.passwordReset())
                .picYn(userAccount.picYn())
                .wrongPasswordCount(userAccount.wrongPasswordCount())
                .email(userAccount.email())
                .lastChangedAt(userAccount.lastChangedAt())
                .lastChangedId(userAccount.lastChangedId())
                .build();
    }

    UserAccount toDomain() {
        return new UserAccount(
                employeeNo,
                userName,
                loginId,
                userPassword,
                useYn,
                groupCode,
                deptCode,
                loginDt,
                recentIpAddr,
                passwordResetDt,
                passwordReset,
                picYn,
                wrongPasswordCount,
                email,
                lastChangedAt,
                lastChangedId
        );
    }
}
