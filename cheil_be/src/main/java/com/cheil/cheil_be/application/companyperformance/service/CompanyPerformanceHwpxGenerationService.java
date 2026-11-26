package com.cheil.cheil_be.application.companyperformance.service;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.unauthorized;

import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceHwpxGenerateRequest;
import com.cheil.cheil_be.application.common.port.out.AuthenticatedAccountPort;
import com.cheil.cheil_be.application.engineerperformancedoc.service.HwpxDocumentGenerationService;
import com.cheil.cheil_be.domain.companyperformance.CompanyPerformance;
import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceDocumentTarget;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceDocumentTargetRepository;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceHwpxDataRepository;

/** 회사실적 문서 생성에 필요한 대상 조회와 요청 검증을 담당한다. */
@Service
@RequiredArgsConstructor
public class CompanyPerformanceHwpxGenerationService {

    private final CompanyPerformanceAdminService companyPerformanceAdminService;
    private final HwpxDocumentGenerationService hwpxDocumentGenerationService;
    private final CompanyPerformanceDocumentTargetRepository targetRepository;
    private final CompanyPerformanceHwpxDataRepository hwpxDataRepository;
    private final AuthenticatedAccountPort authenticatedAccount;

    public byte[] generate(MultipartFile template, CompanyPerformanceHwpxGenerateRequest request) {
        validate(template, request);
        String employeeNo = authenticatedAccount.authenticatedEmployeeNo()
                .orElseThrow(() -> unauthorized("로그인한 계정으로 회사실적 문서를 생성할 수 있습니다."));
        Map<Long, Integer> displayOrders = targetRepository.findByBidSeqAndEmployeeNo(request.bidSeq(), employeeNo).stream()
                .collect(java.util.stream.Collectors.toMap(
                        CompanyPerformanceDocumentTarget::companyPerformanceSeq,
                        target -> target.displayOrder() == null ? Integer.MAX_VALUE : target.displayOrder(),
                        Math::min));
        List<CompanyPerformance> performances = request.companyPerformanceSeqs().stream()
                .distinct()
                .sorted(java.util.Comparator.comparing(seq -> displayOrders.getOrDefault(seq, Integer.MAX_VALUE)))
                .map(companyPerformanceAdminService::findById)
                .toList();
        if (performances.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "문서로 생성할 회사실적을 찾을 수 없습니다.");
        }
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
        return seqs.isEmpty() ? Map.of() : hwpxDataRepository.findContractPeriods(seqs);
    }

    private Map<Long, String> findJobRatios(List<Long> seqs) {
        return seqs.isEmpty() ? Map.of() : hwpxDataRepository.findJobRatios(seqs);
    }

    private Map<String, String> findJobTypeNames(List<CompanyPerformance> performances) {
        List<String> codes = performances.stream()
                .map(CompanyPerformance::jobType)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
        return codes.isEmpty() ? Map.of() : hwpxDataRepository.findJobTypeNames(codes);
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
