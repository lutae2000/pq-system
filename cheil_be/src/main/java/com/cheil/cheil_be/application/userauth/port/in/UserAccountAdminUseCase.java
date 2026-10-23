package com.cheil.cheil_be.application.userauth.port.in;

import java.util.List;

import com.cheil.cheil_be.application.userauth.model.UserAccountCommand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.cheil.cheil_be.application.userauth.model.UserAccountSearch;
import com.cheil.cheil_be.application.userauth.model.UserMenuPermission;
import com.cheil.cheil_be.application.userauth.model.UserMenuPermissionCommand;
import com.cheil.cheil_be.domain.userauth.UserAccount;

public interface UserAccountAdminUseCase {
    Page<UserAccount> findAll(UserAccountSearch search, Pageable pageable);
    UserAccount findByEmployeeNo(String employeeNo);
    UserAccount findByLoginId(String loginId);
    UserAccount upsert(UserAccountCommand command);
    UserAccount resetPassword(String employeeNo);
    List<UserMenuPermission> findUserMenuPermissions(String loginId);
    List<UserMenuPermission> saveUserMenuPermissions(String loginId, List<UserMenuPermissionCommand> items);
}
