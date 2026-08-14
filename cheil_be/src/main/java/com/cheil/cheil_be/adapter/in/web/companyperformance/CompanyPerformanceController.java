package com.cheil.cheil_be.adapter.in.web.companyperformance;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.companyperformance.port.in.CompanyPerformanceSearchCondition;
import com.cheil.cheil_be.application.companyperformance.service.CompanyPerformanceAdminService;
import com.cheil.cheil_be.application.companyperformance.service.CompanyPerformanceContractPeriodQueryService;
import com.cheil.cheil_be.application.companyperformance.service.CompanyPerformanceConstructionKindQueryService;
import com.cheil.cheil_be.application.companyperformance.service.CompanyPerformanceEngineerQueryService;
import com.cheil.cheil_be.application.companyperformance.service.CompanyPerformanceOutlineQueryService;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;
import com.cheil.cheil_be.domain.companyperformance.CompanyPerformance;

@RestController
@RequestMapping("/pq/company-performances")
@RequiredArgsConstructor
public class CompanyPerformanceController {

    private final CompanyPerformanceAdminService companyPerformanceAdminService;
    private final CompanyPerformanceContractPeriodQueryService companyPerformanceContractPeriodQueryService;
    private final CompanyPerformanceConstructionKindQueryService companyPerformanceConstructionKindQueryService;
    private final CompanyPerformanceEngineerQueryService companyPerformanceEngineerQueryService;
    private final CompanyPerformanceOutlineQueryService companyPerformanceOutlineQueryService;

    /**
     * 회사 실적 목록을 조회한다.
     */
    @GetMapping
    public ResponseEntity<PageResponse<CompanyPerformanceResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String businessType,
            @RequestParam(required = false) String clientKind,
            @RequestParam(required = false) Boolean jobOwnYn,
            @RequestParam(required = false) String jobFinishYn,
            @RequestParam(required = false) String contractFromDate,
            @RequestParam(required = false) String contractToDate,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Page<CompanyPerformance> result = companyPerformanceAdminService.findAll(
                new CompanyPerformanceSearchCondition(
                        keyword,
                        businessType,
                        clientKind,
                        jobOwnYn,
                        jobFinishYn,
                        contractFromDate,
                        contractToDate
                ),
                PageRequests.of(page, size)
        );
        return ResponseEntity.ok(PageResponse.from(result, CompanyPerformanceResponse::from));
    }

    /**
     * 실적에 연결할 기술자 후보를 조회한다.
     */
    @GetMapping("/engineer-candidates")
    public ResponseEntity<List<CompanyPerformanceEngineerCandidateResponse>> listEngineerCandidates(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "30") Integer limit
    ) {
        return ResponseEntity.ok(companyPerformanceEngineerQueryService.findEngineerCandidates(keyword, limit));
    }

    /**
     * 회사 실적 단건을 조회한다.
     */
    @GetMapping("/{seq}")
    public ResponseEntity<CompanyPerformanceResponse> get(@PathVariable Long seq) {
        return ResponseEntity.ok(CompanyPerformanceResponse.from(companyPerformanceAdminService.findById(seq)));
    }

    /**
     * 계약기간 목록을 조회한다.
     */
    @GetMapping("/{seq}/contract-periods")
    public ResponseEntity<List<CompanyPerformanceContractPeriodResponse>> listContractPeriods(@PathVariable Long seq) {
        companyPerformanceAdminService.findById(seq);
        return ResponseEntity.ok(companyPerformanceContractPeriodQueryService.findByPerformanceSeq(seq));
    }

    /**
     * 계약기간을 추가한다.
     */
    @PostMapping("/{seq}/contract-periods")
    public ResponseEntity<CompanyPerformanceContractPeriodResponse> createContractPeriod(
            @PathVariable Long seq,
            @RequestBody CompanyPerformanceContractPeriodRequest request
    ) {
        companyPerformanceAdminService.findById(seq);
        return ResponseEntity.ok(companyPerformanceContractPeriodQueryService.create(seq, request));
    }

    /**
     * 계약기간을 수정한다.
     */
    @PutMapping("/{seq}/contract-periods/{contractPeriodId}")
    public ResponseEntity<CompanyPerformanceContractPeriodResponse> updateContractPeriod(
            @PathVariable Long seq,
            @PathVariable Long contractPeriodId,
            @RequestBody CompanyPerformanceContractPeriodRequest request
    ) {
        companyPerformanceAdminService.findById(seq);
        return ResponseEntity.ok(companyPerformanceContractPeriodQueryService.update(seq, contractPeriodId, request));
    }

    /**
     * 계약기간을 삭제한다.
     */
    @DeleteMapping("/{seq}/contract-periods/{contractPeriodId}")
    public ResponseEntity<Void> deleteContractPeriod(@PathVariable Long seq, @PathVariable Long contractPeriodId) {
        companyPerformanceAdminService.findById(seq);
        companyPerformanceContractPeriodQueryService.delete(seq, contractPeriodId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 연결된 기술자 목록을 조회한다.
     */
    @GetMapping("/{seq}/engineers")
    public ResponseEntity<List<CompanyPerformanceEngineerResponse>> listEngineers(@PathVariable Long seq) {
        companyPerformanceAdminService.findById(seq);
        return ResponseEntity.ok(companyPerformanceEngineerQueryService.findByPerformanceSeq(seq));
    }

    /**
     * 회사실적에 연결된 공사종류 목록을 조회한다.
     *
     * <p>공사종류의 seq는 company_performances.seq를 참조하며,
     * 각 행은 공통코드 1/2/3레벨 코드 조합을 저장한다.</p>
     */
    /**
     * 공사종류 목록을 조회한다.
     */
    @GetMapping("/{seq}/construction-kinds")
    public ResponseEntity<List<CompanyPerformanceConstructionKindResponse>> listConstructionKinds(@PathVariable Long seq) {
        companyPerformanceAdminService.findById(seq);
        return ResponseEntity.ok(companyPerformanceConstructionKindQueryService.findByPerformanceSeq(seq));
    }

    /**
     * 회사실적에 공사종류 코드 조합을 추가한다.
     */
    /**
     * 공사종류를 추가한다.
     */
    @PostMapping("/{seq}/construction-kinds")
    public ResponseEntity<CompanyPerformanceConstructionKindResponse> createConstructionKind(
            @PathVariable Long seq,
            @RequestBody CompanyPerformanceConstructionKindRequest request
    ) {
        companyPerformanceAdminService.findById(seq);
        return ResponseEntity.ok(companyPerformanceConstructionKindQueryService.create(seq, request));
    }

    /**
     * 회사실적에 연결된 공사종류 코드 조합을 수정한다.
     */
    /**
     * 공사종류를 수정한다.
     */
    @PutMapping("/{seq}/construction-kinds/{constructionKindId}")
    public ResponseEntity<CompanyPerformanceConstructionKindResponse> updateConstructionKind(
            @PathVariable Long seq,
            @PathVariable Long constructionKindId,
            @RequestBody CompanyPerformanceConstructionKindRequest request
    ) {
        companyPerformanceAdminService.findById(seq);
        return ResponseEntity.ok(companyPerformanceConstructionKindQueryService.update(seq, constructionKindId, request));
    }

    /**
     * 회사실적에 연결된 공사종류 코드 조합을 삭제한다.
     */
    /**
     * 공사종류를 삭제한다.
     */
    @DeleteMapping("/{seq}/construction-kinds/{constructionKindId}")
    public ResponseEntity<Void> deleteConstructionKind(@PathVariable Long seq, @PathVariable Long constructionKindId) {
        companyPerformanceAdminService.findById(seq);
        companyPerformanceConstructionKindQueryService.delete(seq, constructionKindId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 기술자를 추가한다.
     */
    @PostMapping("/{seq}/engineers")
    public ResponseEntity<CompanyPerformanceEngineerResponse> createEngineer(
            @PathVariable Long seq,
            @RequestBody CompanyPerformanceEngineerRequest request
    ) {
        companyPerformanceAdminService.findById(seq);
        return ResponseEntity.ok(companyPerformanceEngineerQueryService.create(seq, request));
    }

    /**
     * 기술자 이력을 수정한다.
     */
    @PutMapping("/{seq}/engineers/{engineerHistoryId}")
    public ResponseEntity<CompanyPerformanceEngineerResponse> updateEngineer(
            @PathVariable Long seq,
            @PathVariable Long engineerHistoryId,
            @RequestBody CompanyPerformanceEngineerRequest request
    ) {
        companyPerformanceAdminService.findById(seq);
        return ResponseEntity.ok(companyPerformanceEngineerQueryService.update(seq, engineerHistoryId, request));
    }

    /**
     * 기술자 이력을 삭제한다.
     */
    @DeleteMapping("/{seq}/engineers/{engineerHistoryId}")
    public ResponseEntity<Void> deleteEngineer(@PathVariable Long seq, @PathVariable Long engineerHistoryId) {
        companyPerformanceAdminService.findById(seq);
        companyPerformanceEngineerQueryService.delete(seq, engineerHistoryId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 수행개요 목록을 조회한다.
     */
    @GetMapping("/{seq}/outlines")
    public ResponseEntity<List<CompanyPerformanceOutlineResponse>> listOutlines(@PathVariable Long seq) {
        companyPerformanceAdminService.findById(seq);
        return ResponseEntity.ok(companyPerformanceOutlineQueryService.findByPerformanceSeq(seq));
    }

    /**
     * 수행개요를 추가한다.
     */
    @PostMapping("/{seq}/outlines")
    public ResponseEntity<CompanyPerformanceOutlineResponse> createOutline(
            @PathVariable Long seq,
            @RequestBody CompanyPerformanceOutlineRequest request
    ) {
        companyPerformanceAdminService.findById(seq);
        return ResponseEntity.ok(companyPerformanceOutlineQueryService.create(seq, request));
    }

    /**
     * 수행개요를 수정한다.
     */
    @PutMapping("/{seq}/outlines/{outlineId}")
    public ResponseEntity<CompanyPerformanceOutlineResponse> updateOutline(
            @PathVariable Long seq,
            @PathVariable Long outlineId,
            @RequestBody CompanyPerformanceOutlineRequest request
    ) {
        companyPerformanceAdminService.findById(seq);
        return ResponseEntity.ok(companyPerformanceOutlineQueryService.update(seq, outlineId, request));
    }

    /**
     * 수행개요를 삭제한다.
     */
    @DeleteMapping("/{seq}/outlines/{outlineId}")
    public ResponseEntity<Void> deleteOutline(@PathVariable Long seq, @PathVariable Long outlineId) {
        companyPerformanceAdminService.findById(seq);
        companyPerformanceOutlineQueryService.delete(seq, outlineId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 회사 실적을 신규 등록한다.
     */
    @PostMapping
    public ResponseEntity<CompanyPerformanceResponse> create(@RequestBody CompanyPerformanceUpsertRequest request) {
        return ResponseEntity.ok(CompanyPerformanceResponse.from(companyPerformanceAdminService.create(request.toCommand())));
    }

    /**
     * 회사 실적을 수정한다.
     */
    @PutMapping("/{seq}")
    public ResponseEntity<CompanyPerformanceResponse> update(
            @PathVariable Long seq,
            @RequestBody CompanyPerformanceUpsertRequest request
    ) {
        return ResponseEntity.ok(CompanyPerformanceResponse.from(companyPerformanceAdminService.update(seq, request.toCommand())));
    }

    /**
     * 회사 실적을 삭제한다.
     */
    @DeleteMapping("/{seq}")
    public ResponseEntity<Void> delete(@PathVariable Long seq) {
        companyPerformanceAdminService.delete(seq);
        return ResponseEntity.noContent().build();
    }
}
