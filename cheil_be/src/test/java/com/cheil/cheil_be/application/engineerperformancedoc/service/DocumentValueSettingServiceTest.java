package com.cheil.cheil_be.application.engineerperformancedoc.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cheil.cheil_be.application.engineerperformancedoc.model.DocumentValueSetting;
import com.cheil.cheil_be.application.engineerperformancedoc.port.in.SaveDocumentValueSettingCommand;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.DocumentValueSettingRepository;

@ExtendWith(MockitoExtension.class)
class DocumentValueSettingServiceTest {

    @Mock
    private DocumentValueSettingRepository repository;

    @InjectMocks
    private DocumentValueSettingService service;

    @Test
    void returnsEmptyWhenBidSeqIsMissing() {
        assertThat(service.findByBidSeq(null)).isEmpty();
        verify(repository, never()).findByBidSeq(any());
    }

    @Test
    void rejectsEducationThatDoesNotBelongToEngineer() {
        SaveDocumentValueSettingCommand command = new SaveDocumentValueSettingCommand(1L, "E001", 10L, null);
        when(repository.existsEducation(10L, "E001")).thenReturn(false);

        assertThatThrownBy(() -> service.save(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("educationId");
        verify(repository, never()).save(any(), anyString());
    }

    @Test
    void validatesDetailsAndDelegatesSave() {
        SaveDocumentValueSettingCommand command = new SaveDocumentValueSettingCommand(1L, " E001 ", 10L, 20L);
        DocumentValueSetting saved = new DocumentValueSetting(1L, "E001", 10L, 20L, null, "system", null, "system");
        when(repository.existsEducation(10L, "E001")).thenReturn(true);
        when(repository.existsLicense(20L, "E001")).thenReturn(true);
        when(repository.save(any(), anyString())).thenReturn(saved);

        assertThat(service.save(command)).isEqualTo(saved);
        verify(repository).save(new SaveDocumentValueSettingCommand(1L, "E001", 10L, 20L), "system");
    }
}
