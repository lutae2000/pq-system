package com.cheil.cheil_be.adapter.in.web.g2bbidnotice;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.g2bbidnotice.port.in.G2bBidNoticeCandidateQueryUseCase;
import com.cheil.cheil_be.application.g2bbidnotice.port.in.G2bBidNoticeCandidateSearchCondition;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;
import com.cheil.cheil_be.domain.g2bbidnotice.G2bBidNoticeCandidate;

@RestController
@RequiredArgsConstructor
public class G2bBidNoticeCandidateController {

    private final G2bBidNoticeCandidateQueryUseCase queryUseCase;

    @DeleteMapping("/pq/g2b-bid-notice-candidates")
    public ResponseEntity<Void> delete(@RequestBody G2bBidNoticeCandidateDeleteRequest request) {
        queryUseCase.deleteAllById(request == null ? null : request.ids());
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/pq/g2b-bid-notice-candidates")
    public ResponseEntity<PageResponse<G2bBidNoticeCandidateResponse>> list(
            @RequestParam(required = false) String bidNtceNo,
            @RequestParam(required = false) String ntceKindNm,
            @RequestParam(required = false) String cntrctCnclsMthdNm,
            @RequestParam(required = false) String srvceDivNm,
            @RequestParam(required = false) String bidNtceNm,
            @RequestParam(required = false) String ntceInsttNm,
            @RequestParam(required = false) String befBidBbancNo,
            @RequestParam(required = false) String importedYn,
            @RequestParam(required = false) String relatedBidNtceNos,
            @RequestParam(required = false, defaultValue = "false") boolean orderById,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Page<G2bBidNoticeCandidate> result = queryUseCase.findAll(
                new G2bBidNoticeCandidateSearchCondition(
                        bidNtceNo,
                        ntceKindNm,
                        cntrctCnclsMthdNm,
                        srvceDivNm,
                        bidNtceNm,
                        ntceInsttNm,
                        befBidBbancNo,
                        importedYn,
                        relatedBidNtceNos,
                        orderById
                ),
                PageRequests.of(page, size)
        );
        return ResponseEntity.ok(PageResponse.from(result, G2bBidNoticeCandidateResponse::from));
    }

    @PatchMapping("/pq/g2b-bid-notice-candidates/{candidateId}/import")
    public ResponseEntity<Void> markImported(
            @PathVariable Long candidateId,
            @RequestBody G2bBidNoticeCandidateImportRequest request
    ) {
        queryUseCase.markImported(candidateId, request.bidSeq(), request.importedBy());
        return ResponseEntity.noContent().build();
    }
}
