package com.cheil.cheil_be.application.companyperformance.service;

import java.util.ArrayList;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
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
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceResponse;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceDocumentTargetCondition;
import org.springframework.jdbc.core.simple.JdbcClient;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceRepository;

@Service
@RequiredArgsConstructor
public class CompanyPerformanceDocumentTargetService {

    private final CompanyPerformanceDocumentTargetJpaRepository targetRepository;
    private final CompanyPerformanceRepository companyPerformanceRepository;
    private final JdbcClient jdbcClient;

    private static final Map<String, String> GENERAL_COLUMNS = Map.of(
            "C0101C1", "cp.job_name", "C0102C1", "cp.client_kind", "C0104C1", "cp.contract_from_date",
            "C0105C1", "cp.contract_to_date", "C0107C1", "cp.contract_amt", "C0108C1", "cp.own_amt",
            "C0109C1", "cp.job_type", "C0110C1", "cp.summary");
    @Transactional(readOnly = true)
    public List<CompanyPerformanceDocumentTargetResponse> findByBidSeq(Long bidSeq) {
        var targets = targetRepository.findByBidSeqOrderByTargetId(requiredBidSeq(bidSeq));
        Map<Long, CompanyPerformanceResponse> performances = companyPerformanceRepository.findByIds(
                        targets.stream().map(CompanyPerformanceDocumentTargetEntity::getCompanyPerformanceSeq).toList())
                .stream()
                .map(CompanyPerformanceResponse::from)
                .collect(Collectors.toMap(CompanyPerformanceResponse::seq, Function.identity()));
        return targets.stream()
                .map(target -> new CompanyPerformanceDocumentTargetResponse(target.getTargetId(), target.getBidSeq(), target.getCompanyPerformanceSeq(), performances.get(target.getCompanyPerformanceSeq())))
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
        var newTargets = distinctSeqs.stream()
                .filter(seq -> !existingSeqs.contains(seq))
                .map(seq -> new CompanyPerformanceDocumentTargetEntity(requiredBidSeq, seq))
                .toList();
        targetRepository.saveAll(newTargets);

        return findByBidSeq(requiredBidSeq);
    }

    @Transactional
    public List<CompanyPerformanceDocumentTargetResponse> addByConditions(Long bidSeq, List<CompanyPerformanceDocumentTargetCondition> conditions) {
        Long requiredBidSeq = requiredBidSeq(bidSeq);
        if (conditions == null || conditions.isEmpty()) return findByBidSeq(requiredBidSeq);
        Map<String, Object> params = new java.util.HashMap<>();
        List<String> fragments = new ArrayList<>();
        for (int i = 0; i < conditions.size(); i++) {
            CompanyPerformanceDocumentTargetCondition condition = conditions.get(i);
            String fragment = conditionFragment(condition, params, i);
            if (!fragment.isBlank()) {
                if (!fragments.isEmpty()) fragments.add(" " + ("OR".equalsIgnoreCase(condition.logicalOperator()) ? "OR" : "AND") + " ");
                fragments.add(fragment);
            }
        }
        if (fragments.isEmpty()) return findByBidSeq(requiredBidSeq);
        String sql = "SELECT cp.seq FROM company_performances cp WHERE NOT EXISTS (SELECT 1 FROM pq_company_performance_document_targets t WHERE t.bid_seq = :bidSeq AND t.company_performance_seq = cp.seq) AND (" + String.join("", fragments) + ")";
        params.put("bidSeq", requiredBidSeq);
        List<Long> seqs = jdbcClient.sql(sql).params(params).query(Long.class).list();
        return add(requiredBidSeq, seqs);
    }

    private String conditionFragment(CompanyPerformanceDocumentTargetCondition c, Map<String, Object> params, int i) {
        String type = c.conditionType() == null ? "" : c.conditionType();
        if ("constructionKind".equals(type)) {
            if (c.level1Code() == null || c.level1Code().isBlank()) return "";
            params.put("l1" + i, c.level1Code()); params.put("l2" + i, c.level2Code()); params.put("l3" + i, c.level3Code());
            return "EXISTS (SELECT 1 FROM company_performance_construction_kinds k" + i + " WHERE k" + i + ".seq = cp.seq AND k" + i + ".level1_code = :l1" + i + " AND (:l2" + i + " IS NULL OR k" + i + ".level2_code = :l2" + i + ") AND (:l3" + i + " IS NULL OR k" + i + ".level3_code = :l3" + i + ") )";
        }
        if ("outline".equals(type)) {
            if ((c.outlineCategoryCode() == null || c.outlineCategoryCode().isBlank()) && (c.outlineSubcategoryCode() == null || c.outlineSubcategoryCode().isBlank())) return "";
            params.put("oc" + i, c.outlineCategoryCode()); params.put("os" + i, c.outlineSubcategoryCode());
            String comparison = comparison("o" + i + ".otln_cont", c, params, i);
            return "EXISTS (SELECT 1 FROM company_performance_outlines o" + i + " WHERE o" + i + ".seq = cp.seq AND (:oc" + i + " IS NULL OR o" + i + ".cate_code = :oc" + i + ") AND (:os" + i + " IS NULL OR o" + i + ".subcate_code = :os" + i + ")" + (comparison.isBlank() ? "" : " AND " + comparison) + ")";
        }
        String column = GENERAL_COLUMNS.get(c.generalCode());
        return column == null ? "" : comparison(column, c, params, i);
    }

    private String comparison(String column, CompanyPerformanceDocumentTargetCondition c, Map<String, Object> params, int i) {
        String value = c.value() == null ? "" : c.value().trim();
        String operator = c.operator() == null ? "=" : c.operator().toUpperCase(Locale.ROOT);
        if (value.isBlank()) return "";
        String left = "number".equals(c.valueType()) ? "CAST(NULLIF(REGEXP_REPLACE(CAST(" + column + " AS TEXT), '[^0-9.-]', '', 'g'), '') AS NUMERIC)" : column;
        Object typedValue = "number".equals(c.valueType())
                ? new BigDecimal(value.replace(",", ""))
                : "LIKE".equals(operator) ? "%" + value.toLowerCase(Locale.ROOT) + "%" : value;
        params.put("v" + i, typedValue);
        if ("BETWEEN".equals(operator)) {
            Object typedValueTo = "number".equals(c.valueType())
                    ? new BigDecimal((c.valueTo() == null ? "" : c.valueTo()).replace(",", ""))
                    : c.valueTo();
            params.put("vt" + i, typedValueTo);
            return left + " BETWEEN :v" + i + " AND :vt" + i;
        }
        return "LIKE".equals(operator) ? "LOWER(CAST(" + column + " AS TEXT)) LIKE :v" + i : left + " " + operator + " :v" + i;
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

    private Long requiredBidSeq(Long bidSeq) {
        if (bidSeq == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bidSeq는 필수입니다.");
        return bidSeq;
    }
}
