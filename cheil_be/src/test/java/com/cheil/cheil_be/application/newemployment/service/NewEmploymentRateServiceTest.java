package com.cheil.cheil_be.application.newemployment.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployee;
import com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployeeCommand;
import com.cheil.cheil_be.application.newemployment.port.out.NewEmploymentRateRepository;

@ExtendWith(MockitoExtension.class)
class NewEmploymentRateServiceTest {

    @Mock
    private NewEmploymentRateRepository repository;

    @Mock
    private CurrentActorPort currentActorPort;

    @InjectMocks
    private NewEmploymentRateService service;

    @Test
    void createEmployeeNormalizesInputAndDelegatesCrudToRepository() {
        var saved = new NewEmploymentEmployee(
                7L, "2026-10", "100", "홍길동", null, "20261022",
                "D01", "기술부", "기술직", "비고", null, null, null, null
        );
        when(currentActorPort.currentActor()).thenReturn("admin");
        when(repository.departmentExists("D01")).thenReturn(true);
        when(repository.createEmployee(any(), eq("admin"))).thenReturn(7L);
        when(repository.findEmployeeById(7L)).thenReturn(Optional.of(saved));

        assertThat(service.createEmployee(new NewEmploymentEmployeeCommand(
                "202610", " 100 ", " 홍길동 ", null, "2026-10-22",
                " D01 ", " 기술직 ", " 비고 "
        ))).isEqualTo(saved);

        var captor = ArgumentCaptor.forClass(NewEmploymentEmployeeCommand.class);
        verify(repository).createEmployee(captor.capture(), eq("admin"));
        assertThat(captor.getValue()).isEqualTo(new NewEmploymentEmployeeCommand(
                "2026-10", "100", "홍길동", null, "20261022",
                "D01", "기술직", "비고"
        ));
    }
}
