package com.cheil.cheil_be.application.workoverlap.contract;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineer;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerChangeCommand;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerCreateCommand;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerHistorySaveCommand;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerParticipation;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerSaveCommand;
import com.cheil.cheil_be.application.workoverlap.contract.port.in.WorkOverlapContractEngineerUseCase;
import com.cheil.cheil_be.application.workoverlap.contract.port.out.WorkOverlapContractEngineerRepository;

class WorkOverlapContractEngineerServiceTest {
    private final WorkOverlapContractEngineerRepository repository = mock(WorkOverlapContractEngineerRepository.class);
    private final WorkOverlapContractEngineerUseCase useCase = new WorkOverlapContractEngineerService(repository, () -> "actor");

    @Test
    void createPassesBothDatesToRepository() {
        when(repository.findByContractNo("C0001")).thenReturn(List.of(engineer("2026-11-30")));

        var result = useCase.create("C0001", new WorkOverlapContractEngineerCreateCommand(
                "E1", null, "2026-11-01", "2026-11-30", null, false, null
        ));

        var command = ArgumentCaptor.forClass(WorkOverlapContractEngineerSaveCommand.class);
        verify(repository).create(command.capture());
        assertThat(command.getValue().participationDate()).isEqualTo("20261101");
        assertThat(command.getValue().participationEndDate()).isEqualTo("20261130");
        assertThat(result.participationEndDate()).isEqualTo("2026-11-30");
    }

    @Test
    void inlineUpdateCanClearEndDateWithoutCreatingHistory() {
        when(repository.update(any())).thenReturn(true);
        when(repository.findByContractNo("C0001")).thenReturn(List.of(engineer(null)));

        useCase.update("C0001", "E1", new WorkOverlapContractEngineerChangeCommand(
                "E1", "E1", "", null, null, null, null, "건축", "20261101", null, "분야참여", true, "수정한 비고"
        ));

        var command = ArgumentCaptor.forClass(WorkOverlapContractEngineerSaveCommand.class);
        verify(repository).update(command.capture());
        assertThat(command.getValue().field()).isEqualTo("건축");
        assertThat(command.getValue().participationType()).isEqualTo("분야참여");
        assertThat(command.getValue().pqTargetYn()).isTrue();
        assertThat(command.getValue().remark()).isEqualTo("수정한 비고");
        assertThat(command.getValue().participationEndDate()).isNull();
        verify(repository, never()).createHistory(any());
    }

    @Test
    void updateStoresBothSetsOfParticipationDetailsInHistory() {
        when(repository.update(any())).thenReturn(true);
        when(repository.findByContractNo("C0001")).thenReturn(List.of(
                new WorkOverlapContractEngineer("E2", null, null, null, "2026-11-28", "2026-12-31", null, false, null)
        ));

        useCase.update("C0001", "E1", new WorkOverlapContractEngineerChangeCommand(
                "E1", "E2", "replacement", " Civil ", " Lead ", "2026-11-01", "2026-11-27",
                "Mechanical", "2026-11-28", "2026-12-31", "Support", false, null
        ));

        var command = ArgumentCaptor.forClass(WorkOverlapContractEngineerSaveCommand.class);
        verify(repository).update(command.capture());
        assertThat(command.getValue().field()).isEqualTo("Mechanical");
        assertThat(command.getValue().participationType()).isEqualTo("Support");
        assertThat(command.getValue().participationDate()).isEqualTo("20261128");
        assertThat(command.getValue().participationEndDate()).isEqualTo("20261231");
        verify(repository).createHistory(new WorkOverlapContractEngineerHistorySaveCommand(
                "C0001", "E1", "E2", "replacement",
                new WorkOverlapContractEngineerParticipation("Civil", "Lead", "20261101", "20261127"),
                new WorkOverlapContractEngineerParticipation("Mechanical", "Support", "20261128", "20261231"),
                "actor"
        ));
    }

    @Test
    void rejectsInvalidEndDateBeforeSaving() {
        var command = new WorkOverlapContractEngineerCreateCommand(
                "E1", null, "2026-11-01", "2026-11-31", null, false, null
        );

        assertThatThrownBy(() -> useCase.create("C0001", command)).isInstanceOf(ApplicationException.class);
        verifyNoInteractions(repository);
    }

    private WorkOverlapContractEngineer engineer(String endDate) {
        return new WorkOverlapContractEngineer("E1", null, null, null, "2026-11-01", endDate, null, false, null);
    }
}
