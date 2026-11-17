package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceDocumentTarget;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceDocumentTargetRepository;

@Repository
@RequiredArgsConstructor
public class CompanyPerformanceDocumentTargetRepositoryAdapter implements CompanyPerformanceDocumentTargetRepository {
    private final CompanyPerformanceDocumentTargetJpaRepository repository;

    public List<CompanyPerformanceDocumentTarget> findByBidSeq(Long bidSeq) {
        return repository.findByBidSeqOrderByTargetId(bidSeq).stream().map(this::toModel).toList();
    }

    public Optional<CompanyPerformanceDocumentTarget> findById(Long targetId) {
        return repository.findById(targetId).map(this::toModel);
    }

    public void add(Long bidSeq, List<CompanyPerformanceDocumentTarget> targets) {
        repository.saveAll(targets.stream().map(target -> new CompanyPerformanceDocumentTargetEntity(
                bidSeq, target.companyPerformanceSeq(), target.displayOrder())).toList());
    }

    public void delete(Long targetId) {
        repository.deleteById(targetId);
    }

    public void updateDisplayOrder(Long targetId, Integer displayOrder) {
        CompanyPerformanceDocumentTargetEntity target = repository.findById(targetId).orElseThrow();
        target.setDisplayOrder(displayOrder);
        repository.save(target);
    }

    private CompanyPerformanceDocumentTarget toModel(CompanyPerformanceDocumentTargetEntity entity) {
        return new CompanyPerformanceDocumentTarget(entity.getTargetId(), entity.getBidSeq(),
                entity.getCompanyPerformanceSeq(), entity.getDisplayOrder());
    }
}
