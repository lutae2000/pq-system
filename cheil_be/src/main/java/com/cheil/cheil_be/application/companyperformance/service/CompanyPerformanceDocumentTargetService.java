package com.cheil.cheil_be.application.companyperformance.service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.out.persistence.companyperformance.CompanyPerformanceDocumentTargetEntity;
import com.cheil.cheil_be.adapter.out.persistence.companyperformance.CompanyPerformanceDocumentTargetJpaRepository;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceDocumentTargetResponse;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceDocumentTargetDisplayOrderRequest;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceResponse;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceDocumentTargetCondition;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceDocumentTargetQueryRepository;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceDocumentTargetQueryRepository.Condition;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceRepository;

@Service
@RequiredArgsConstructor
public class CompanyPerformanceDocumentTargetService {

    private final CompanyPerformanceDocumentTargetJpaRepository targetRepository;
    private final CompanyPerformanceRepository companyPerformanceRepository;
    private final CompanyPerformanceDocumentTargetQueryRepository targetQueryRepository;

    @Transactional(readOnly = true)
    public List<CompanyPerformanceDocumentTargetResponse> findByBidSeq(Long bidSeq) {
        var targets = targetRepository.findByBidSeqOrderByTargetId(requiredBidSeq(bidSeq));
        Map<Long, CompanyPerformanceResponse> performances = companyPerformanceRepository.findByIds(
                        targets.stream().map(CompanyPerformanceDocumentTargetEntity::getCompanyPerformanceSeq).toList())
                .stream()
                .map(CompanyPerformanceResponse::from)
                .collect(Collectors.toMap(CompanyPerformanceResponse::seq, Function.identity()));
        return targets.stream()
                .sorted(java.util.Comparator.comparing(CompanyPerformanceDocumentTargetEntity::getDisplayOrder,
                        java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder()))
                        .thenComparing(CompanyPerformanceDocumentTargetEntity::getTargetId))
                .map(target -> new CompanyPerformanceDocumentTargetResponse(
                        target.getTargetId(), target.getBidSeq(), target.getCompanyPerformanceSeq(),
                        target.getDisplayOrder(), performances.get(target.getCompanyPerformanceSeq())))
                .toList()
                .stream()
                .sorted(java.util.Comparator.comparing(
                        response -> response.companyPerformance() == null ? null : response.companyPerformance().contractToDate(),
                        java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                .toList();
    }

    @Transactional
    public List<CompanyPerformanceDocumentTargetResponse> add(Long bidSeq, List<Long> companyPerformanceSeqs) {
        Long requiredBidSeq = requiredBidSeq(bidSeq);
        if (companyPerformanceSeqs == null || companyPerformanceSeqs.isEmpty()) return findByBidSeq(requiredBidSeq);
        List<Long> distinctSeqs = companyPerformanceSeqs.stream().distinct().toList();
        if (distinctSeqs.stream().anyMatch(seq -> seq == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "회사실적 seq는 필수입니다.");
        }

        // 기존에는 입력된 실적마다 대상 목록을 다시 조회하고 저장했다. 대상 목록은 공고당
        // 한 번만 읽고, 중복이 아닌 항목만 일괄 저장해 조건 적용 시 반복 쿼리를 제거한다.
        var existingTargets = targetRepository.findByBidSeq(requiredBidSeq);
        var existingSeqs = existingTargets.stream()
                .map(CompanyPerformanceDocumentTargetEntity::getCompanyPerformanceSeq)
                .collect(java.util.stream.Collectors.toSet());
        int nextDisplayOrder = existingTargets.stream()
                .map(CompanyPerformanceDocumentTargetEntity::getDisplayOrder)
                .filter(java.util.Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(existingTargets.size()) + 1;
        java.util.concurrent.atomic.AtomicInteger displayOrder = new java.util.concurrent.atomic.AtomicInteger(nextDisplayOrder);
        var newTargets = distinctSeqs.stream()
                .filter(seq -> !existingSeqs.contains(seq))
                .map(seq -> new CompanyPerformanceDocumentTargetEntity(requiredBidSeq, seq, displayOrder.getAndIncrement()))
                .toList();
        targetRepository.saveAll(newTargets);

        return findByBidSeq(requiredBidSeq);
    }

    @Transactional
    public List<CompanyPerformanceDocumentTargetResponse> addByConditions(Long bidSeq, List<CompanyPerformanceDocumentTargetCondition> conditions) {
        Long requiredBidSeq = requiredBidSeq(bidSeq);
        if (conditions == null || conditions.isEmpty()) {
            return findByBidSeq(requiredBidSeq);
        }

        List<Condition> queryConditions = conditions.stream()
                .map(this::toQueryCondition)
                .toList();
        List<Long> seqs = targetQueryRepository.findUnselectedPerformanceSeqs(
                requiredBidSeq,
                queryConditions
        );
        return add(requiredBidSeq, seqs);
    }

    private Condition toQueryCondition(CompanyPerformanceDocumentTargetCondition condition) {
        return new Condition(
                condition.conditionType(),
                condition.logicalOperator(),
                condition.level1Code(),
                condition.level2Code(),
                condition.level3Code(),
                condition.generalCode(),
                condition.outlineCategoryCode(),
                condition.outlineSubcategoryCode(),
                condition.operator(),
                condition.value(),
                condition.valueTo(),
                condition.valueType()
        );
    }

    @Transactional
    public void delete(Long bidSeq, Long targetId) {
        CompanyPerformanceDocumentTargetEntity target = targetRepository.findById(targetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "회사 실적 문서 대상을 찾을 수 없습니다."));
        if (!target.getBidSeq().equals(requiredBidSeq(bidSeq))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "회사 실적 문서 대상을 찾을 수 없습니다.");
        }
        targetRepository.delete(target);
    }

    @Transactional
    public void updateDisplayOrder(Long bidSeq, Long targetId, CompanyPerformanceDocumentTargetDisplayOrderRequest request) {
        if (request == null || request.displayOrder() == null || request.displayOrder() < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "순번은 1 이상의 정수로 입력해 주세요.");
        }
        CompanyPerformanceDocumentTargetEntity target = targetRepository.findById(targetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "회사실적 문서 대상을 찾을 수 없습니다."));
        if (!target.getBidSeq().equals(requiredBidSeq(bidSeq))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "회사실적 문서 대상을 찾을 수 없습니다.");
        }
        target.setDisplayOrder(request.displayOrder());
        targetRepository.save(target);
    }

    private Long requiredBidSeq(Long bidSeq) {
        if (bidSeq == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bidSeq는 필수입니다.");
        return bidSeq;
    }
}
