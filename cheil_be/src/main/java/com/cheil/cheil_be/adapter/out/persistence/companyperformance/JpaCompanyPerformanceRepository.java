package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import static com.cheil.cheil_be.adapter.out.persistence.companyperformance.QCompanyPerformanceEntity.companyPerformanceEntity;
import static com.cheil.cheil_be.adapter.out.persistence.companyperformance.QCompanyPerformanceDocumentTargetEntity.companyPerformanceDocumentTargetEntity;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;

import com.cheil.cheil_be.application.companyperformance.port.in.CompanyPerformanceSearchCondition;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceRepository;
import com.cheil.cheil_be.domain.companyperformance.CompanyPerformance;

@Repository
@RequiredArgsConstructor
public class JpaCompanyPerformanceRepository implements CompanyPerformanceRepository {

    private final CompanyPerformanceJpaRepository companyPerformanceJpaRepository;
    private final JPAQueryFactory queryFactory;

    @Override
    public Page<CompanyPerformance> findAll(CompanyPerformanceSearchCondition condition, Pageable pageable) {
        BooleanBuilder where = new BooleanBuilder();

        if (condition != null) {
            if (StringUtils.hasText(condition.keyword())) {
                String keyword = "%" + condition.keyword().trim().toLowerCase(Locale.ROOT) + "%";
                where.and(
                        companyPerformanceEntity.jobName.lower().like(keyword)
                                .or(companyPerformanceEntity.orderClient.lower().like(keyword))
                                .or(companyPerformanceEntity.summary.lower().like(keyword))
                                .or(companyPerformanceEntity.remark.lower().like(keyword))
                );
            }
            if (StringUtils.hasText(condition.businessTypeCode())) {
                where.and(companyPerformanceEntity.businessType.eq(condition.businessTypeCode().trim()));
            }
            if (StringUtils.hasText(condition.clientKindCode())) {
                where.and(companyPerformanceEntity.clientKind.eq(condition.clientKindCode().trim()));
            }
            if (condition.jobOwnYn() != null) {
                where.and(companyPerformanceEntity.jobOwnYn.eq(Boolean.TRUE.equals(condition.jobOwnYn()) ? "Y" : "N"));
            }
            if (StringUtils.hasText(condition.jobFinishYn())) {
                where.and(companyPerformanceEntity.jobFinishYn.trim().upper().eq(condition.jobFinishYn().trim().toUpperCase(Locale.ROOT)));
            }
            if (StringUtils.hasText(condition.contractFromDate())) {
                where.and(companyPerformanceEntity.contractFromDate.goe(toDateText(condition.contractFromDate())));
            }
            if (StringUtils.hasText(condition.contractToDate())) {
                where.and(companyPerformanceEntity.contractToDate.loe(toDateText(condition.contractToDate())));
            }
            if (condition.excludeDocumentTargetBidSeq() != null) {
                where.and(com.querydsl.jpa.JPAExpressions.selectOne()
                        .from(companyPerformanceDocumentTargetEntity)
                        .where(companyPerformanceDocumentTargetEntity.bidSeq.eq(condition.excludeDocumentTargetBidSeq())
                                .and(companyPerformanceDocumentTargetEntity.companyPerformanceSeq.eq(companyPerformanceEntity.seq)))
                        .notExists());
            }
        }

        var query = queryFactory
                .selectFrom(companyPerformanceEntity)
                .where(where)
                .orderBy(
                        companyPerformanceEntity.contractToDate.asc().nullsLast(),
                        companyPerformanceEntity.seq.desc()
                );

        if (pageable.isPaged()) {
            query.offset(pageable.getOffset()).limit(pageable.getPageSize());
        }

        List<CompanyPerformance> content = query.fetch().stream()
                .map(CompanyPerformanceEntity::toDomain)
                .toList();

        return PageableExecutionUtils.getPage(
                content,
                pageable,
                () -> queryFactory.select(companyPerformanceEntity.count())
                        .from(companyPerformanceEntity)
                        .where(where)
                        .fetchOne()
        );
    }

    @Override
    public Optional<CompanyPerformance> findById(Long seq) {
        return companyPerformanceJpaRepository.findById(seq).map(CompanyPerformanceEntity::toDomain);
    }

    @Override
    public List<CompanyPerformance> findByIds(List<Long> seqs) {
        return companyPerformanceJpaRepository.findAllById(seqs).stream()
                .map(CompanyPerformanceEntity::toDomain)
                .toList();
    }

    @Override
    public CompanyPerformance save(CompanyPerformance companyPerformance) {
        CompanyPerformanceEntity entity = companyPerformance.seq() == null
                ? CompanyPerformanceEntity.from(companyPerformance)
                : companyPerformanceJpaRepository.findById(companyPerformance.seq())
                .map(existing -> {
                    existing.updateFrom(companyPerformance);
                    return existing;
                })
                .orElseGet(() -> CompanyPerformanceEntity.from(companyPerformance));

        return companyPerformanceJpaRepository.save(entity).toDomain();
    }

    @Override
    public void deleteById(Long seq) {
        companyPerformanceJpaRepository.deleteById(seq);
    }

    private String toDateText(String value) {
        return value.trim().replace("-", "");
    }
}
