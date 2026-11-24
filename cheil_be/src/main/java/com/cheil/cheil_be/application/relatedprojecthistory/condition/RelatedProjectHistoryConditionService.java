package com.cheil.cheil_be.application.relatedprojecthistory.condition;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.unauthorized;
import static com.cheil.cheil_be.application.common.validation.InputValues.requiredPositive;

import com.cheil.cheil_be.application.common.port.out.AuthenticatedAccountPort;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.port.in.RelatedProjectHistoryConditionUseCase;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.port.out.RelatedProjectHistoryConditionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 로그인한 계정의 공고별 관련 프로젝트 이력 조회 조건을 저장하고 조회한다. */
@Service
@RequiredArgsConstructor
public class RelatedProjectHistoryConditionService implements RelatedProjectHistoryConditionUseCase {

    private final RelatedProjectHistoryConditionRepository repository;
    private final AuthenticatedAccountPort authenticatedAccountPort;
    private final ProjectHistoryConditionJsonCodec conditionJsonCodec;

    @Override
    @Transactional(readOnly = true)
    public RelatedProjectHistoryConditionData findByBidSeq(Long bidSeq) {
        requiredPositive(bidSeq, "bidSeq");
        return repository.findByBidSeqAndEmployeeNo(bidSeq, requireEmployeeNo())
                .orElseGet(() -> RelatedProjectHistoryConditionData.empty(bidSeq));
    }

    @Override
    @Transactional
    public RelatedProjectHistoryConditionData save(Long bidSeq, String conditionsJson) {
        requiredPositive(bidSeq, "bidSeq");
        String employeeNo = requireEmployeeNo();
        return repository.save(bidSeq, employeeNo, conditionJsonCodec.normalize(conditionsJson));
    }

    private String requireEmployeeNo() {
        return authenticatedAccountPort.authenticatedEmployeeNo()
                .orElseThrow(() -> unauthorized("로그인한 계정으로 관련공사 참여이력 조건을 관리할 수 있습니다."));
    }
}
