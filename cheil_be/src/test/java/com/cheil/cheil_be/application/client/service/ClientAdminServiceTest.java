package com.cheil.cheil_be.application.client.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.cheil.cheil_be.application.client.model.ClientSearchCondition;
import com.cheil.cheil_be.application.client.port.out.ClientRepository;
import com.cheil.cheil_be.application.common.exception.ApplicationErrorType;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.domain.client.Client;

@ExtendWith(MockitoExtension.class)
class ClientAdminServiceTest {

    @Mock
    private ClientRepository repository;

    private ClientAdminService service;

    @BeforeEach
    void setUp() {
        service = new ClientAdminService(
                repository,
                Clock.fixed(Instant.parse("2026-10-22T00:00:00Z"), ZoneOffset.UTC));
    }

    @Test
    void findAllNormalizesSearchCondition() {
        var pageable = PageRequest.of(0, 20);
        Page<Client> page = new PageImpl<>(java.util.List.of(), pageable, 0);
        when(repository.findAll(any(), any())).thenReturn(page);

        assertThat(service.findAll(new ClientSearchCondition(" name ", " A ", " B "), pageable))
                .isEqualTo(page);

        ArgumentCaptor<ClientSearchCondition> captor = ArgumentCaptor.forClass(ClientSearchCondition.class);
        verify(repository).findAll(captor.capture(), org.mockito.ArgumentMatchers.same(pageable));
        assertThat(captor.getValue()).isEqualTo(new ClientSearchCondition("name", "A", "B"));
    }

    @Test
    void rejectsMissingPageable() {
        assertThatThrownBy(() -> service.findAll(null, null))
                .isInstanceOfSatisfying(ApplicationException.class, exception ->
                        assertThat(exception.errorType()).isEqualTo(ApplicationErrorType.BAD_REQUEST));
        verify(repository, never()).findAll(any(), any());
    }
}
