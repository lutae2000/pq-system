package com.cheil.cheil_be.application.userauth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.cheil.cheil_be.application.common.exception.ApplicationErrorType;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.common.service.PasswordHashService;
import com.cheil.cheil_be.application.common.service.PasswordVerificationService;
import com.cheil.cheil_be.application.userauth.port.out.UserAccountRepository;
import com.cheil.cheil_be.domain.userauth.UserAccount;

class UserAccountSelfServiceTest {

    @Test
    void rejectsEmployeeNumberChangeBeforeSaving() {
        UserAccountRepository repository = mock(UserAccountRepository.class);
        when(repository.findByLoginId("login")).thenReturn(Optional.of(new UserAccount(
                "1001", "Tester", "login", "encoded", true, "group", "dept",
                null, null, null, false, false, 0, null, Instant.EPOCH, "system"
        )));
        UserAccountSelfService service = new UserAccountSelfService(
                repository, mock(PasswordHashService.class), mock(PasswordVerificationService.class),
                mock(CurrentActorPort.class), Clock.systemUTC()
        );

        assertThatThrownBy(() -> service.updateProfile("login", "1002", "dept", null, null, null))
                .isInstanceOfSatisfying(ApplicationException.class,
                        exception -> assertThat(exception.errorType()).isEqualTo(ApplicationErrorType.BAD_REQUEST));
        verify(repository, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
