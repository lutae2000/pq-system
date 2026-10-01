package com.cheil.cheil_be.adapter.out.persistence.similarserviceperformance;

import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformance;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceCommand;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformancePage;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceSearch;
import com.cheil.cheil_be.application.similarserviceperformance.port.out.SimilarServicePerformanceRepository;

@Repository
@RequiredArgsConstructor
public class JpaSimilarServicePerformanceRepository implements SimilarServicePerformanceRepository {

    private final SimilarServicePerformanceJpaRepository repository;

    @Override
    public SimilarServicePerformancePage findAll(SimilarServicePerformanceSearch search) {
        var page = repository.findAll(specification(search), PageRequest.of(
                search.page(), search.size(), Sort.by(
                        Sort.Order.desc("constructionToDate"),
                        Sort.Order.desc("companyPerformanceSeq")
                )
        ));
        return new SimilarServicePerformancePage(
                page.getContent().stream().map(SimilarServicePerformanceEntity::toModel).toList(),
                page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages(), page.isFirst(), page.isLast()
        );
    }

    @Override
    public Optional<SimilarServicePerformance> findById(Long id) {
        return repository.findById(id).map(SimilarServicePerformanceEntity::toModel);
    }

    @Override
    public long nextId() {
        return repository.nextId();
    }

    @Override
    public SimilarServicePerformance save(Long id, SimilarServicePerformanceCommand command) {
        SimilarServicePerformanceEntity entity = repository.findById(id)
                .orElseGet(() -> new SimilarServicePerformanceEntity(id, command));
        entity.update(command);
        return repository.save(entity).toModel();
    }

    @Override
    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    private Specification<SimilarServicePerformanceEntity> specification(SimilarServicePerformanceSearch search) {
        return (root, query, criteriaBuilder) -> {
            var predicate = criteriaBuilder.conjunction();
            if (search.keyword() != null) {
                String pattern = "%" + search.keyword() + "%";
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("serviceName"), "")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("constructionType"), "")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("client"), "")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("summary"), "")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("remark"), "")), pattern)
                ));
            }
            if (search.constructionType() != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(root.get("constructionType"), "%" + search.constructionType() + "%"));
            }
            if (search.client() != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(root.get("client"), "%" + search.client() + "%"));
            }
            if (search.contractFromDate() != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.greaterThanOrEqualTo(root.get("contractFromDate"), search.contractFromDate()));
            }
            if (search.contractToDate() != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.lessThanOrEqualTo(root.get("contractToDate"), search.contractToDate()));
            }
            return predicate;
        };
    }
}
