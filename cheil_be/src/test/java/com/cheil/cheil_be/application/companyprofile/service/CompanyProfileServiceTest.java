package com.cheil.cheil_be.application.companyprofile.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cheil.cheil_be.application.common.exception.ApplicationErrorType;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.companyprofile.port.out.CompanyProfileRepository;

@ExtendWith(MockitoExtension.class)
class CompanyProfileServiceTest {

    @Mock
    private CompanyProfileRepository repository;

    @InjectMocks
    private CompanyProfileService service;

    @Test
    void deleteFinancialStatusRejectsUnknownId() {
        when(repository.existsFinancialStatus(10L)).thenReturn(false);

        assertThatThrownBy(() -> service.deleteFinancialStatus(10L))
                .isInstanceOfSatisfying(ApplicationException.class, exception ->
                        org.assertj.core.api.Assertions.assertThat(exception.errorType())
                                .isEqualTo(ApplicationErrorType.NOT_FOUND));

        verify(repository, never()).deleteFinancialStatus(10L);
    }

    @Test
    void deleteAttachmentDelegatesForExistingId() {
        when(repository.existsAttachment(20L)).thenReturn(true);

        service.deleteAttachment(20L);

        verify(repository).deleteAttachment(20L);
    }
}
