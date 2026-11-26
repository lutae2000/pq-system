package com.cheil.cheil_be.adapter.in.web.bidnotice;

import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionDetailQuery;
import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeSubmissionStatusUseCase;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/pq/submit-stat")
@RequiredArgsConstructor
public class BidNoticeSubmissionStatusController {
    private final BidNoticeSubmissionStatusUseCase useCase;

    @GetMapping
    public List<SubmissionCountResponse> list(
            @RequestParam int year,
            @RequestParam(defaultValue = "12") int throughMonth
    ) {
        return useCase.findByDepartmentAndYear(year, throughMonth).stream()
                .map(count -> new SubmissionCountResponse(
                        count.departmentCode(), count.year(), count.count(), count.monthlyCount(), count.total()))
                .toList();
    }

    public record SubmissionCountResponse(String departmentCode, int year, long count, long monthlyCount, boolean total) {}

    @GetMapping("/details")
    public PageResponse<SubmissionDetailResponse> details(
            @RequestParam int firstYear,
            @RequestParam int lastYear,
            @RequestParam int fromMonth,
            @RequestParam int throughMonth,
            @RequestParam(required = false) String departmentCode,
            @RequestParam(defaultValue = "false") boolean allDepartments,
            Pageable pageable
    ) {
        var query = new BidNoticeSubmissionDetailQuery(firstYear, lastYear, fromMonth, throughMonth, departmentCode, allDepartments);
        return PageResponse.from(useCase.findDetails(query, PageRequests.of(pageable)), detail -> new SubmissionDetailResponse(
                detail.bidSeq(), detail.projectName(), detail.departmentCode(), detail.pqSubmitDate(), detail.g2bBidNtceNo(),
                detail.participateYn(), detail.bidSuccessYn(), detail.businessType(), detail.orderClient(), detail.orderClientName(),
                detail.announceDate(), detail.bidClosingDate(), detail.bidSubmissionDate(), detail.bidDate(), detail.designAmt(),
                detail.superDecideEmpno()));
    }

    public record SubmissionDetailResponse(
            long bidSeq, String projectName, String departmentCode, String pqSubmitDate, String g2bBidNtceNo,
            String participateYn, String bidSuccessYn, String businessType, String orderClient, String orderClientName,
            String announceDate, String bidClosingDate, String bidSubmissionDate, String bidDate, BigDecimal designAmt,
            String superDecideEmpno
    ) {}
}
