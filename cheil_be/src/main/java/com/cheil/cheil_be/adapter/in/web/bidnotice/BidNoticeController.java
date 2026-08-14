package com.cheil.cheil_be.adapter.in.web.bidnotice;

import java.time.LocalDate;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeSearchCondition;
import com.cheil.cheil_be.application.bidnotice.service.BidNoticeAdminService;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;
import com.cheil.cheil_be.domain.bidnotice.BidNotice;

@RestController
@RequiredArgsConstructor
public class BidNoticeController {

    private final BidNoticeAdminService bidNoticeAdminService;
    private final BidNoticeResponseMapper bidNoticeResponseMapper;

    /**
     * 입찰공고 목록을 조회한다.
     */
    @GetMapping("/pq/bid-notice")
    public ResponseEntity<PageResponse<BidNoticeResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String departmentCode,
            @RequestParam(required = false) String superDecideEmpno,
            @RequestParam(required = false) String bidType,
            @RequestParam(required = false) String businessType,
            @RequestParam(required = false) String fieldOfWorkCode,
            @RequestParam(required = false) String scopeOfWorkCode,
            @RequestParam(required = false) LocalDate bidClosingDateFrom,
            @RequestParam(required = false) LocalDate bidClosingDateTo,
            @RequestParam(required = false) LocalDate bidDateFrom,
            @RequestParam(required = false) LocalDate bidDateTo,
            @RequestParam(required = false) LocalDate pqSubmitDateFrom,
            @RequestParam(required = false) LocalDate pqSubmitDateTo,
            @RequestParam(required = false) String bidSuccessYn,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size
    ) {
        BidNoticeResponseMapper.BidNoticeResponseLookup lookup = bidNoticeResponseMapper.snapshot();
        Page<BidNotice> result = bidNoticeAdminService.findAll(
                new BidNoticeSearchCondition(
                        keyword,
                        departmentCode,
                        superDecideEmpno,
                        bidType,
                        businessType,
                        fieldOfWorkCode,
                        scopeOfWorkCode,
                        bidClosingDateFrom,
                        bidClosingDateTo,
                        bidDateFrom,
                        bidDateTo,
                        pqSubmitDateFrom,
                        pqSubmitDateTo,
                        bidSuccessYn
                ),
                PageRequests.of(page, size)
        );
        return ResponseEntity.ok(PageResponse.from(result, bidNotice -> bidNoticeResponseMapper.toResponse(bidNotice, lookup)));
    }

    /**
     * 입찰공고 단건을 조회한다.
     */
    @GetMapping("/pq/bid-notice/{bidSeq}")
    public ResponseEntity<BidNoticeResponse> get(@PathVariable Long bidSeq) {
        return ResponseEntity.ok(bidNoticeResponseMapper.toResponse(bidNoticeAdminService.findByBidSeq(bidSeq)));
    }

    /**
     * 입찰공고를 신규 등록한다.
     */
    @PostMapping("/pq/bid-notice")
    public ResponseEntity<BidNoticeResponse> create(@RequestBody BidNoticeRequest request) {
        return ResponseEntity.ok(bidNoticeResponseMapper.toResponse(bidNoticeAdminService.create(request.toCommand())));
    }

    /**
     * 기존 입찰공고를 수정한다.
     */
    @PutMapping("/pq/bid-notice/{bidSeq}")
    public ResponseEntity<BidNoticeResponse> update(
            @PathVariable Long bidSeq,
            @RequestBody BidNoticeRequest request
    ) {
        return ResponseEntity.ok(bidNoticeResponseMapper.toResponse(bidNoticeAdminService.update(bidSeq, request.toCommand())));
    }

    /**
     * 입찰공고를 삭제한다.
     */
    @DeleteMapping("/pq/bid-notice/{bidSeq}")
    public ResponseEntity<Void> delete(@PathVariable Long bidSeq) {
        bidNoticeAdminService.delete(bidSeq);
        return ResponseEntity.noContent().build();
    }

}
