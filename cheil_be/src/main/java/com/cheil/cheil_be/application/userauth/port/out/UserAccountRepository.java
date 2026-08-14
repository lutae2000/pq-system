package com.cheil.cheil_be.application.userauth.port.out;

import java.util.Optional;
import java.util.List;

import com.cheil.cheil_be.domain.userauth.UserAccount;

public interface UserAccountRepository {

    List<UserAccount> findAll();

    Optional<UserAccount> findByEmployeeNo(String employeeNo);

    Optional<UserAccount> findByLoginId(String loginId);

    boolean existsByEmployeeNo(String employeeNo);

    boolean existsByLoginId(String loginId);

    UserAccount save(UserAccount userAccount);
}
