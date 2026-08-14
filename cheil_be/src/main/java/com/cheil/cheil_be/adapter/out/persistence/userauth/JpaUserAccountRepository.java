package com.cheil.cheil_be.adapter.out.persistence.userauth;

import java.util.Optional;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Sort;

import com.cheil.cheil_be.application.userauth.port.out.UserAccountRepository;
import com.cheil.cheil_be.domain.userauth.UserAccount;

@Repository
@RequiredArgsConstructor
public class JpaUserAccountRepository implements UserAccountRepository {

    private final UserAccountJpaRepository userAccountJpaRepository;

    @Override
    public List<UserAccount> findAll() {
        return userAccountJpaRepository.findAll(Sort.by(Sort.Direction.DESC, "lastChangedAt", "loginId"))
                .stream()
                .map(UserAccountEntity::toDomain)
                .toList();
    }

    @Override
    public Optional<UserAccount> findByEmployeeNo(String employeeNo) {
        return userAccountJpaRepository.findByEmployeeNo(employeeNo).map(UserAccountEntity::toDomain);
    }

    @Override
    public Optional<UserAccount> findByLoginId(String loginId) {
        return userAccountJpaRepository.findByLoginId(loginId).map(UserAccountEntity::toDomain);
    }

    @Override
    public boolean existsByEmployeeNo(String employeeNo) {
        return userAccountJpaRepository.existsByEmployeeNo(employeeNo);
    }

    @Override
    public boolean existsByLoginId(String loginId) {
        return userAccountJpaRepository.existsByLoginId(loginId);
    }

    @Override
    public UserAccount save(UserAccount userAccount) {
        return userAccountJpaRepository.save(UserAccountEntity.from(userAccount)).toDomain();
    }

}
