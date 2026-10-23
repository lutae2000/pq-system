package com.cheil.cheil_be.adapter.out.persistence.similarserviceperformance;

import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformance;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceCommand;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceSearch;
import com.cheil.cheil_be.application.similarserviceperformance.port.out.SimilarServicePerformanceRepository;

@Repository
@RequiredArgsConstructor
public class JpaSimilarServicePerformanceRepository implements SimilarServicePerformanceRepository {

    private final SimilarServicePerformanceJpaRepository repository;

    @Override
    public Page<SimilarServicePerformance> findAll(
            SimilarServicePerformanceSearch search, Pageable pageable) {
        var page = repository.search(
                search.keyword(),
                search.constructionType(),
                search.client(),
                search.contractFromDate(),
                search.contractToDate(),
                PageRequest.of(
                pageable.getPageNumber(), pageable.getPageSize(), Sort.by(
                        Sort.Order.desc("constructionToDate"),
                        Sort.Order.desc("companyPerformanceSeq")
                )
        ));
        return page.map(SimilarServicePerformanceEntity::toModel);
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
}
