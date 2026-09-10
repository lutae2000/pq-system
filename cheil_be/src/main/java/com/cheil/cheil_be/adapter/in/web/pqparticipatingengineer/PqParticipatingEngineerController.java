package com.cheil.cheil_be.adapter.in.web.pqparticipatingengineer;

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

import com.cheil.cheil_be.application.engineer.EngineerDtos;
import com.cheil.cheil_be.application.pqparticipatingengineer.service.PqParticipatingEngineerQueryService;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;

@RestController
@RequestMapping("/pq/participating-engineers")
@RequiredArgsConstructor
public class PqParticipatingEngineerController {

    private final PqParticipatingEngineerQueryService queryService;

    /**
     * 선정/후보 기술자 후보 목록을 조회한다.
     */
    @GetMapping("/candidates")
    public ResponseEntity<PageResponse<PqParticipatingEngineerCandidateResponse>> listCandidates(
            @RequestParam(required = false) Long bidSeq,
            @RequestParam(required = false) String workDutyId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String certificationName,
            @RequestParam(required = false) String constructionManagementGrade,
            @RequestParam(required = false) String designGrade,
            @RequestParam(required = false) String jobField,
            @RequestParam(required = false) String specialtyField,
            @RequestParam(required = false) String retireYn,
            @RequestParam(required = false) String projectHistoryConditions,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Page<PqParticipatingEngineerCandidateResponse> result = queryService.findCandidates(
                bidSeq,
                workDutyId,
                keyword,
                certificationName,
                constructionManagementGrade,
                designGrade,
                jobField,
                specialtyField,
                retireYn,
                projectHistoryConditions,
                PageRequests.of(page, size)
        );
        return ResponseEntity.ok(PageResponse.from(result));
    }

    /**
     * 선택된 기술자의 인사정보 요약을 조회한다.
     */
    @GetMapping("/profiles")
    public ResponseEntity<List<EngineerDtos.Profile>> listSelectedProfiles(
            @RequestParam Long bidSeq,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(queryService.findSelectedProfiles(bidSeq, keyword));
    }

    @GetMapping("/profiles/summary")
    public ResponseEntity<List<EngineerDtos.Profile>> listSelectedProfileSummaries(
            @RequestParam Long bidSeq,
            @RequestParam(required = false) String workDutyId,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(queryService.findSelectedProfileSummaries(bidSeq, workDutyId, keyword));
    }

    /**
     * 선정된 기술자 목록을 조회한다.
     */
    @GetMapping
    public ResponseEntity<List<PqParticipatingEngineerResponse>> listSelected(
            @RequestParam Long bidSeq,
            @RequestParam(required = false) String workDutyId
    ) {
        return ResponseEntity.ok(queryService.findSelected(bidSeq, workDutyId));
    }

    /**
     * 선정 기술자를 추가한다.
     */
    @PostMapping
    public ResponseEntity<PqParticipatingEngineerResponse> create(@RequestBody PqParticipatingEngineerRequest request) {
        return ResponseEntity.ok(queryService.create(request));
    }

    /**
     * 선정 기술자 정보를 수정한다.
     */
    @PutMapping("/{bidSeq}/{workDutyId}/{engrId}")
    public ResponseEntity<PqParticipatingEngineerResponse> update(
            @PathVariable Long bidSeq,
            @PathVariable String workDutyId,
            @PathVariable String engrId,
            @RequestBody PqParticipatingEngineerRequest request
    ) {
        return ResponseEntity.ok(queryService.update(bidSeq, workDutyId, engrId, request));
    }

    /**
     * 선정 기술자를 삭제한다.
     */
    @DeleteMapping("/{bidSeq}/{workDutyId}/{engrId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long bidSeq,
            @PathVariable String workDutyId,
            @PathVariable String engrId
    ) {
        queryService.delete(bidSeq, workDutyId, engrId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 선정 기술자 목록을 일괄 교체한다.
     */
    @PutMapping
    public ResponseEntity<List<PqParticipatingEngineerResponse>> replace(@RequestBody ReplacePqParticipatingEngineersRequest request) {
        return ResponseEntity.ok(queryService.replace(request));
    }
}
