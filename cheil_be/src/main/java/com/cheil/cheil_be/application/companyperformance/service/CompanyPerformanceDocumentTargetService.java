package com.cheil.cheil_be.application.companyperformance.service;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;
import static com.cheil.cheil_be.application.common.exception.ApplicationException.notFound;
import static com.cheil.cheil_be.application.common.exception.ApplicationException.unauthorized;
import static com.cheil.cheil_be.application.common.validation.InputValues.requiredPositive;

import com.cheil.cheil_be.application.common.port.out.AuthenticatedAccountPort;
import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceDocumentTarget;
import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceDocumentTargetDetails;
import com.cheil.cheil_be.application.companyperformance.port.in.CompanyPerformanceDocumentTargetsUseCase;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceDocumentTargetQueryRepository;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceDocumentTargetRepository;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceRepository;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.port.out.BidSelectionLock;
import com.cheil.cheil_be.domain.companyperformance.CompanyPerformance;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompanyPerformanceDocumentTargetService implements CompanyPerformanceDocumentTargetsUseCase {
    private final CompanyPerformanceDocumentTargetRepository targetRepository;
    private final CompanyPerformanceRepository companyPerformanceRepository;
    private final CompanyPerformanceDocumentTargetQueryRepository targetQueryRepository;
    private final BidSelectionLock selectionLock;
    private final AuthenticatedAccountPort authenticatedAccount;

    @Override
    @Transactional(readOnly = true)
    public List<CompanyPerformanceDocumentTargetDetails> findByBidSeq(Long bidSeq) {
        return findDetails(requiredPositive(bidSeq, "bidSeq"), requireEmployeeNo());
    }

    @Override
    @Transactional
    public List<CompanyPerformanceDocumentTargetDetails> add(Long bidSeq, List<Long> companyPerformanceSeqs) {
        Long requiredBidSeq = requiredPositive(bidSeq, "bidSeq");
        String employeeNo = requireEmployeeNo();
        if (companyPerformanceSeqs == null || companyPerformanceSeqs.isEmpty()) return findDetails(requiredBidSeq, employeeNo);
        List<Long> distinctSeqs = companyPerformanceSeqs.stream().distinct().toList();
        if (distinctSeqs.stream().anyMatch(Objects::isNull)) throw badRequest("회사실적 seq는 필수입니다.");
        if (companyPerformanceRepository.findByIds(distinctSeqs).size() != distinctSeqs.size()) {
            throw badRequest("선택한 회사실적을 찾을 수 없습니다.");
        }
        selectionLock.lock(requiredBidSeq);
        var existing = targetRepository.findByBidSeqAndEmployeeNo(requiredBidSeq, employeeNo);
        var existingSeqs = existing.stream().map(CompanyPerformanceDocumentTarget::companyPerformanceSeq).collect(Collectors.toSet());
        int order = existing.stream().map(CompanyPerformanceDocumentTarget::displayOrder).filter(Objects::nonNull)
                .max(Integer::compareTo).orElse(existing.size()) + 1;
        var next = new ArrayList<>(existing);
        for (Long seq : distinctSeqs) {
            if (!existingSeqs.contains(seq)) next.add(new CompanyPerformanceDocumentTarget(null, requiredBidSeq, seq, order++));
        }
        targetRepository.save(requiredBidSeq, employeeNo, next);
        return findDetails(requiredBidSeq, employeeNo);
    }

    @Override
    @Transactional
    public List<CompanyPerformanceDocumentTargetDetails> addByConditions(Long bidSeq, List<ProjectHistoryCondition> conditions) {
        Long requiredBidSeq = requiredPositive(bidSeq, "bidSeq");
        if (conditions == null || conditions.isEmpty()) return findDetails(requiredBidSeq, requireEmployeeNo());
        return add(requiredBidSeq, targetQueryRepository.findMatchingPerformanceSeqs(conditions));
    }

    @Override
    @Transactional
    public void replaceByConditions(Long bidSeq, List<ProjectHistoryCondition> conditions) {
        Long requiredBidSeq = requiredPositive(bidSeq, "bidSeq");
        String employeeNo = requireEmployeeNo();
        if (conditions == null) throw badRequest("적용할 조건 목록이 필요합니다.");
        List<Long> seqs = targetQueryRepository.findMatchingPerformanceSeqs(conditions);
        var targets = new ArrayList<CompanyPerformanceDocumentTarget>(seqs.size());
        for (Long seq : seqs) {
            targets.add(new CompanyPerformanceDocumentTarget(null, requiredBidSeq, seq, targets.size() + 1));
        }
        selectionLock.lock(requiredBidSeq);
        targetRepository.save(requiredBidSeq, employeeNo, targets);
    }

    @Override
    @Transactional
    public void delete(Long bidSeq, Long targetId) {
        Long requiredBidSeq = requiredPositive(bidSeq, "bidSeq");
        String employeeNo = requireEmployeeNo();
        selectionLock.lock(requiredBidSeq);
        var targets = new ArrayList<>(targetRepository.findByBidSeqAndEmployeeNo(requiredBidSeq, employeeNo));
        if (!targets.removeIf(target -> targetId.equals(target.targetId()))) {
            throw notFound("회사실적 문서 대상을 찾을 수 없습니다.");
        }
        targetRepository.save(requiredBidSeq, employeeNo, targets);
    }

    @Override
    @Transactional
    public void updateDisplayOrder(Long bidSeq, Long targetId, Integer displayOrder) {
        Long requiredBidSeq = requiredPositive(bidSeq, "bidSeq");
        String employeeNo = requireEmployeeNo();
        if (displayOrder == null || displayOrder < 1) throw badRequest("순번은 1 이상의 정수로 입력해 주세요.");
        selectionLock.lock(requiredBidSeq);
        var targets = new ArrayList<>(targetRepository.findByBidSeqAndEmployeeNo(requiredBidSeq, employeeNo));
        for (int index = 0; index < targets.size(); index++) {
            var target = targets.get(index);
            if (targetId.equals(target.targetId())) {
                targets.set(index, new CompanyPerformanceDocumentTarget(targetId, requiredBidSeq, target.companyPerformanceSeq(), displayOrder));
                targetRepository.save(requiredBidSeq, employeeNo, targets);
                return;
            }
        }
        throw notFound("회사실적 문서 대상을 찾을 수 없습니다.");
    }

    private List<CompanyPerformanceDocumentTargetDetails> findDetails(Long bidSeq, String employeeNo) {
        var targets = targetRepository.findByBidSeqAndEmployeeNo(bidSeq, employeeNo);
        if (targets.isEmpty()) return List.of();
        var performances = companyPerformanceRepository.findByIds(
                        targets.stream().map(CompanyPerformanceDocumentTarget::companyPerformanceSeq).toList())
                .stream().collect(Collectors.toMap(CompanyPerformance::seq, Function.identity()));
        return targets.stream()
                .map(target -> new CompanyPerformanceDocumentTargetDetails(target, performances.get(target.companyPerformanceSeq())))
                .sorted(Comparator.comparing(row -> row.companyPerformance() == null ? null : row.companyPerformance().contractToDate(),
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    private String requireEmployeeNo() {
        return authenticatedAccount.authenticatedEmployeeNo()
                .orElseThrow(() -> unauthorized("로그인한 계정으로 회사실적 문서 대상을 관리할 수 있습니다."));
    }
}
