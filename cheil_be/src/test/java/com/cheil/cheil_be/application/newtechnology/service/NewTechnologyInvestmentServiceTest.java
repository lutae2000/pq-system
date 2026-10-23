package com.cheil.cheil_be.application.newtechnology.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestment;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestmentCommand;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestmentView;
import com.cheil.cheil_be.application.newtechnology.port.out.NewTechnologyInvestmentRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NewTechnologyInvestmentServiceTest {

  @Mock private CurrentActorPort currentActorPort;
  @Mock private NewTechnologyInvestmentRepository repository;
  @InjectMocks private NewTechnologyInvestmentService service;

  @Test
  void createNormalizesInputAndCalculatesRatios() {
    NewTechnologyInvestmentCommand command =
        new NewTechnologyInvestmentCommand(
            " 2026 ",
            amount(1000),
            amount(800),
            amount(400),
            amount(200),
            amount(200),
            amount(300),
            amount(40),
            amount(400),
            amount(50),
            " 비고 ");
    NewTechnologyInvestment saved =
        new NewTechnologyInvestment(
            7L,
            "2026",
            amount(1000),
            amount(800),
            amount(400),
            amount(200),
            amount(200),
            amount(300),
            amount(40),
            amount(400),
            amount(50),
            "비고",
            null,
            "admin",
            null,
            "admin");
    when(repository.existsByInvestmentYear("2026", null)).thenReturn(false);
    when(currentActorPort.currentActor()).thenReturn("admin");
    when(repository.create(any(), eq("admin"))).thenReturn(7L);
    when(repository.findById(7L)).thenReturn(Optional.of(saved));

    NewTechnologyInvestmentView result = service.create(command);

    ArgumentCaptor<NewTechnologyInvestmentCommand> captor =
        ArgumentCaptor.forClass(NewTechnologyInvestmentCommand.class);
    verify(repository).create(captor.capture(), eq("admin"));
    assertThat(captor.getValue().investmentYear()).isEqualTo("2026");
    assertThat(captor.getValue().remark()).isEqualTo("비고");
    assertThat(result.technologyDevelopmentInvestmentRatio()).isEqualByComparingTo("5.00");
    assertThat(result.equityRatio()).isEqualByComparingTo("50.00");
    assertThat(result.returnOnEquity()).isEqualByComparingTo("10.00");
    assertThat(result.currentRatio()).isEqualByComparingTo("150.00");
    assertThat(result.debtRatio()).isEqualByComparingTo("100.00");
  }

  private static BigDecimal amount(long value) {
    return BigDecimal.valueOf(value);
  }
}
