package com.cheil.cheil_be.adapter.out.persistence.certification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.cheil.cheil_be.domain.certification.Certification;

class CertificationJpaRepositoryTest {

    private final JpaCertificationRepository jpaRepository = mock(JpaCertificationRepository.class);
    private final CertificationJpaRepository repository = new CertificationJpaRepository(jpaRepository);

    @Test
    void listsLegacyNullKindAsUnclassifiedWithoutChangingOtherKinds() {
        when(jpaRepository.findAll()).thenReturn(List.of(
                CertificationEntity.builder().certCode("LEGACY").build(),
                CertificationEntity.builder().certCode("A01").certKind(4).build()
        ));

        assertThat(repository.findAllByCertKind(null))
                .extracting(Certification::certKind)
                .containsExactly(Certification.UNCLASSIFIED_KIND, 4);
    }

    @Test
    void includesNullKindsWhenFilteringForUnclassifiedCertifications() {
        int unclassifiedKind = Certification.UNCLASSIFIED_KIND;
        when(jpaRepository.findByCertKindOrCertKindIsNull(unclassifiedKind)).thenReturn(List.of(
                CertificationEntity.builder().certCode("LEGACY").build(),
                CertificationEntity.builder().certCode("OTHER").certKind(unclassifiedKind).build()
        ));

        assertThat(repository.findAllByCertKind(unclassifiedKind))
                .extracting(Certification::certCode)
                .containsExactly("LEGACY", "OTHER");
    }
}
