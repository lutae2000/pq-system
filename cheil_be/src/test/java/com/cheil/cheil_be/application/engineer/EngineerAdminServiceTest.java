package com.cheil.cheil_be.application.engineer;

import com.cheil.cheil_be.application.engineer.port.out.EngineerMasterRepository;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.StreamSupport;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class EngineerAdminServiceTest {

    @Mock
    private EngineerMasterRepository masterRepository;

    @Mock
    private EngineerLicenseRepository licenseRepository;

    @Mock
    private EngineerCareerRepository careerRepository;

    @Mock
    private EngineerPrizeRepository prizeRepository;

    @Mock
    private EngineerEducationRepository educationRepository;

    @Mock
    private EngineerProjectHistoryRepository projectHistoryRepository;

    @Mock
    private EngineerSchoolRepository schoolRepository;

    @InjectMocks
    private EngineerAdminService service;

    @Captor
    private ArgumentCaptor<Iterable<Long>> deleteIdsCaptor;

    @Test
    void saveBasicUpdatesExistingMasterWithoutRecreatingRow() {
        EngineerMasterEntity master = new EngineerMasterEntity();
        master.engrId = "ENG-1";
        master.nameKor = "old-name";
        ReflectionTestUtils.setField(master, "createdAt", Instant.parse("2026-07-01T00:00:00Z"));
        ReflectionTestUtils.setField(master, "createdId", "creator");
        ReflectionTestUtils.setField(master, "lastChangedAt", Instant.parse("2026-07-02T00:00:00Z"));
        ReflectionTestUtils.setField(master, "lastChangedId", "editor");

        when(masterRepository.findById("ENG-1")).thenReturn(Optional.of(master));
        when(masterRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        stubEmptyRelatedProfiles("ENG-1");

        service.saveBasic(
                "ENG-1",
                new EngineerDtos.Basic(
                        "ENG-1",
                        "new-name",
                        "19800101",
                        "planning",
                        "manager",
                        "design-grade",
                        "construction-management-grade",
                        false,
                        "N",
                        "design",
                        "construction"
                )
        );

        assertThat(master.nameKor).isEqualTo("new-name");
        assertThat(ReflectionTestUtils.getField(master, "createdAt")).isEqualTo(Instant.parse("2026-07-01T00:00:00Z"));
        assertThat(ReflectionTestUtils.getField(master, "createdId")).isEqualTo("creator");
        verify(masterRepository).save(master);
    }

    @Test
    void saveSchoolsUpdatesExistingRowsAndDeletesOnlyMissingRows() {
        EngineerMasterEntity master = new EngineerMasterEntity();
        master.engrId = "ENG-1";

        EngineerSchoolEntity existing = new EngineerSchoolEntity();
        existing.id = 1L;
        existing.engrId = "ENG-1";
        existing.schName = "old-school";
        ReflectionTestUtils.setField(existing, "createdAt", Instant.parse("2026-07-01T00:00:00Z"));
        ReflectionTestUtils.setField(existing, "createdId", "creator");
        ReflectionTestUtils.setField(existing, "lastChangedAt", Instant.parse("2026-07-02T00:00:00Z"));
        ReflectionTestUtils.setField(existing, "lastChangedId", "editor");

        EngineerSchoolEntity removed = new EngineerSchoolEntity();
        removed.id = 2L;
        removed.engrId = "ENG-1";
        removed.schName = "removed";

        when(masterRepository.findById("ENG-1")).thenReturn(Optional.of(master));
        when(schoolRepository.findByEngrIdOrderById("ENG-1")).thenReturn(List.of(existing, removed));
        when(schoolRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        stubEmptyRelatedProfilesExceptSchool("ENG-1");

        service.saveSchools(
                "ENG-1",
                List.of(
                        new EngineerDtos.School(1L, "ENG-1", "20200101", "new-school", "computer", 4, "Y", "N"),
                        new EngineerDtos.School(null, "ENG-1", "20230101", "fresh-school", "electrical", 2, "N", "N")
                )
        );

        assertThat(existing.schName).isEqualTo("new-school");
        assertThat(ReflectionTestUtils.getField(existing, "createdAt")).isEqualTo(Instant.parse("2026-07-01T00:00:00Z"));
        assertThat(ReflectionTestUtils.getField(existing, "createdId")).isEqualTo("creator");
        verify(schoolRepository).deleteAllById(deleteIdsCaptor.capture());
        assertThat(StreamSupport.stream(deleteIdsCaptor.getValue().spliterator(), false).toList()).containsExactly(2L);
        verify(schoolRepository).saveAll(any());
        verify(schoolRepository, never()).deleteByEngrId("ENG-1");
    }

    private void stubEmptyRelatedProfiles(String engrId) {
        when(licenseRepository.findByEngrIdOrderById(engrId)).thenReturn(List.of());
        when(careerRepository.findByEngrIdOrderByEntryDtAsc(engrId)).thenReturn(List.of());
        when(prizeRepository.findByEngrIdOrderById(engrId)).thenReturn(List.of());
        when(educationRepository.findByEngrIdOrderById(engrId)).thenReturn(List.of());
        when(projectHistoryRepository.findByEngrIdOrderByStartDtDescIdDesc(engrId)).thenReturn(List.of());
        when(schoolRepository.findByEngrIdOrderById(engrId)).thenReturn(List.of());
    }

    private void stubEmptyRelatedProfilesExceptSchool(String engrId) {
        when(licenseRepository.findByEngrIdOrderById(engrId)).thenReturn(List.of());
        when(careerRepository.findByEngrIdOrderByEntryDtAsc(engrId)).thenReturn(List.of());
        when(prizeRepository.findByEngrIdOrderById(engrId)).thenReturn(List.of());
        when(educationRepository.findByEngrIdOrderById(engrId)).thenReturn(List.of());
        when(projectHistoryRepository.findByEngrIdOrderByStartDtDescIdDesc(engrId)).thenReturn(List.of());
    }
}
