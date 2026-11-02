package com.cheil.cheil_be.application.newtechnology.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyDevelopment;
import com.cheil.cheil_be.application.newtechnology.port.out.NewTechnologyDevelopmentRepository;
import com.cheil.cheil_be.common.file.FileAttachmentService;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NewTechnologyDevelopmentServiceTest {
  @Mock private CurrentActorPort currentActorPort;
  @Mock private FileAttachmentService fileAttachmentService;
  @Mock private NewTechnologyDevelopmentRepository repository;
  @InjectMocks private NewTechnologyDevelopmentService service;

  @Test
  void calculatesThreeDecimalScoreOnlyForDesignAndSupervision() {
    when(repository.findById(1L)).thenReturn(Optional.of(row("설계")))
        .thenReturn(Optional.of(row("감리")))
        .thenReturn(Optional.of(row("건축")));

    assertThat(service.findById(1L, null).autoCalculatedScore()).isEqualByComparingTo("0.333");
    assertThat(service.findById(1L, null).autoCalculatedScore()).isEqualByComparingTo("0.333");
    assertThat(service.findById(1L, null).autoCalculatedScore()).isNull();
  }

  private NewTechnologyDevelopment row(String category) {
    return new NewTechnologyDevelopment(
        1L, "기술", "신기술", category, BigDecimal.valueOf(3), true, null,
        BigDecimal.ONE, null, null, null, null, null, null,
        null, null, null, null);
  }
}
