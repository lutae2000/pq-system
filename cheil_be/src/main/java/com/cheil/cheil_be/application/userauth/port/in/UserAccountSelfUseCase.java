package com.cheil.cheil_be.application.userauth.port.in;

import com.cheil.cheil_be.domain.userauth.UserAccount;

public interface UserAccountSelfUseCase {
    UserAccount findByLoginId(String loginId);
    UserAccount changePassword(String loginId, String currentPassword, String newPassword);
    UserAccount updateProfile(String loginId, String employeeNo, String deptCode, String email,
                              String currentPassword, String newPassword);
}
