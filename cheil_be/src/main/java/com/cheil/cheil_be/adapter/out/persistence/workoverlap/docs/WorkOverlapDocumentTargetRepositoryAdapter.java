package com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import com.cheil.cheil_be.application.workoverlap.docs.model.WorkOverlapDocumentTarget;
import com.cheil.cheil_be.application.workoverlap.docs.port.out.WorkOverlapDocumentTargetRepository;

@Repository
@RequiredArgsConstructor
public class WorkOverlapDocumentTargetRepositoryAdapter implements WorkOverlapDocumentTargetRepository {
    private final WorkOverlapDocumentTargetJpaRepository repository;

    public List<WorkOverlapDocumentTarget> find(String workDutyId, Long bidSeq, String engineerId) {
        return repository.findByWorkDutyIdAndBidSeqAndEngineerIdOrderByDisplayOrderAscTargetIdAsc(workDutyId, bidSeq, engineerId)
                .stream().map(this::toModel).toList();
    }

    public List<WorkOverlapDocumentTarget> replace(String workDutyId, Long bidSeq, String engineerId, List<WorkOverlapDocumentTarget> targets) {
        repository.deleteByWorkDutyIdAndBidSeqAndEngineerId(workDutyId, bidSeq, engineerId);
        return repository.saveAll(targets.stream().map(target -> new WorkOverlapDocumentTargetEntity(
                bidSeq, workDutyId, engineerId, target.contractNo(), target.displayOrder(), target.responsibility())).toList())
                .stream().map(this::toModel).toList();
    }

    public void delete(String workDutyId, Long bidSeq, String engineerId, String contractNo) {
        repository.deleteByWorkDutyIdAndBidSeqAndEngineerIdAndContractNo(workDutyId, bidSeq, engineerId, contractNo);
    }

    private WorkOverlapDocumentTarget toModel(WorkOverlapDocumentTargetEntity entity) {
        return new WorkOverlapDocumentTarget(entity.getTargetId(), entity.getBidSeq(), entity.getWorkDutyId(),
                entity.getEngineerId(), entity.getContractNo(), entity.getDisplayOrder(), entity.getResponsibility());
    }
}
