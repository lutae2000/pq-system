package com.cheil.cheil_be.application.companyperformance.service;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceHwpxGenerateRequest;
import com.cheil.cheil_be.application.engineerperformancedoc.service.HwpxDocumentGenerationService;
import com.cheil.cheil_be.domain.companyperformance.CompanyPerformance;
import com.cheil.cheil_be.adapter.out.persistence.companyperformance.CompanyPerformanceDocumentTargetEntity;
import com.cheil.cheil_be.adapter.out.persistence.companyperformance.CompanyPerformanceDocumentTargetJpaRepository;

/** 회사실적 문서 생성에 필요한 대상 조회와 요청 검증을 담당한다. */
@Service
@RequiredArgsConstructor
public class CompanyPerformanceHwpxGenerationService {

    private final CompanyPerformanceAdminService companyPerformanceAdminService;
    private final HwpxDocumentGenerationService hwpxDocumentGenerationService;
    private final CompanyPerformanceDocumentTargetJpaRepository targetRepository;
    private final JdbcClient jdbcClient;

    public byte[] generate(MultipartFile template, CompanyPerformanceHwpxGenerateRequest request) {
        validate(template, request);
        Map<Long, Integer> displayOrders = targetRepository.findByBidSeqOrderByTargetId(request.bidSeq()).stream()
                .collect(java.util.stream.Collectors.toMap(
                        CompanyPerformanceDocumentTargetEntity::getCompanyPerformanceSeq,
                        target -> target.getDisplayOrder() == null ? Integer.MAX_VALUE : target.getDisplayOrder(),
                        Math::min));
        List<CompanyPerformance> performances = request.companyPerformanceSeqs().stream()
                .distinct()
                .sorted(java.util.Comparator.comparing(seq -> displayOrders.getOrDefault(seq, Integer.MAX_VALUE)))
                .map(companyPerformanceAdminService::findById)
                .toList();
        List<Long> performanceSeqs = performances.stream()
                .map(CompanyPerformance::seq)
                .toList();
        return hwpxDocumentGenerationService.renderCompanyPerformances(
                template,
                performances,
                findContractPeriods(performanceSeqs),
                findJobRatios(performanceSeqs),
                findJobTypeNames(performances),
                request.mappings());
    }

    private Map<Long, String> findContractPeriods(List<Long> seqs) {
        if (seqs.isEmpty()) return Map.of();
        Map<Long, String> result = new LinkedHashMap<>();
        jdbcClient.sql("""
                        SELECT seq, contract_from_date, contract_to_date
                        FROM company_performance_contract_periods
                        WHERE seq IN (:seqs)
                        ORDER BY seq, sort_seq NULLS LAST, contract_from_date NULLS LAST, id
                        """)
                .param("seqs", seqs)
                .query((rs, rowNum) -> {
                    String from = rs.getString("contract_from_date");
                    String to = rs.getString("contract_to_date");
                    if (StringUtils.hasText(from) && StringUtils.hasText(to)) {
                        result.merge(rs.getLong("seq"), from + " ~ " + to, (current, next) -> current + "\n" + next);
                    }
                    return rs.getLong("seq");
                })
                .list();
        return result;
    }

    private Map<Long, String> findJobRatios(List<Long> seqs) {
        if (seqs.isEmpty()) return Map.of();
        return jdbcClient.sql("""
                        SELECT seq, job_ratio
                        FROM company_performances
                        WHERE seq IN (:seqs)
                        """)
                .param("seqs", seqs)
                .query((rs, rowNum) -> Map.entry(rs.getLong("seq"), rs.getString("job_ratio")))
                .list()
                .stream()
                .collect(java.util.stream.Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (first, ignored) -> first));
    }

    private Map<String, String> findJobTypeNames(List<CompanyPerformance> performances) {
        List<String> codes = performances.stream()
                .map(CompanyPerformance::jobType)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
        if (codes.isEmpty()) return Map.of();
        return jdbcClient.sql("""
                        SELECT level2_code, code_name
                        FROM common_codes
                        WHERE code_level = 2
                          AND level1_code = 'ST'
                          AND level2_code IN (:codes)
                        """)
                .param("codes", codes)
                .query((rs, rowNum) -> Map.entry(rs.getString("level2_code"), rs.getString("code_name")))
                .list()
                .stream()
                .collect(java.util.stream.Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (first, ignored) -> first));
    }

    private void validate(MultipartFile template, CompanyPerformanceHwpxGenerateRequest request) {
        if (template == null || template.isEmpty() || request == null || request.bidSeq() == null
                || request.companyPerformanceSeqs() == null || request.companyPerformanceSeqs().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "HWPX 양식과 회사실적 대상을 선택해 주세요.");
        }
        if (!StringUtils.hasText(template.getOriginalFilename())
                || !template.getOriginalFilename().toLowerCase().endsWith(".hwpx")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "HWPX 양식을 업로드해 주세요.");
        }
    }
}
