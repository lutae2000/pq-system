package com.cheil.cheil_be.adapter.out.persistence.similarserviceperformance;

import static com.cheil.cheil_be.adapter.out.persistence.similarserviceperformance.QSimilarServicePerformanceEntity.similarServicePerformanceEntity;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;

import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformance;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceCommand;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceSearch;
import com.cheil.cheil_be.application.similarserviceperformance.port.out.SimilarServicePerformanceRepository;

@Repository
@RequiredArgsConstructor
public class JpaSimilarServicePerformanceRepository implements SimilarServicePerformanceRepository {

    private final SimilarServicePerformanceJpaRepository repository;
    private final JPAQueryFactory queryFactory;

    @Override
    public Page<SimilarServicePerformance> findAll(
            SimilarServicePerformanceSearch search, Pageable pageable) {
        BooleanBuilder predicate = toPredicate(search);
        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(
                        Sort.Order.desc("constructionToDate"),
                        Sort.Order.desc("companyPerformanceSeq")
                )
        );

        List<SimilarServicePerformanceEntity> content = queryFactory
                .selectFrom(similarServicePerformanceEntity)
                .where(predicate)
                .orderBy(
                        similarServicePerformanceEntity.constructionToDate.desc(),
                        similarServicePerformanceEntity.companyPerformanceSeq.desc()
                )
                .offset(sortedPageable.getOffset())
                .limit(sortedPageable.getPageSize())
                .fetch();

        return PageableExecutionUtils.getPage(
                content.stream().map(SimilarServicePerformanceEntity::toModel).toList(),
                sortedPageable,
                () -> queryFactory.select(similarServicePerformanceEntity.count())
                        .from(similarServicePerformanceEntity)
                        .where(predicate)
                        .fetchOne()
        );
    }

    private BooleanBuilder toPredicate(SimilarServicePerformanceSearch search) {
        BooleanBuilder predicate = new BooleanBuilder();
        if (search == null) {
            return predicate;
        }

        if (StringUtils.hasText(search.keyword())) {
            String keyword = "%" + search.keyword().trim().toLowerCase(Locale.ROOT) + "%";
            predicate.and(
                    similarServicePerformanceEntity.serviceName.lower().like(keyword)
                            .or(similarServicePerformanceEntity.constructionType.lower().like(keyword))
                            .or(similarServicePerformanceEntity.client.lower().like(keyword))
                            .or(similarServicePerformanceEntity.summary.lower().like(keyword))
                            .or(similarServicePerformanceEntity.remark.lower().like(keyword))
            );
        }
        if (StringUtils.hasText(search.constructionType())) {
            predicate.and(similarServicePerformanceEntity.constructionType
                    .like("%" + search.constructionType().trim() + "%"));
        }
        if (StringUtils.hasText(search.client())) {
            predicate.and(similarServicePerformanceEntity.client
                    .like("%" + search.client().trim() + "%"));
        }
        if (StringUtils.hasText(search.contractFromDate())) {
            predicate.and(similarServicePerformanceEntity.contractFromDate.goe(search.contractFromDate()));
        }
        if (StringUtils.hasText(search.contractToDate())) {
            predicate.and(similarServicePerformanceEntity.contractToDate.loe(search.contractToDate()));
        }

        return predicate;
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
