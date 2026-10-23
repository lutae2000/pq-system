package com.cheil.cheil_be.application.certification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cheil.cheil_be.application.certification.port.in.CertificationSearchCondition;
import com.cheil.cheil_be.application.certification.port.in.CertificationUpsertCommand;
import com.cheil.cheil_be.application.certification.port.out.CertificationRepository;
import com.cheil.cheil_be.application.common.exception.ApplicationErrorType;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.domain.certification.Certification;

@ExtendWith(MockitoExtension.class)
class CertificationAdminServiceTest {

    @Mock
    private CertificationRepository repository;

    @InjectMocks
    private CertificationAdminService service;

    @Test
    void createNormalizesInputBeforeSaving() {
        CertificationUpsertCommand command = new CertificationUpsertCommand(
                " CERT ", " 자격증 ", 2, " ", " 만족도 ", null);
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Certification result = service.create(command);

        ArgumentCaptor<Certification> captor = ArgumentCaptor.forClass(Certification.class);
        verify(repository).save(captor.capture());
        assertThat(result).isEqualTo(captor.getValue());
        assertThat(result.certCode()).isEqualTo("CERT");
        assertThat(result.certName()).isEqualTo("자격증");
        assertThat(result.satisCode()).isNull();
        assertThat(result.satisName()).isEqualTo("만족도");
        assertThat(result.useYn()).isTrue();
    }

    @Test
    void rejectsInvalidKindBeforeRepositoryCall() {
        assertThatThrownBy(() -> service.findAll(new CertificationSearchCondition(5)))
                .isInstanceOfSatisfying(ApplicationException.class, exception ->
                        assertThat(exception.errorType()).isEqualTo(ApplicationErrorType.BAD_REQUEST));
        verify(repository, never()).findAllByCertKind(any());
    }

    @Test
    void rejectsDifferentPathAndBodyCode() {
        when(repository.findByCertCode("CERT")).thenReturn(Optional.of(certification("CERT")));

        assertThatThrownBy(() -> service.update("CERT", new CertificationUpsertCommand(
                "OTHER", "자격증", 1, null, null, true)))
                .isInstanceOfSatisfying(ApplicationException.class, exception ->
                        assertThat(exception.errorType()).isEqualTo(ApplicationErrorType.BAD_REQUEST));
        verify(repository, never()).save(any());
    }

    private static Certification certification(String code) {
        return new Certification(code, "자격증", 1, null, null, true,
                null, null, null, null);
    }
}
