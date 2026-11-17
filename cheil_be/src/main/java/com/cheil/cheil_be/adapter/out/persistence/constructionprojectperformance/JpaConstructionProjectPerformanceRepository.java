package com.cheil.cheil_be.adapter.out.persistence.constructionprojectperformance;

import static com.cheil.cheil_be.adapter.out.persistence.constructionprojectperformance.QConstructionProjectPerformanceEntity.constructionProjectPerformanceEntity;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;

import com.cheil.cheil_be.application.constructionprojectperformance.model.ConstructionProjectPerformance;
import com.cheil.cheil_be.application.constructionprojectperformance.model.ConstructionProjectPerformanceCommand;
import com.cheil.cheil_be.application.constructionprojectperformance.model.ConstructionProjectPerformanceSearch;
import com.cheil.cheil_be.application.constructionprojectperformance.port.out.ConstructionProjectPerformanceRepository;

@Repository
@RequiredArgsConstructor
public class JpaConstructionProjectPerformanceRepository implements ConstructionProjectPerformanceRepository {

    private final ConstructionProjectPerformanceJpaRepository repository;
    private final JPAQueryFactory queryFactory;
    private final JdbcClient jdbcClient;

    @Override
    public Page<ConstructionProjectPerformance> findAll(
            ConstructionProjectPerformanceSearch search, Pageable pageable) {
        BooleanBuilder predicate = toPredicate(search);
        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(
                        Sort.Order.desc("constructionToDate"),
                        Sort.Order.desc("constructionProjectPerformanceSeq")
                )
        );

        List<ConstructionProjectPerformanceEntity> content = queryFactory
                .selectFrom(constructionProjectPerformanceEntity)
                .where(predicate)
                .orderBy(
                        constructionProjectPerformanceEntity.constructionToDate.desc(),
                        constructionProjectPerformanceEntity.constructionProjectPerformanceSeq.desc()
                )
                .offset(sortedPageable.getOffset())
                .limit(sortedPageable.getPageSize())
                .fetch();

        return PageableExecutionUtils.getPage(
                content.stream().map(ConstructionProjectPerformanceEntity::toModel).toList(),
                sortedPageable,
                () -> queryFactory.select(constructionProjectPerformanceEntity.count())
                        .from(constructionProjectPerformanceEntity)
                        .where(predicate)
                        .fetchOne()
        );
    }

    private BooleanBuilder toPredicate(ConstructionProjectPerformanceSearch search) {
        BooleanBuilder predicate = new BooleanBuilder();
        if (search == null) {
            return predicate;
        }

        if (StringUtils.hasText(search.keyword())) {
            String keyword = "%" + search.keyword().trim().toLowerCase(Locale.ROOT) + "%";
            predicate.and(
                    constructionProjectPerformanceEntity.serviceName.lower().like(keyword)
                            .or(constructionProjectPerformanceEntity.constructionType.lower().like(keyword))
                            .or(constructionProjectPerformanceEntity.client.lower().like(keyword))
                            .or(constructionProjectPerformanceEntity.summary.lower().like(keyword))
                            .or(constructionProjectPerformanceEntity.remark.lower().like(keyword))
            );
        }
        if (StringUtils.hasText(search.constructionType())) {
            predicate.and(constructionProjectPerformanceEntity.constructionType
                    .like("%" + search.constructionType().trim() + "%"));
        }
        if (StringUtils.hasText(search.client())) {
            predicate.and(constructionProjectPerformanceEntity.client
                    .like("%" + search.client().trim() + "%"));
        }
        if (StringUtils.hasText(search.contractFromDate())) {
            predicate.and(constructionProjectPerformanceEntity.contractFromDate.goe(search.contractFromDate()));
        }
        if (StringUtils.hasText(search.contractToDate())) {
            predicate.and(constructionProjectPerformanceEntity.contractToDate.loe(search.contractToDate()));
        }

        return predicate;
    }

    @Override
    public Optional<ConstructionProjectPerformance> findById(Long id) {
        return repository.findById(id).map(ConstructionProjectPerformanceEntity::toModel);
    }

    @Override
    public long nextId() {
        if (!TransactionSynchronizationManager.isActualTransactionActive()
                || TransactionSynchronizationManager.isCurrentTransactionReadOnly()) {
            throw new IllegalStateException("A writable transaction is required to allocate a performance ID.");
        }
        jdbcClient.sql("LOCK TABLE construction_project_performances IN SHARE ROW EXCLUSIVE MODE").update();
        return jdbcClient.sql("SELECT COALESCE(MAX(construction_project_performance_seq), 0) + 1 FROM construction_project_performances")
                .query(Long.class).single();
    }

    @Override
    public ConstructionProjectPerformance save(Long id, ConstructionProjectPerformanceCommand command) {
        ConstructionProjectPerformanceEntity entity = repository.findById(id)
                .orElseGet(() -> new ConstructionProjectPerformanceEntity(id, command));
        entity.update(command);
        return repository.save(entity).toModel();
    }

    @Override
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
