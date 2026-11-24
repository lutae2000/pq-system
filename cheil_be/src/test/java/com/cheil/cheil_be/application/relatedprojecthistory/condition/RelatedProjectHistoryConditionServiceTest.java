package com.cheil.cheil_be.application.relatedprojecthistory.condition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.cheil.cheil_be.application.common.exception.ApplicationErrorType;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.common.port.out.AuthenticatedAccountPort;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.port.out.RelatedProjectHistoryConditionRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class RelatedProjectHistoryConditionServiceTest {

    private final RelatedProjectHistoryConditionRepository repository = mock(RelatedProjectHistoryConditionRepository.class);
    private final AuthenticatedAccountPort currentActor = mock(AuthenticatedAccountPort.class);
    private final RelatedProjectHistoryConditionService service = new RelatedProjectHistoryConditionService(
            repository, currentActor, new ProjectHistoryConditionJsonCodec());

    @Test
    void readsAndWritesConditionsForTheAuthenticatedAccountAndBid() {
        String conditions = "[{\"conditionType\":\"constructionKind\",\"level1Code\":\"01\"}]";
        RelatedProjectHistoryConditionData saved = new RelatedProjectHistoryConditionData(
                7L, conditions, null, "E100", null, "E100");
        when(currentActor.authenticatedEmployeeNo()).thenReturn(Optional.of("E100"));
        when(repository.save(7L, "E100", conditions)).thenReturn(saved);
        when(repository.findByBidSeqAndEmployeeNo(7L, "E100")).thenReturn(Optional.of(saved));

        assertThat(service.save(7L, conditions)).isEqualTo(saved);
        assertThat(service.findByBidSeq(7L)).isEqualTo(saved);
        assertThat(service.findByBidSeq(8L)).isEqualTo(RelatedProjectHistoryConditionData.empty(8L));

        when(currentActor.authenticatedEmployeeNo()).thenReturn(Optional.of("E200"));
        assertThat(service.findByBidSeq(7L)).isEqualTo(RelatedProjectHistoryConditionData.empty(7L));
        RelatedProjectHistoryConditionData cleared = RelatedProjectHistoryConditionData.empty(7L);
        when(repository.save(7L, "E200", "[]")).thenReturn(cleared);
        assertThat(service.save(7L, "[]")).isEqualTo(cleared);
    }

    @Test
    void rejectsConditionAccessWithoutAnAuthenticatedAccount() {
        when(currentActor.authenticatedEmployeeNo()).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findByBidSeq(7L))
                .isInstanceOfSatisfying(ApplicationException.class,
                        error -> assertThat(error.errorType()).isEqualTo(ApplicationErrorType.UNAUTHORIZED));
        assertThatThrownBy(() -> service.save(7L, "[]"))
                .isInstanceOfSatisfying(ApplicationException.class,
                        error -> assertThat(error.errorType()).isEqualTo(ApplicationErrorType.UNAUTHORIZED));
        verifyNoInteractions(repository);
    }
}
