package com.cheil.cheil_be.application.pqparticipatingengineer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineerFilters;
import com.cheil.cheil_be.application.pqparticipatingengineer.port.out.CandidateEngineerRepository;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionJsonCodec;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadata;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadataService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

class CandidateEngineerServiceTest {

    private static final CandidateEngineerFilters FILTERS = new CandidateEngineerFilters(
            7L, "E100", null, null, null, null, null, null, "N", List.of());
    private static final PageRequest PAGE = PageRequest.of(0, 10);
    private final CandidateEngineerRepository repository = mock(CandidateEngineerRepository.class);
    private final ProjectHistoryConditionMetadataService metadataService = mock(ProjectHistoryConditionMetadataService.class);
    private final CandidateEngineerService service = new CandidateEngineerService(repository, new ProjectHistoryConditionJsonCodec(), metadataService);

    @Test
    void forwardsRecognizedConditionsAndPageToTheRepository() {
        var metadata = Map.of("JOIN", new ProjectHistoryConditionMetadata("pq_engineer_project_history", "joinyn", "code"));
        when(metadataService.findAll()).thenReturn(metadata);
        when(repository.findCandidates(eq(FILTERS), anyList(), eq(metadata), eq(PAGE))).thenReturn(Page.empty(PAGE));

        assertThat(service.findCandidates(FILTERS, """
                [{"conditionType":"general","generalCode":"JOIN","value":"Y"}]
                """, PAGE)).isEqualTo(Page.empty(PAGE));
    }

    @Test
    void rejectsMissingDefinitionsAndIncompleteComparisonsInsteadOfDroppingThem() {
        when(metadataService.findAll()).thenReturn(Map.of("AMOUNT",
                new ProjectHistoryConditionMetadata("company_performances", "own_amt", "number")));

        assertThatThrownBy(() -> service.findCandidates(FILTERS, """
                [{"conditionType":"general","generalCode":"UNKNOWN","value":"Y"}]
                """, PAGE)).isInstanceOf(ApplicationException.class).hasMessageContaining("다시 선택");
        assertThatThrownBy(() -> service.findCandidates(FILTERS, """
                [{"conditionType":"general","generalCode":"AMOUNT","operator":"LIKE","value":" "}]
                """, PAGE)).isInstanceOf(ApplicationException.class).hasMessageContaining("조건값");
        assertThatThrownBy(() -> service.findCandidates(FILTERS, """
                [{"conditionType":"general","generalCode":"AMOUNT","operator":"BETWEEN","value":"100"}]
                """, PAGE)).isInstanceOf(ApplicationException.class).hasMessageContaining("끝값");
        assertThatThrownBy(() -> service.findCandidates(FILTERS, """
                [{"conditionType":"general","generalCode":"AMOUNT","valueType":"code","value":"01"}]
                """, PAGE)).isInstanceOf(ApplicationException.class).hasMessageContaining("형식이 변경");
        verifyNoInteractions(repository);
    }
}
