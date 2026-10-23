package com.cheil.cheil_be.application.constructiontype.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cheil.cheil_be.application.common.exception.ApplicationErrorType;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.constructiontype.port.in.ConstructionTypeUpsertCommand;
import com.cheil.cheil_be.application.constructiontype.port.out.ConstructionTypeRepository;
import com.cheil.cheil_be.domain.constructiontype.ConstructionType;

@ExtendWith(MockitoExtension.class)
class ConstructionTypeAdminServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-22T00:00:00Z");

    @Mock
    private ConstructionTypeRepository repository;

    private ConstructionTypeAdminService service;

    @BeforeEach
    void setUp() {
        service = new ConstructionTypeAdminService(repository, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void createNormalizesCodesForTheSelectedLevel() {
        ConstructionTypeUpsertCommand command = new ConstructionTypeUpsertCommand(
                1, " 10 ", "ignored", "ignored", " 도로 ", null, null, null);
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ConstructionType created = service.create(command);

        assertThat(created.level1Code()).isEqualTo("10");
        assertThat(created.level2Code()).isEmpty();
        assertThat(created.level3Code()).isEmpty();
        assertThat(created.codeName()).isEqualTo("도로");
        assertThat(created.useYn()).isTrue();
        assertThat(created.createdAt()).isEqualTo(NOW);
        assertThat(created.createdId()).isEqualTo("admin");
        verify(repository).existsByNaturalKey(1, "10", "", "");
    }

    @Test
    void deleteRejectsParentWithAChild() {
        ConstructionType parent = type(1L, 1, "10", "", "");
        ConstructionType child = type(2L, 2, "10", "20", "");
        when(repository.findByCodeId(1L)).thenReturn(Optional.of(parent));
        when(repository.findAll()).thenReturn(List.of(parent, child));

        assertThatThrownBy(() -> service.delete(1L))
                .isInstanceOfSatisfying(ApplicationException.class, exception ->
                        assertThat(exception.errorType()).isEqualTo(ApplicationErrorType.CONFLICT));

        verify(repository, never()).deleteByCodeId(1L);
    }

    private ConstructionType type(Long id, int level, String level1, String level2, String level3) {
        return new ConstructionType(
                id, level, level1, level2, level3, "공사종류", true,
                NOW, "admin", NOW, "admin");
    }
}
