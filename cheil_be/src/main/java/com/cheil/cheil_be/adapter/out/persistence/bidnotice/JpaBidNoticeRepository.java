package com.cheil.cheil_be.adapter.out.persistence.bidnotice;

import static com.cheil.cheil_be.adapter.out.persistence.bidnotice.QBidNoticeEntity.bidNoticeEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQueryFactory;

import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeSearchCondition;
import com.cheil.cheil_be.application.bidnotice.port.out.BidNoticeRepository;
import com.cheil.cheil_be.domain.bidnotice.BidNotice;

@Repository
@RequiredArgsConstructor
public class JpaBidNoticeRepository implements BidNoticeRepository {

    private static final DateTimeFormatter DATETIME_KEY_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmm");

    private final BidNoticeJpaRepository bidNoticeJpaRepository;
    private final JPAQueryFactory queryFactory;

    @Override
    public Page<BidNotice> findAll(BidNoticeSearchCondition condition, Pageable pageable) {
        BooleanBuilder predicate = toPredicate(condition);
        var query = queryFactory
                .selectFrom(bidNoticeEntity)
                .where(predicate)
                .orderBy(
                        bidNoticeEntity.bidDate.desc().nullsLast(),
                        bidNoticeEntity.bidSeq.desc()
                );

        if (pageable.isPaged()) {
            query.offset(pageable.getOffset()).limit(pageable.getPageSize());
        }

        List<BidNotice> content = query.fetch().stream()
                .map(BidNoticeEntity::toDomain)
                .toList();

        return PageableExecutionUtils.getPage(
                content,
                pageable,
                () -> queryFactory.select(bidNoticeEntity.count())
                        .from(bidNoticeEntity)
                        .where(predicate)
                        .fetchOne()
        );
    }

    @Override
    public List<BidNotice> findAllByCalendarDateBetween(LocalDate startDate, LocalDate endDate, String departmentCode) {
        BooleanBuilder predicate = new BooleanBuilder();
        predicate.and(calendarDateBetween(startDate, endDate));
        addEqualsIfPresent(predicate, bidNoticeEntity.departmentCode, normalizeDepartmentCode(departmentCode));

        return queryFactory
                .selectFrom(bidNoticeEntity)
                .where(predicate)
                .orderBy(
                        bidNoticeEntity.pqSubmitDate.asc().nullsLast(),
                        bidNoticeEntity.bidDate.asc().nullsLast(),
                        bidNoticeEntity.bidSeq.asc()
                )
                .fetch()
                .stream()
                .map(BidNoticeEntity::toDomain)
                .toList();
    }

    @Override
    public Optional<BidNotice> findByBidSeq(Long bidSeq) {
        return bidNoticeJpaRepository.findById(bidSeq).map(BidNoticeEntity::toDomain);
    }

    @Override
    public boolean existsByBidSeq(Long bidSeq) {
        return bidNoticeJpaRepository.existsById(bidSeq);
    }

    @Override
    public BidNotice save(BidNotice bidNotice) {
        return bidNoticeJpaRepository.save(BidNoticeEntity.from(bidNotice)).toDomain();
    }

    @Override
    public void deleteByBidSeq(Long bidSeq) {
        bidNoticeJpaRepository.deleteById(bidSeq);
    }

    private BooleanBuilder toPredicate(BidNoticeSearchCondition condition) {
        BooleanBuilder predicate = new BooleanBuilder();
        if (condition == null) {
            return predicate;
        }

        if (StringUtils.hasText(condition.keyword())) {
            String keyword = "%" + condition.keyword().trim().toLowerCase(Locale.ROOT) + "%";
            predicate.and(
                    bidNoticeEntity.projectName.lower().like(keyword)
                            .or(bidNoticeEntity.orderClient.lower().like(keyword))
                            .or(bidNoticeEntity.primeContractor.lower().like(keyword))
                            .or(bidNoticeEntity.remark.lower().like(keyword))
            );
        }

        addEqualsIfPresent(predicate, bidNoticeEntity.departmentCode, condition.departmentCode());
        addEqualsIfPresent(predicate, bidNoticeEntity.superDecideEmpno, condition.superDecideEmpno());
        addEqualsIfPresent(predicate, bidNoticeEntity.bidType, condition.bidType());
        addEqualsIfPresent(predicate, bidNoticeEntity.businessType, condition.businessType());
        addEqualsIfPresent(predicate, bidNoticeEntity.fieldOfWorkCode, condition.fieldOfWorkCode());
        addEqualsIfPresent(predicate, bidNoticeEntity.scopeOfWorkCode, condition.scopeOfWorkCode());
        addDateRangeIfPresent(predicate, bidNoticeEntity.bidClosingDate, condition.bidClosingDateFrom(), condition.bidClosingDateTo());
        addDateRangeIfPresent(predicate, bidNoticeEntity.bidDate, condition.bidDateFrom(), condition.bidDateTo());
        addDateRangeIfPresent(predicate, bidNoticeEntity.pqSubmitDate, condition.pqSubmitDateFrom(), condition.pqSubmitDateTo());
        addEqualsIfPresent(predicate, bidNoticeEntity.bidSuccessYn, condition.bidSuccessYn());

        return predicate;
    }

    private BooleanExpression calendarDateBetween(LocalDate startDate, LocalDate endDate) {
        String from = dateTimeKey(startDate.atStartOfDay());
        String to = dateTimeKey(endDate.plusDays(1).atStartOfDay());

        return bidNoticeEntity.pqSubmitDate.goe(from)
                .and(bidNoticeEntity.pqSubmitDate.lt(to))
                .or(bidNoticeEntity.bidDate.goe(from)
                        .and(bidNoticeEntity.bidDate.lt(to)));
    }

    private void addEqualsIfPresent(BooleanBuilder predicate, StringPath path, String value) {
        if (StringUtils.hasText(value)) {
            predicate.and(path.eq(value.trim()));
        }
    }

    private void addDateRangeIfPresent(BooleanBuilder predicate, StringPath path, LocalDate from, LocalDate to) {
        if (from != null) {
            predicate.and(path.goe(dateTimeKey(from.atStartOfDay())));
        }
        if (to != null) {
            predicate.and(path.lt(dateTimeKey(to.plusDays(1).atStartOfDay())));
        }
    }

    private String normalizeDepartmentCode(String departmentCode) {
        if (!StringUtils.hasText(departmentCode) || "All".equalsIgnoreCase(departmentCode.trim())) {
            return null;
        }
        return departmentCode.trim();
    }

    private String dateTimeKey(LocalDateTime value) {
        return value == null ? null : DATETIME_KEY_FORMAT.format(value);
    }
}
