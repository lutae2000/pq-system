package com.cheil.cheil_be.application.engineer;

import com.cheil.cheil_be.application.engineer.port.out.EngineerMasterRepository;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
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

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceRepository;
import com.cheil.cheil_be.application.companyperformance.port.out.ParticipationContractPeriodRepository;
import com.cheil.cheil_be.domain.companyperformance.CompanyPerformance;
import com.cheil.cheil_be.domain.companyperformance.ParticipationContractPeriod;

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
    private CompanyPerformanceRepository companyPerformanceRepository;

    @Mock
    private ParticipationContractPeriodRepository participationContractPeriodRepository;

    @Mock
    private EngineerSchoolRepository schoolRepository;

    @InjectMocks
    private EngineerAdminService service;

    @Captor
    private ArgumentCaptor<Iterable<Long>> deleteIdsCaptor;

    @Test
    void profileIncludesContractDatesFromTheCompanyProjectLinkedToEachHistory() {
        var master = new EngineerMasterEntity();
        master.engrId = "ENG-1";
        when(masterRepository.findById("ENG-1")).thenReturn(Optional.of(master));

        var linked = new EngineerProjectHistoryEntity();
        linked.id = 1L;
        linked.seq = 10;
        linked.startDt = "20240301";
        linked.endDt = "20240401";
        var missing = new EngineerProjectHistoryEntity();
        missing.id = 2L;
        missing.seq = 20;
        var unlinked = new EngineerProjectHistoryEntity();
        unlinked.id = 3L;
        when(projectHistoryRepository.findByEngrIdOrderByStartDtDescIdDesc("ENG-1"))
                .thenReturn(List.of(linked, missing, unlinked));

        var project = mock(CompanyPerformance.class);
        when(project.seq()).thenReturn(10L);
        when(project.jobName()).thenReturn("Linked project");
        when(project.contractFromDate()).thenReturn("20240201");
        when(project.contractToDate()).thenReturn("20240501");
        when(companyPerformanceRepository.findByIds(List.of(10L, 20L))).thenReturn(List.of(project));
        var participationPeriod = new ParticipationContractPeriod("20240215", "20240415");
        when(participationContractPeriodRepository.findByProjectHistoryIds(List.of(1L, 2L, 3L)))
                .thenReturn(Map.of(1L, participationPeriod));

        var histories = service.findByEngrId("ENG-1").careerDetails();
        assertThat(histories).extracting(EngineerDtos.CareerDetail::recordId).containsExactly(1L, 2L, 3L);
        assertThat(histories.getFirst()).satisfies(history -> {
            assertThat(history.jobName()).isEqualTo("Linked project");
            assertThat(history.startDt()).isEqualTo("20240301");
            assertThat(history.endDt()).isEqualTo("20240401");
            assertThat(history.contractFromDate()).isEqualTo("20240201");
            assertThat(history.contractToDate()).isEqualTo("20240501");
            assertThat(history.participationContractPeriod()).isEqualTo(participationPeriod);
        });
        assertThat(histories.subList(1, histories.size())).allSatisfy(history -> {
            assertThat(history.contractFromDate()).isNull();
            assertThat(history.contractToDate()).isNull();
            assertThat(history.participationContractPeriod()).isNull();
        });
    }

    @Test
    void createUsesDatabaseAllocatedIdInsteadOfSubmittedId() {
        EngineerDtos.Basic submitted = new EngineerDtos.Basic(
                "E0000001", "new-name", "19800101", "planning", "manager",
                "design-grade", "construction-management-grade", false, "N", "design", "construction", " 00123 "
        );
        when(masterRepository.allocateEngineerId()).thenReturn("E0000002");
        when(masterRepository.findById("E0000002"))
                .thenReturn(Optional.of(EngineerMasterEntity.from(submitted, "E0000002")));
        stubEmptyRelatedProfiles("E0000002");

        EngineerDtos.Profile created = service.create(new EngineerDtos.Profile(submitted, null, null, null, null, null, null));

        ArgumentCaptor<EngineerMasterEntity> savedCaptor = ArgumentCaptor.forClass(EngineerMasterEntity.class);
        verify(masterRepository).save(savedCaptor.capture());
        assertThat(savedCaptor.getValue().engrId).isEqualTo("E0000002");
        assertThat(created.basic().engrId()).isEqualTo("E0000002");
        assertThat(savedCaptor.getValue().employeeNo).isEqualTo("00123");
        assertThat(created.basic().employeeNo()).isEqualTo("00123");
    }

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

        EngineerDtos.Profile saved = service.saveBasic(
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
                        "construction",
                        " 00456 "
                )
        );

        assertThat(master.nameKor).isEqualTo("new-name");
        assertThat(saved.basic().employeeNo()).isEqualTo("00456");
        assertThat(ReflectionTestUtils.getField(master, "createdAt")).isEqualTo(Instant.parse("2026-07-01T00:00:00Z"));
        assertThat(ReflectionTestUtils.getField(master, "createdId")).isEqualTo("creator");
        verify(masterRepository).save(master);
    }

    @Test
    void saveBasicPreservesAnOmittedEmployeeNumberAndClearsAnExplicitBlank() {
        EngineerMasterEntity master = new EngineerMasterEntity();
        master.engrId = "ENG-1";
        master.employeeNo = "00123";
        when(masterRepository.findById("ENG-1")).thenReturn(Optional.of(master));
        stubEmptyRelatedProfiles("ENG-1");

        var omitted = new EngineerDtos.Basic("ENG-1", "name", null, null, null,
                null, null, false, "N", null, null, null);
        var blank = new EngineerDtos.Basic("ENG-1", "name", null, null, null,
                null, null, false, "N", null, null, "");

        assertThat(service.saveBasic("ENG-1", omitted).basic().employeeNo()).isEqualTo("00123");
        assertThat(service.saveBasic("ENG-1", blank).basic().employeeNo()).isNull();
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

    @Test
    void deleteLicenseDoesNotDeleteAnotherEngineersRecord() {
        EngineerMasterEntity master = new EngineerMasterEntity();
        master.engrId = "ENG-1";
        when(masterRepository.findById("ENG-1")).thenReturn(Optional.of(master));
        when(licenseRepository.findByEngrIdOrderById("ENG-1")).thenReturn(List.of());

        assertThatThrownBy(() -> service.deleteLicense("ENG-1", 99L))
                .isInstanceOf(ApplicationException.class)
                .hasMessageContaining("Record not found.");
        verify(licenseRepository, never()).deleteById(99L);
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
